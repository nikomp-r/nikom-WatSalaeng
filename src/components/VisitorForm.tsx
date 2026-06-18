import React, { useState } from "react";
import { VisitorRecord, QuotaSettings } from "../types";
import { getTodayString, formatThaiDate } from "../utils";
import { User, Landmark, ShieldCheck, Zap, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VisitorFormProps {
  visitors: VisitorRecord[];
  quotaSettings: QuotaSettings;
  onAddVisitor: (firstName: string, lastName: string, organization: string) => void;
  isAdminLoggedIn: boolean;
}

export default function VisitorForm({
  visitors,
  quotaSettings,
  onAddVisitor,
  isAdminLoggedIn,
}: VisitorFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ name: string; timestamp: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = getTodayString();
  const currentMonthEn = new Date().getMonth();
  const currentYearEn = new Date().getFullYear();

  // Calculate current registration sums
  const todayCount = visitors.filter((v) => v.dateString === todayStr).length;
  
  const thisMonthCount = visitors.filter((v) => {
    const d = new Date(v.timestamp);
    return d.getMonth() === currentMonthEn && d.getFullYear() === currentYearEn;
  }).length;

  const thisYearCount = visitors.filter((v) => {
    const d = new Date(v.timestamp).getFullYear();
    return d === currentYearEn;
  }).length;

  // Determine rules & warning states
  const isDailyFull = todayCount >= quotaSettings.daily;
  const isMonthlyFull = thisMonthCount >= quotaSettings.monthly;
  const isYearlyFull = thisYearCount >= quotaSettings.yearly;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim() || !organization.trim()) {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
      return;
    }

    if (isDailyFull && !isAdminLoggedIn) {
      setErrorMsg("ขออภัย! โควต้ารายวันสำหรับการเข้าชมวันนี้เต็มแล้ว กรุณาติดต่อแอดมินหรือเจ้าหน้าที่");
      return;
    }

    onAddVisitor(firstName.trim(), lastName.trim(), organization.trim());
    
    setSuccessInfo({
      name: `${firstName.trim()} ${lastName.trim()}`,
      timestamp: Date.now(),
    });

    // Reset fields
    setFirstName("");
    setLastName("");
    setOrganization("");

    // Clear success banner after 6 seconds
    setTimeout(() => {
      setSuccessInfo(null);
    }, 6000);
  };

  return (
    <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden transition-all text-slate-800">
      
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl border border-slate-200 shadow-sm">
          <Zap className="w-5 h-5 text-indigo-900 fill-indigo-100" />
        </div>
        <div>
          <span className="text-xs font-bold text-indigo-700 tracking-wider uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> บันทึกข้อมูลคลังความรู้
          </span>
          <h2 className="text-xl font-bold text-indigo-950 tracking-tight">
            กรอกข้อมูลรายละเอียดผู้เข้าเยี่ยมชม
          </h2>
        </div>
      </div>

      {/* Quota Banner Indicator for Today - Beautiful Geometric slate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Daily Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-sky-500 p-4 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">โควต้าผู้เข้าชมต่อวัน</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {todayCount} <span className="text-slate-400 text-sm font-normal">/ {quotaSettings.daily} คน</span>
            </h3>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-sky-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (todayCount / quotaSettings.daily) * 100)}%` }}
            />
          </div>
          {isDailyFull && (
            <p className="text-[10px] text-rose-600 font-bold mt-1">● เต็มจำนวนโควต้าแล้ว</p>
          )}
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-emerald-500 p-4 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">โควต้าผู้เข้าชมต่อเดือน</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {thisMonthCount} <span className="text-slate-400 text-sm font-normal">/ {quotaSettings.monthly} คน</span>
            </h3>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (thisMonthCount / quotaSettings.monthly) * 100)}%` }}
            />
          </div>
        </div>

        {/* Yearly Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-amber-500 p-4 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">สถิติสะสมผู้เข้าชมปีนี้</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {thisYearCount} <span className="text-slate-400 text-sm font-normal">/ {quotaSettings.yearly} คน</span>
            </h3>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (thisYearCount / quotaSettings.yearly) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {successInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mb-5 p-4 bg-emerald-50 text-emerald-950 rounded-lg shadow-sm border-l-4 border-emerald-500 flex items-start gap-3"
            id="success-alert"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">ลงทะเบียนเข้าเยี่ยมชมสำเร็จ!</p>
              <p className="text-xs text-emerald-800 mt-0.5">คุณ {successInfo.name} ได้บันทึกร่วมเครือข่ายแล้ว</p>
              <p className="text-[10px] text-emerald-600 mt-1">{formatThaiDate(successInfo.timestamp)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* FirstName */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" htmlFor="firstName">
              <User className="w-3.5 h-3.5 text-indigo-700" /> ชื่อจริง <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="กรอกชื่อจริงของคุณ"
                disabled={isDailyFull && !isAdminLoggedIn}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* LastName */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" htmlFor="lastName">
              <User className="w-3.5 h-3.5 text-indigo-700" /> นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="กรอกนามสกุลของคุณ"
              disabled={isDailyFull && !isAdminLoggedIn}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Association / Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" htmlFor="organization">
            <Landmark className="w-3.5 h-3.5 text-indigo-700" /> หน่วยงานสังกัด / สถานภาพ <span className="text-rose-500">*</span>
          </label>
          <input
            id="organization"
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="เช่น นักเรียนชั้น ม.3, อบต.แสลง, ข้าราชการครู, บุคคลทั่วไป"
            disabled={isDailyFull && !isAdminLoggedIn}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Auto Timestamp Info Label */}
        <div className="pt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>ระบบบันทึก <strong>วัน เดือน ปี และเวลาวิทยฐานะ</strong> แบบอัตโนมัติ</span>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Submit button */}
        <button
          id="btn-submit-registration"
          type="submit"
          disabled={isDailyFull && !isAdminLoggedIn}
          className={`w-full py-3 px-4 rounded-lg font-bold text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isDailyFull && !isAdminLoggedIn
              ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
              : "bg-indigo-900 border border-indigo-950 text-white hover:bg-indigo-800 hover:scale-[1.005] active:scale-[0.995]"
          }`}
        >
          <Zap className="w-4 h-4" />
          {isDailyFull && !isAdminLoggedIn 
            ? "โควต้าเต็มแล้ว (ปิดระบบจองข้อมูล)" 
            : "บันทึกข้อมูลการเข้าเยี่ยมชม"
          }
        </button>

        {isAdminLoggedIn && isDailyFull && (
          <p className="text-[10px] text-indigo-600 text-center font-bold">
            (สิทธิ์ระดับผู้ตรวจสอบแอดมิน: เปิดลงทะเบียนเกณฑ์พิเศษ)
          </p>
        )}
      </form>
    </div>
  );
}
