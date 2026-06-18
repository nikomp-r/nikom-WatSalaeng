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
provider.addScope("https://www.googleapis.com/auth/drive");

// Constant Spreadsheet config
export const SPREADSHEET_ID = "1xDj8iqdqHHSnpa4-QCB2tck9kHS0zkenSNWGPtfcGcA";
export const SHEET_NAME = "รายชื่อผู้เยี่ยมชม";

// Token cache that persists across refreshes using localStorage fallback
let cachedAccessToken: string | null = typeof window !== "undefined" ? localStorage.getItem("salaeng_google_token") : null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== "undefined") {
        cachedAccessToken = localStorage.getItem("salaeng_google_token");
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("salaeng_google_token");
      }
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
    if (typeof window !== "undefined") {
      localStorage.setItem("salaeng_google_token", credential.accessToken);
    }
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
  if (typeof window !== "undefined") {
    localStorage.removeItem("salaeng_google_token");
  }
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
export const ensureSheetTabExists = async (token: string): Promise<string> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const sheets = data.sheets || [];
    
    const exists = sheets.some((s: any) => s.properties?.title === SHEET_NAME);
    if (exists) {
      return SHEET_NAME;
    }

    // Attempt to dynamically create the sheet tab name "รายชื่อผู้เยี่ยมชม"
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;
    const batchRes = await fetch(batchUpdateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAME
              }
            }
          }
        ]
      })
    });

    if (batchRes.ok) {
      console.log(`Successfully created sheet tab: ${SHEET_NAME}`);
      return SHEET_NAME;
    } else {
      console.warn("Unable to create specified sheet tab, checking available options...");
      if (sheets.length > 0 && sheets[0].properties?.title) {
        return sheets[0].properties.title;
      }
      return "Sheet1";
    }
  } catch (error) {
    console.error("Error in ensureSheetTabExists, fallback to Sheet1:", error);
    return "Sheet1";
  }
};

// Fetch visitors from Google Sheet
export const fetchVisitorsFromSheet = async (token: string): Promise<VisitorRecord[]> => {
  try {
    const activeSheet = await ensureSheetTabExists(token);
    const range = encodeURIComponent(`${activeSheet}!A2:F`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    
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
export const initSheetHeaders = async (token: string, activeSheetName?: string): Promise<string> => {
  const activeSheet = activeSheetName || await ensureSheetTabExists(token);
  const range = encodeURIComponent(`${activeSheet}!A1:F1`);
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  
  try {
    const checkRes = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0) {
        // Headers already exist
        return activeSheet;
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
        range: `${activeSheet}!A1:F1`,
        majorDimension: "ROWS",
        values: [
          ["ID", "ชื่อ", "นามสกุล", "หน่วยสังกัด/สถานภาพ", "Timestamp", "dateString"]
        ]
      })
    });
  } catch (err) {
    console.error("Failed to check/init headers in spreadsheet:", err);
  }
  return activeSheet;
};

// Append a single visitor to Google Sheet
export const appendVisitorToSheet = async (token: string, visitor: VisitorRecord): Promise<void> => {
  // Ensure headers are initialized and get the appropriate sheet tab name to append to
  const activeSheet = await initSheetHeaders(token);

  const range = encodeURIComponent(`${activeSheet}!A:F`);
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
      range: `${activeSheet}!A:F`,
      majorDimension: "ROWS",
      values
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `HTTP ${response.status} failed to append visitor`);
  }
};

// Upload a CSV copy directly to user's Google Drive
export const uploadBackupToDrive = async (token: string, csvContent: string, fileName: string): Promise<any> => {
  const metadata = {
    name: fileName,
    mimeType: "text/csv"
  };

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: body
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `HTTP ${res.status}`);
  }

  return await res.json();
};

// List CSV logs backups stored in Google Drive
export const listBackupsInDrive = async (token: string): Promise<any[]> => {
  const query = encodeURIComponent("name contains 'รายงานผู้เข้าชม_วัดแสลง' and mimeType = 'text/csv' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime%20desc&fields=files(id,name,webViewLink,createdTime)&pageSize=10`;
  
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error("Error listing files from Google Drive:", error);
    return [];
  }
};
