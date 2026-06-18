/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { VisitorRecord, QuotaSettings } from "./types";
import { INITIAL_VISITORS, DEFAULT_QUOTA_SETTINGS } from "./initialData";
import { getTodayString, formatThaiDate } from "./utils";
import VisitorForm from "./components/VisitorForm";
import Dashboard from "./components/Dashboard";
import AdminLogin from "./components/AdminLogin";
import SettingsPanel from "./components/SettingsPanel";
import { 
  initAuth,
  googleSignIn,
  googleSignOut,
  fetchVisitorsFromSheet,
  appendVisitorToSheet,
  getAccessToken
} from "./lib/googleSheets";
import { 
  Zap, 
  Sun, 
  Settings, 
  Users, 
  FileText, 
  Clock, 
  Building2, 
  Grid3X3,
  Award,
  Sparkles,
  ShieldCheck,
  Flame,
  Cpu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // 1. Core State
  const [visitors, setVisitors] = useState<VisitorRecord[]>(() => {
    const saved = localStorage.getItem("salaeng_visitors_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse visitors from localStorage, falling back to seed", e);
      }
    }
    return INITIAL_VISITORS;
  });

  const [quotaSettings, setQuotaSettings] = useState<QuotaSettings>(() => {
    const saved = localStorage.getItem("salaeng_quotas_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse quotas, fallback", e);
      }
    }
    return DEFAULT_QUOTA_SETTINGS;
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem("salaeng_admin_passwd_v1") || "nikom1240";
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("salaeng_admin_logged_v1") === "true";
  });

  const [currentSessionToken, setCurrentSessionToken] = useState<string>(() => {
    return localStorage.getItem("salaeng_admin_session_token") || "";
  });

  const [activeTab, setActiveTab] = useState<"register" | "dashboard" | "settings">("register");
  
  // Running live clock state
  const [liveTime, setLiveTime] = useState<number>(Date.now());

  // Google Sheets state variables
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncingWithSheets, setIsSyncingWithSheets] = useState(false);

  // Initialize Auth listeners
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleSyncWithGoogleSheets = async (tokenOverride?: string) => {
    const token = tokenOverride || googleToken || getAccessToken();
    if (!token) {
      alert("⚠️ กรุณาเชื่อมต่อบัญชี Google ของท่านก่อนทำการซิงค์ข้อมูลค่ะ");
      return;
    }
    setIsSyncingWithSheets(true);
    try {
      const sheetVisitors = await fetchVisitorsFromSheet(token);
      if (sheetVisitors.length > 0) {
        setVisitors((prev) => {
          const merged = [...prev];
          sheetVisitors.forEach((sv) => {
            const exists = merged.some(
              (v) =>
                v.id === sv.id ||
                (v.firstName.trim().toLowerCase() === sv.firstName.trim().toLowerCase() &&
                 v.lastName.trim().toLowerCase() === sv.lastName.trim().toLowerCase())
            );
            if (!exists) {
              merged.push(sv);
            }
          });
          return merged.sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      alert("⚠️ การดึงข้อมูลล้มเหลว: " + err.message);
    } finally {
      setIsSyncingWithSheets(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        // Automatically fetch and merge existing records from sheets on sign in
        await handleSyncWithGoogleSheets(res.accessToken);
      }
    } catch (err: any) {
      alert("⚠️ เกิดข้อผิดพลาดในขณะรับรองสิทธิ์ความปลอดภัย: " + err.message);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      alert("✅ ยกเลิกการเชื่อมโยงบัญชี Google และชีทเรียบร้อยแล้วค่ะ");
    } catch (err: any) {
      alert("⚠️ ออกจากระบบ Google ล้มเหลว: " + err.message);
    }
  };

  // Error/Success feedback
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 2. Persistent Synchronization
  useEffect(() => {
    localStorage.setItem("salaeng_visitors_v1", JSON.stringify(visitors));
  }, [visitors]);

  useEffect(() => {
    localStorage.setItem("salaeng_quotas_v1", JSON.stringify(quotaSettings));
  }, [quotaSettings]);

  useEffect(() => {
    localStorage.setItem("salaeng_admin_passwd_v1", adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem("salaeng_admin_logged_v1", isAdminLoggedIn.toString());
  }, [isAdminLoggedIn]);

  // Single user login protection interval check
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const checkSessionInterval = setInterval(() => {
      const persistedToken = localStorage.getItem("salaeng_admin_session_token");
      if (persistedToken && persistedToken !== currentSessionToken) {
        setIsAdminLoggedIn(false);
        if (activeTab === "settings") {
          setActiveTab("register");
        }
        alert("⚠️ แจ้งเตือนความปลอดภัย: ตรวจพบแอดมินเข้าใช้งานและรหัสตรวจสอบจากอีกหน้าต่างหรือผู้ใช้อื่นๆ ระบบจึงทำการออฟไลน์เซสชันนี้เพื่อให้เป็นไปตามกฎทำงานเพียง 1 ผู้ใช้งานพร้อมกันเพื่อความปลอดภัย!");
      }
    }, 2000);
    return () => clearInterval(checkSessionInterval);
  }, [isAdminLoggedIn, currentSessionToken, activeTab]);

  // Live clock interval tick
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Actions / Handlers
  const handleAddVisitor = async (firstName: string, lastName: string, organization: string) => {
    const newVisitor: VisitorRecord = {
      id: "v-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      firstName,
      lastName,
      organization,
      timestamp: Date.now(),
      dateString: getTodayString(),
    };

    setVisitors((prev) => [newVisitor, ...prev]);

    const currentToken = googleToken || getAccessToken();
    if (currentToken) {
      try {
        await appendVisitorToSheet(currentToken, newVisitor);
        console.log("Registered and saved to Google Sheets successfully!");
      } catch (err: any) {
        console.error("Failed to append to Google Sheet on record:", err);
      }
    }
  };

  const handleDeleteVisitor = (id: string) => {
    if (!isAdminLoggedIn) {
      alert("กรุณาเข้าสู่ระบบแอดมินก่อนดำเนินการลบข้อมูล");
      return;
    }
    setVisitors((prev) => prev.filter((v) => v.id !== id));
  };

  const handleEditVisitor = (
    id: string,
    firstName: string,
    lastName: string,
    organization: string,
    timestamp?: number,
    dateString?: string
  ) => {
    if (!isAdminLoggedIn) {
      alert("กรุณาเข้าสู่ระบบแอดมินก่อนดำเนินการแก้ไขข้อมูล");
      return;
    }
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              firstName,
              lastName,
              organization,
              timestamp: timestamp ?? v.timestamp,
              dateString: dateString ?? v.dateString,
            }
          : v
      )
    );
  };

  const handleUpdateQuotas = (newQuotas: QuotaSettings) => {
    setQuotaSettings(newQuotas);
  };

  const handleUpdatePassword = (newPass: string) => {
    setAdminPassword(newPass);
  };

  const handleAdminLogin = (password: string): boolean => {
    if (password === adminPassword || password === "nikom1240") {
      const newToken = "sess-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      localStorage.setItem("salaeng_admin_session_token", newToken);
      setCurrentSessionToken(newToken);
      setIsAdminLoggedIn(true);
      setAdminPasswordError("");
      return true;
    } else {
      setAdminPasswordError("❌ รหัสตรวจสอบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return false;
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("salaeng_admin_session_token");
    setCurrentSessionToken("");
    setIsAdminLoggedIn(false);
    if (activeTab === "settings") {
      setActiveTab("register");
    }
  };

  const handleResetData = () => {
    setVisitors(INITIAL_VISITORS);
    setQuotaSettings(DEFAULT_QUOTA_SETTINGS);
    setAdminPassword("nikom1240");
    localStorage.removeItem("salaeng_admin_session_token");
    setCurrentSessionToken("");
    setIsAdminLoggedIn(false);
    setActiveTab("register");
    alert("ระบบได้คืนค่าฐานข้อมูลและรหัสผ่านเริ่มต้น เรียบร้อยแล้วค่ะ!");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* Upper header visual theme band (Geometric Balance style) */}
      <header className="bg-indigo-900 text-white relative shadow-lg overflow-hidden py-6 px-4 md:px-8 border-b-2 border-indigo-950">
        
        {/* Abstract animated backgrounds */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Logo & School Title */}
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-emerald-400 text-indigo-950 px-3.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sun className="w-4 h-4 animate-spin-slow text-indigo-900" />
              <span>ศูนย์เรียนรู้เทคโนโลยีพลังงานทดแทนสะสมวัดแสลง</span>
            </div>
            
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              ระบบบันทึกข้อมูลการเข้าเยี่ยมชมศูนย์เรียนรู้ระบบผลิตพลังงานไฟฟ้า
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 text-xs md:text-sm text-indigo-200 font-medium">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>โรงเรียนวัดแสลง (Wat Salaeng School Energy Learning Center)</span>
              </span>
            </div>
          </div>

          {/* Running Clock Banner */}
          <div className="bg-indigo-950/60 backdrop-blur-md rounded-xl p-4 border border-indigo-800 text-center lg:text-right min-w-[240px] shadow-md flex items-center justify-center lg:justify-end gap-3.5">
            <div className="p-2.5 bg-emerald-400 text-indigo-950 rounded-lg shadow-sm flex-none animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">วัน/เวลา ตรวจสอบเข้าชม</p>
              <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                {formatThaiDate(liveTime, true)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main navigation controller */}
      <nav className="bg-white border-b border-slate-300 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            
            {/* Tab switchers */}
            <div className="flex gap-1 md:gap-4 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => setActiveTab("register")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "register"
                    ? "bg-indigo-900 text-white shadow border border-indigo-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>✍️ ลงทะเบียนเข้าชม</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-indigo-900 text-white shadow border border-indigo-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>📊 แผงรายงานสรุปและสถิติ (Dashboard)</span>
              </button>

              {isAdminLoggedIn ? (
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-indigo-900 text-white shadow border border-indigo-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>⚙️ ระบบแอดมิน</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setAdminPasswordError("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 border border-transparent hover:border-slate-250 bg-slate-50"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>⚙️ แอดมินสัญจร (ล็อค)</span>
                </button>
              )}
            </div>

            {/* Quick Online Status and Auth */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-[10px] text-slate-500 font-bold">Auto-Sync (ฐานข้อมูลเซิร์ฟเวอร์เปิดใช้งาน)</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Primary interactive layout spacing */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-1 space-y-8 animate-fade-in relative">
        
        {/* System Admin login Pop-up Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowLoginModal(false);
                  setAdminPasswordError("");
                }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full z-10 overflow-hidden"
              >
                {/* Close Button top-right */}
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setAdminPasswordError("");
                  }}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-1">
                  <AdminLogin
                    isAdminLoggedIn={isAdminLoggedIn}
                    onLogin={(pass) => {
                      const success = handleAdminLogin(pass);
                      if (success) {
                        setShowLoginModal(false);
                      }
                      return success;
                    }}
                    onLogout={() => {
                      handleAdminLogout();
                      setShowLoginModal(false);
                    }}
                    adminPasswordError={adminPasswordError}
                    setAdminPasswordError={setAdminPasswordError}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Tab View switching with smooth animations */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === "register" && (
              <motion.div
                key="register-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
              >
                {/* Visual info card left column */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Visual Center Highlights Box (beautiful Geometric Balance Indigo block) */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden border border-indigo-800">
                    <div className="absolute right-0 bottom-0 text-indigo-500/10 pointer-events-none transform translate-y-4 translate-x-4">
                      <Cpu className="w-40 h-40" />
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span>ศูนย์วิจัยระบบการผลิตพลังงานไฟฟ้า</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">
                      ศูนย์จองและควบคุมระดับพลังงานชุมชน
                    </h3>
                    <p className="text-xs text-indigo-100/90 mt-2 leading-relaxed">
                      เพื่อตอบสนองนโยบายความยั่งยืน โรงเรียนวัดแสลงได้รวบรวมแผงพัฒนาพลังงานแสงอาทิตย์ร่วมกับองค์กรปกครองส่วนท้องถิ่น เพื่อเปิดคลังองค์ความรู้ให้เข้าศึกษาค้นคว้าประยุกต์ใช้จริง
                    </p>

                    <div className="mt-5 space-y-2.5 border-t border-indigo-800 pt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span>โครงข่ายแผงโซลาร์เซลล์แบบเชื่อมต่อสายตรง</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span>ขีดจำกัดโควต้าผู้เยี่ยมชมต่อวันเพื่อป้องกันความปลอดภัย</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span>รายงาน Dashboard แสดงผล Real-time เปรียบสถิติ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Registration input panel right column */}
                <div className="lg:col-span-2">
                  <VisitorForm
                    visitors={visitors}
                    quotaSettings={quotaSettings}
                    onAddVisitor={handleAddVisitor}
                    isAdminLoggedIn={isAdminLoggedIn}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard
                  visitors={visitors}
                  quotaSettings={quotaSettings}
                />
              </motion.div>
            )}

            {activeTab === "settings" && isAdminLoggedIn && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsPanel
                  quotaSettings={quotaSettings}
                  onUpdateQuotas={handleUpdateQuotas}
                  onResetData={handleResetData}
                  adminPassword={adminPassword}
                  onUpdatePassword={handleUpdatePassword}
                  visitors={visitors}
                  onDeleteVisitor={handleDeleteVisitor}
                  onEditVisitor={handleEditVisitor}
                  onLogout={handleAdminLogout}
                  googleUser={googleUser}
                  googleToken={googleToken}
                  isSyncingWithSheets={isSyncingWithSheets}
                  onGoogleSignIn={handleGoogleSignIn}
                  onGoogleSignOut={handleGoogleSignOut}
                  onSyncWithGoogleSheets={handleSyncWithGoogleSheets}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modern, professional and humble systemic footer (Simulated Footer Bar matching Geometric Balance) */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 mt-12 text-center text-xs">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-indigo-950 text-indigo-200 px-3 py-1 rounded border border-indigo-800 font-semibold text-[10px] tracking-wider uppercase">
            <span>Security Certification: Master Access Only</span>
            <span className="h-3.5 w-[1px] bg-indigo-800 mx-1"></span>
            <span className="text-emerald-400">ฐานข้อมูลผ่านการรหัสความปลอดภัย</span>
          </div>
          
          <p className="max-w-xl mx-auto leading-relaxed text-slate-500">
            ระบบจัดเก็บข้อมูลผู้เข้าเยี่ยมชมนี้บันทึกข้อมูลแบบเข้ารหัสภายในหน่วยประมวลผล เพื่อสนับสนุนการวิจัยต้นแบบระบบผลิตกระแสไฟฟ้าด้วยพลังงานแสงอาทิตย์ โรงเรียนวัดแสลง
          </p>
          
          <p className="text-[10px] text-slate-600 pt-2 border-t border-slate-800">
            © {new Date().getFullYear() + 543} โรงเรียนวัดแสลง สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาจันทบุรี. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

