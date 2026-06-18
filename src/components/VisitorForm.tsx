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

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedOrg = organization.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedOrg) {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
      return;
    }

    // Duplicate name prevention constraint (case-insensitive and trimmed comparison)
    const isDuplicate = visitors.some(
      (v) =>
        v.firstName.trim().toLowerCase() === trimmedFirst.toLowerCase() &&
        v.lastName.trim().toLowerCase() === trimmedLast.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMsg(`ขออภัย! มีรายชื่อคุณ ${trimmedFirst} ${trimmedLast} ลงทะเบียนในระบบเรียบร้อยแล้ว (ไม่สามารถลงทะเบียนซ้ำได้)`);
      return;
    }

    if (isDailyFull && !isAdminLoggedIn) {
      setErrorMsg("ขออภัย! โควต้ารายวันสำหรับการเข้าชมวันนี้เต็มแล้ว กรุณาติดต่อแอดมินหรือเจ้าหน้าที่");
      return;
    }

    onAddVisitor(trimmedFirst, trimmedLast, trimmedOrg);
    
    setSuccessInfo({
      name: `${trimmedFirst} ${trimmedLast}`,
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
            <Sparkles className="w-3.5 h-3.5" /> บันทึกข้อมูลผู้เข้าเยี่ยมชม
          </span>
          <h2 className="text-xl font-bold text-indigo-950 tracking-tight">
            กรอกข้อมูลรายละเอียดผู้เข้าเยี่ยมชม
          </h2>
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
              <p className="text-xs text-emerald-800 mt-0.5">คุณ {successInfo.name} ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว</p>
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
            placeholder="เช่น ประชาชนทั่วไป, นักเรียน, เกษตรกร, ผู้ประกอบการ, บริษัทยิ่งใหญ่, โรงเรียนวัดแสลง, มหาวิทยาลัย, อบต.ท่าช้าง"
            disabled={isDailyFull && !isAdminLoggedIn}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Auto Timestamp Info Label */}
        <div className="pt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>ระบบบันทึกข้อมูล วัน เดือน ปี และเวลา ของการกรอกข้อมูลให้อัตโนมัติ</span>
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
