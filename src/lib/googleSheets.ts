import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { VisitorRecord } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");

// Constant Spreadsheet config
export const SPREADSHEET_ID = "1xDj8iqdqHHSnpa4-QCB2tck9kHS0zkenSNWGPtfcGcA";
export const SHEET_NAME = "รายชื่อผู้เยี่ยมชม";

// In-memory token cache (as mandated by workspace-integration guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Since Firebase doesn't persist the raw Google access token between reloads automatically,
        // we might need to prompt the user to sign-in again with Google if we need access to Sheets,
        // or we can allow them to re-integrate on click.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("ล้มเหลวในการดึง access token สิทธิ์ความปลอดภัยจาก Google");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log out Google session
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Get cached token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Map raw sheets row to VisitorRecord
const parseRowToVisitor = (row: any[], index: number): VisitorRecord => {
  return {
    id: row[0] || `v-sheet-${index}`,
    firstName: row[1] || "",
    lastName: row[2] || "",
    organization: row[3] || "",
    timestamp: row[4] ? parseInt(row[4], 10) : Date.now(),
    dateString: row[5] || new Date().toISOString().split("T")[0]
  };
};

// Fetch visitors from Google Sheet
export const fetchVisitorsFromSheet = async (token: string): Promise<VisitorRecord[]> => {
  const range = encodeURIComponent(`${SHEET_NAME}!A2:F`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const rows = data.values || [];
    
    return rows.map((row: any[], i: number) => parseRowToVisitor(row, i + 1));
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    throw error;
  }
};

// Create sheet headers if sheet is empty/new
export const initSheetHeaders = async (token: string): Promise<void> => {
  const range = encodeURIComponent(`${SHEET_NAME}!A1:F1`);
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  
  try {
    const checkRes = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0) {
        // Headers already exist
        return;
      }
    }

    // Write headers
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
    await fetch(writeUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: `${SHEET_NAME}!A1:F1`,
        majorDimension: "ROWS",
        values: [
          ["ID", "ชื่อ", "นามสกุล", "หน่วยสังกัด/สถานภาพ", "Timestamp", "dateString"]
        ]
      })
    });
  } catch (err) {
    console.error("Failed to check/init headers in spreadsheet:", err);
  }
};

// Append a single visitor to Google Sheet
export const appendVisitorToSheet = async (token: string, visitor: VisitorRecord): Promise<void> => {
  // Ensure headers are initialized first
  await initSheetHeaders(token);

  const range = encodeURIComponent(`${SHEET_NAME}!A:F`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const values = [
    [
      visitor.id,
      visitor.firstName,
      visitor.lastName,
      visitor.organization,
      visitor.timestamp.toString(),
      visitor.dateString
    ]
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      range: `${SHEET_NAME}!A:F`,
      majorDimension: "ROWS",
      values
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `HTTP ${response.status} failed to append visitor`);
  }
};
