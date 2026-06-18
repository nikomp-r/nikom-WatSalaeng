import React, { useState } from "react";
import { QuotaSettings, VisitorRecord } from "../types";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  ShieldAlert, 
  Sliders, 
  Info, 
  Server, 
  Key, 
  RefreshCw, 
  LogOut,
  Cloud,
  ExternalLink,
  Database,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import RealtimeLogs from "./RealtimeLogs";

interface SettingsPanelProps {
  quotaSettings: QuotaSettings;
  onUpdateQuotas: (newQuotas: QuotaSettings) => void;
  onResetData: () => void;
  adminPassword: string;
  onUpdatePassword: (newPass: string) => void;
  visitors: VisitorRecord[];
  onDeleteVisitor: (id: string) => void;
  onEditVisitor: (
    id: string,
    firstName: string,
    lastName: string,
    organization: string,
    timestamp: number,
    dateString: string
  ) => void;
  onLogout: () => void;
  googleUser: any;
  googleToken: string | null;
  isSyncingWithSheets: boolean;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onSyncWithGoogleSheets: () => Promise<void>;
}

export default function SettingsPanel({
  quotaSettings,
  onUpdateQuotas,
  onResetData,
  adminPassword,
  onUpdatePassword,
  visitors,
  onDeleteVisitor,
  onEditVisitor,
  onLogout,
  googleUser,
  googleToken,
  isSyncingWithSheets,
  onGoogleSignIn,
  onGoogleSignOut,
  onSyncWithGoogleSheets,
}: SettingsPanelProps) {
  const [dailyVal, setDailyVal] = useState(quotaSettings.daily.toString());
  const [monthlyVal, setMonthlyVal] = useState(quotaSettings.monthly.toString());
  const [yearlyVal, setYearlyVal] = useState(quotaSettings.yearly.toString());

  const [newPassword, setNewPassword] = useState("");
  const [passMessage, setPassMessage] = useState("");
  const [quotaMessage, setQuotaMessage] = useState("");

  const handleUpdateQuotasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaMessage("");

    const d = parseInt(dailyVal);
    const m = parseInt(monthlyVal);
    const y = parseInt(yearlyVal);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d <= 0 || m <= 0 || y <= 0) {
      setQuotaMessage("⚠️ กรุณากรอกจำนวนเต็มที่มากกว่า 0 เป็นค่าตัวเลขข");
      return;
    }

    onUpdateQuotas({ daily: d, monthly: m, yearly: y });
    setQuotaMessage("✅ บันทึกการจำกัดค่าโควต้าจำนวนคนเข้าชมสำเร็จ!");
    setTimeout(() => setQuotaMessage(""), 4000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage("");

    if (!newPassword.trim()) {
      setPassMessage("⚠️ รหัสผ่านห้ามว่างเปล่า");
      return;
    }
    if (newPassword.length < 4) {
      setPassMessage("⚠️ รหัสผ่านควรสั้นที่สุด 4 ตัวอักษร");
      return;
    }

    onUpdatePassword(newPassword.trim());
    setNewPassword("");
    setPassMessage("✅ เปลี่ยนรหัสผ่านส่วนกลางใหม่สำเร็จแล้ว!");
    setTimeout(() => setPassMessage(""), 4000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-amber-100 shadow-xl overflow-hidden p-6 md:p-8 space-y-8">
        
        {/* Title & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-700 animate-spin-slow" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              ⚙️ ระบบแอดมิน (Admin Control Panel)
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ระบบป้องกัน Single Active Session</span>
            </span>
            
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-rose-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ (Logout)</span>
            </button>
          </div>
        </div>

        {/* Google Sheets Integration Section */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl shadow-inner">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>เชื่อมต่อ Google Sheets API</span>
                  {googleToken ? (
                    <span className="text-[10px] bg-emerald-200 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-600" />
                      เชื่อมโยงสำเร็จ
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      ยังไม่ได้เชื่อมต่อ
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-semibold max-w-xl">
                  บันทึกข้อมูลการลงทะเบียนรายละเอียดผู้เข้าเยี่ยมชม และสำรองข้อมูลไปที่ Google Sheets อย่างมีประสิทธิภาพ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-center md:self-auto">
              {googleToken ? (
                <>
                  <button
                    onClick={() => onSyncWithGoogleSheets()}
                    disabled={isSyncingWithSheets}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithSheets ? "animate-spin" : ""}`} />
                    <span>{isSyncingWithSheets ? "กำลังซิงค์..." : "ดึง/ซิงค์จากชีทบัดนี้"}</span>
                  </button>

                  <button
                    onClick={() => onGoogleSignOut()}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ยกเลิกเชื่อมต่อ</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onGoogleSignIn()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>เชื่อมต่อ Google Sheets</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200 text-xs">
            <div className="bg-white/60 p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">ID ของสเปรดชีต (Spreadsheet ID)</span>
              <span className="font-mono text-slate-750 font-bold break-all select-all">1xDj8iqdqHHSnpa4-QCB2tck9kHS0zkenSNWGPtfcGcA</span>
            </div>
            <div className="bg-white/60 p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1 flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">ชื่อเวิร์กชีต (Active Sheet Name)</span>
                <span className="font-sans text-slate-800 font-black">รายชื่อผู้เยี่ยมชม</span>
              </div>
              <a
                href="https://docs.google.com/spreadsheets/d/1xDj8iqdqHHSnpa4-QCB2tck9kHS0zkenSNWGPtfcGcA/edit"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100"
              >
                <span>เปิดไปที่ Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {googleUser && (
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>ล็อกอินบัญชี Google อยู่ในขณะนี้: <strong>{googleUser.email}</strong> ({googleUser.displayName})</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Quota limit controls */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>ปรับวงเงินโควต้าจำนวนคนเข้าชม (Quota Settings)</span>
          </div>
          
          <form onSubmit={handleUpdateQuotasSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">จำกัดสูงสุด/วัน</label>
                <input
                  type="number"
                  value={dailyVal}
                  onChange={(e) => setDailyVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">จำกัดสูงสุด/เดือน</label>
                <input
                  type="number"
                  value={monthlyVal}
                  onChange={(e) => setMonthlyVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">จำกัดสูงสุด/ปี</label>
                <input
                  type="number"
                  value={yearlyVal}
                  onChange={(e) => setYearlyVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-gray-800"
                />
              </div>
            </div>

            {quotaMessage && (
              <p className="text-xs font-semibold">{quotaMessage}</p>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกการตั้งค่าโควต้า</span>
            </button>
          </form>
        </div>

        {/* Password config area */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
            <Key className="w-4 h-4 text-amber-500" />
            <span>เปลี่ยนรหัสผ่านแอดมินส่วนกลาง</span>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">รหัสผ่านสำหรับเข้าแก้ไขข้อมูล</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่ที่นี่"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
              />
            </div>

            {passMessage && (
              <p className="text-xs font-semibold">{passMessage}</p>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>เปลี่ยนรหัสผ่านแอดมิน</span>
            </button>
          </form>
        </div>
      </div>

      {/* Database/Seeding Reset Section */}
      <div className="border-t border-dashed border-gray-200 pt-6">
        <div className="bg-rose-50 border border-rose-100/70 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-950">
                โซนควบคมข้อมูลส่วนกลางและคืนค่าระบบ
              </p>
              <p className="text-xs text-rose-700/80 mt-1">
                การกดปุ่มเคลียร์ข้อมูลจะเป็นการลบผู้เข้าเยี่ยมชมทั้งหมดและโหลดข้อมูลเริ่มต้น (Mock Items) เข้ามาใหม่เพื่อทดสอบระบบหน้ารายงาน
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm("คุณต้องการล้างข้อมูลผู้เข้าเยี่ยมชมใหม่ทั้งหมดใช่หรือไม่?")) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>คืนค่าฐานข้อมูลเริ่มต้น</span>
          </button>
        </div>
      </div>
    </div>

    {/* Realtime logs block moves here under Admin section */}
    <RealtimeLogs 
      visitors={visitors} 
      onDeleteVisitor={onDeleteVisitor} 
      onEditVisitor={onEditVisitor} 
      googleToken={googleToken}
      isSyncingWithSheets={isSyncingWithSheets}
      onSyncWithGoogleSheets={onSyncWithGoogleSheets}
    />
  </div>
);
}
