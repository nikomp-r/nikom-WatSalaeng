import React, { useState } from "react";
import { QuotaSettings, VisitorRecord } from "../types";
import { Settings, Save, RotateCcw, ShieldAlert, Sliders, Info, Server, Key, RefreshCw, LogOut } from "lucide-react";
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
    />
  </div>
);
}
