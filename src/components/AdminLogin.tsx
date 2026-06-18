import React, { useState } from "react";
import { Lock, Unlock, LogOut, KeyRound, Check, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface AdminLoginProps {
  isAdminLoggedIn: boolean;
  onLogin: (password: string) => boolean;
  onLogout: () => void;
  adminPasswordError: string;
  setAdminPasswordError: (err: string) => void;
}

export default function AdminLogin({
  isAdminLoggedIn,
  onLogin,
  onLogout,
  adminPasswordError,
  setAdminPasswordError,
}: AdminLoginProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordError("");

    if (!passwordInput.trim()) {
      setAdminPasswordError("กรุณากรอกรหัสผ่านด้วยค่ะ");
      return;
    }

    const success = onLogin(passwordInput);
    if (success) {
      setPasswordInput("");
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-amber-100 shadow-xl relative overflow-hidden transition-all">
      {/* Glow highlight */}
      <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-colors ${
        isAdminLoggedIn ? "bg-emerald-500/10" : "bg-amber-500/10"
      }`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Banner */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border flex-shrink-0 shadow-sm ${
            isAdminLoggedIn 
              ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
              : "bg-amber-50 border-amber-100 text-amber-600"
          }`}>
            {isAdminLoggedIn ? <Unlock className="w-5 h-5 animate-bounce" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5 leading-snug">
              ระบบแอดมินเจ้าหน้าที่ศูนย์เรียนรู้
              {isAdminLoggedIn && (
                <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-200">
                  ออนไลน์
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAdminLoggedIn 
                ? "คุณสามารถแก้ไข/ลบข้อมูลผู้ร่วมเรียนรู้ หรือจัดปรับเปลี่ยนโควต้าได้ตามต้องการ"
                : "สิทธิเข้าถึงระดับแอดมินสำหรับจัดการข้อมูลและกำหนดคุณสมบัติโควต้า"
              }
            </p>
          </div>
        </div>

        {/* Action area */}
        {isAdminLoggedIn ? (
          <div>
            <button
              id="btn-admin-logout"
              onClick={onLogout}
              className="w-full md:w-auto px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบแอดมิน</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2 relative w-full md:max-w-md">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex-none flex items-center justify-center text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="admin-password-input"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (adminPasswordError) setAdminPasswordError("");
                }}
                placeholder="ระบุรหัสผ่านแอดมิน"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
              />
            </div>
            <button
              id="btn-admin-login"
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>ยืนยันสิทธิ์</span>
            </button>
          </form>
        )}
      </div>

      {adminPasswordError && !isAdminLoggedIn && (
        <div className="mt-2 text-rose-500 text-xs font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          {adminPasswordError}
        </div>
      )}
    </div>
  );
}
