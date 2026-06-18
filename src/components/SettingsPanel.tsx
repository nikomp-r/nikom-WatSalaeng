import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  FileSpreadsheet,
  HardDrive,
  Loader2
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

  // Troubleshoot authorized domains states
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShared, setCopiedShared] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Google Drive backup state variables
  const [isDriveBackingUp, setIsDriveBackingUp] = useState(false);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [isLoadingDriveBackups, setIsLoadingDriveBackups] = useState(false);

  const fetchDriveBackups = async (token: string) => {
    setIsLoadingDriveBackups(true);
    try {
      const { listBackupsInDrive } = await import("../lib/googleSheets");
      const files = await listBackupsInDrive(token);
      setDriveBackups(files);
    } catch (err) {
      console.error("Failed to load drive backups:", err);
    } finally {
      setIsLoadingDriveBackups(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      fetchDriveBackups(googleToken);
    } else {
      setDriveBackups([]);
    }
  }, [googleToken]);

  const handleBackupToDrive = async () => {
    if (!googleToken) return;
    setIsDriveBackingUp(true);
    try {
      const { uploadBackupToDrive } = await import("../lib/googleSheets");
      
      // Generate CSV content
      const headers = ["ลำดับที่", "ชื่อ", "นามสกุล", "หน่วยสังกัด/สถานภาพ", "วัน_เดือน_ปี_เวลา_ที่เข้าชม"];
      const rows = visitors.map((v, i) => [
        i + 1,
        v.firstName,
        v.lastName,
        v.organization,
        new Date(v.timestamp).toLocaleString("th-TH")
      ]);
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
      const fileName = `รายงานผู้เข้าชม_วัดแสลง_สำรอง_${new Date().toLocaleDateString("en-CA")}_${Date.now()}.csv`;
      await uploadBackupToDrive(googleToken, csvContent, fileName);
      alert("✅ สำรองไฟล์ข้อมูลลง Google Drive สำเร็จเรียบร้อยแล้วค่ะ!");
      
      // Refresh list
      await fetchDriveBackups(googleToken);
    } catch (err: any) {
      alert("⚠️ เกิดข้อผิดพลาดในการอัปโหลดไฟล์: " + err.message);
    } finally {
      setIsDriveBackingUp(false);
    }
  };

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

        {/* Google Sheets & Google Drive Integration Section */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl shadow-inner">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>เชื่อมต่อ Google Workspace (Google Sheets & Google Drive)</span>
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
                  ซิงค์ข้อมูลผู้เข้าเยี่ยมชมแบบเรียลไทม์ และสำรองไฟล์ประวัติข้อมูล (CSV) ไปที่ Google Drive ของท่านอย่างปลอดภัย
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
                    <span>{isSyncingWithSheets ? "กำลังซิงค์ Google Sheets..." : "ดึง/ซิงค์จากชีทบัดนี้"}</span>
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
                  <span>เชื่อมต่อสารสนเทศ Google</span>
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

          {/* Google Drive Specific Management section */}
          {googleToken && (
            <div className="bg-white/80 border border-emerald-100/80 rounded-2xl p-4 md:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">ระบบสำรองรายงานข้อมูลไปยัง Google Drive</h4>
                    <p className="text-[10.5px] text-slate-400 font-medium">จัดการกับไฟล์สำรองประวัติผู้เข้าเยี่ยมชมวัดแสลงในรูปแบบไฟล์ CSV บนคลาวด์ไดรฟ์โดยตรง</p>
                  </div>
                </div>

                <button
                  onClick={handleBackupToDrive}
                  disabled={isDriveBackingUp}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {isDriveBackingUp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>กำลังอัปโหลด...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>อัปโหลดสำรอง (CSV) สู่ Google Drive</span>
                    </>
                  )}
                </button>
              </div>

              {/* List of backed up files on drive */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">รายการไฟล์สำรองบน Google Drive ล่าสุด (10 ชิ้นล่าสุด)</span>
                {isLoadingDriveBackups ? (
                  <div className="flex items-center justify-center py-4 text-xs font-semibold text-slate-400 gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>กำลังโหลดรายการไฟล์บนไดรฟ์ของท่าน...</span>
                  </div>
                ) : driveBackups.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white">
                    {driveBackups.map((file) => (
                      <div key={file.id} className="p-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 trans-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-700 block truncate" title={file.name}>{file.name}</span>
                            <span className="text-[10px] text-slate-450 block font-mono">วันที่อัปโหลด: {new Date(file.createdTime).toLocaleString("th-TH")}</span>
                          </div>
                        </div>
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 transition-all text-[10.5px] flex items-center gap-1 shrink-0"
                        >
                          <span>เปิดไฟล์</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                    ยังไม่มีไฟล์สำรองรายงานในไดรฟ์ของท่าน กดอัปโหลดเพื่อสำรองไฟล์แรกค่ะ
                  </div>
                )}
              </div>
            </div>
          )}

          {googleUser && (
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>ล็อกอินบัญชี Google อยู่ในขณะนี้: <strong>{googleUser.email}</strong> ({googleUser.displayName})</span>
            </p>
          )}

          {/* Dynamic domain troubleshooting card */}
          <div className="pt-4 border-t border-dashed border-emerald-200/60">
            <button
              type="button"
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="text-xs text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm select-none"
            >
              <span>💡 เจอปัญหา "Firebase: Error (auth/unauthorized-domain)" หรือสำรองไม่เข้าคลาวด์? คลิกดูวิธีแก้ไขทันที</span>
              <span className="text-[10px] font-bold">
                {showTroubleshoot ? "▲ ซ่อนคู่มือ" : "▼ แสดงคู่มือแก้ไข"}
              </span>
            </button>

            {showTroubleshoot && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 bg-white/95 border border-amber-200 rounded-2xl p-5 space-y-4 text-xs text-slate-700 shadow-sm overflow-hidden"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1 px-1.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] shrink-0">สาเหตุข้อผิดพลาด</div>
                  <p className="leading-relaxed font-semibold text-slate-600">
                    เนื่องจากระบบจำลองความปลอดภัยของ AI Studio ทำการรันเว็บแอปพริเคชันบนโดเมนแซนด์บ็อกซ์ชั่วคราว ทำให้ Firebase ปฏิเสธสิทธิ์การเข้าถึงความปลอดภัย (Unauthorized Domain) จนกว่าท่านจะนำชื่อโดเมนของหน้านี้ไปกรอกอนุญาตเพิ่มเติมที่หน้าต่างคอนโซล Firebase ของท่านค่ะ
                  </p>
                </div>

                <div className="space-y-2 border-t border-dashed border-slate-200 pt-3">
                  <span className="font-black text-slate-800 block text-[13px] text-amber-800">🛠️ แนะนำขั้นตอนการแก้ไขใน 3 ข้อสั้นๆ:</span>
                  
                  <div className="space-y-3 font-medium text-slate-600 pl-1">
                    <p className="flex items-start gap-1.5 leading-relaxed">
                      <span className="font-black text-amber-700">1.</span>
                      <span>
                        เปิดหน้าตั้งค่าความปลอดภัยของโครงการ Firebase ID ของคุณ โดยคลิกเปิดหน้าคอนโซลโดยตรงที่นี่: <br />
                        <a
                          href="https://console.firebase.google.com/project/ai-studio-applet-webapp-a0503/authentication/settings"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-800 font-bold underline mt-1"
                        >
                          <span>เปิดหน้า Firebase Authentication Settings ↗</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </span>
                    </p>

                    <p className="flex items-start gap-1.5 leading-relaxed">
                      <span className="font-black text-amber-700">2.</span>
                      <span>
                        เลื่อนลงมามองหาหัวข้อย่อยชื่อ <strong>"Authorized domains" (โดเมนที่ได้รับอนุญาต)</strong> แล้วคลิกปุ่ม <strong>"Add domain" (เพิ่มโดเมนใหม่)</strong>
                      </span>
                    </p>

                    <div className="flex items-start gap-1.5 leading-relaxed">
                      <span className="font-black text-amber-700 shrink-0">3.</span>
                      <div className="space-y-2.5 w-full">
                        <span>คลิกปุ่มคัดลอกด้านล่างเพื่อ copy โดเมนทั้ง 2 ตัวนี้แล้วนำไปกรอกกดเพิ่ม (Add) ลงไปใน Firebase (ไม่ต้องใส่ https:// หรือเครื่องหมายใดๆ ด้านหลัง):</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {/* Dev Domain Box */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-inner">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">โดเมนสำหรับทดสอบพัฒนา (Development Domain)</span>
                            <div className="flex items-center justify-between gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                              <code className="font-mono text-[10.5px] font-bold text-indigo-950 select-all break-all pr-1">
                                {(() => {
                                  const host = typeof window !== "undefined" ? window.location.hostname : "ais-dev-2s4wc4heyaup26qob2vft7-799010934055.asia-southeast1.run.app";
                                  const isDevFlg = host.includes("-dev-");
                                  return isDevFlg ? host : host.replace("-pre-", "-dev-");
                                })()}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  const host = typeof window !== "undefined" ? window.location.hostname : "ais-dev-2s4wc4heyaup26qob2vft7-799010934055.asia-southeast1.run.app";
                                  const isDevFlg = host.includes("-dev-");
                                  const val = isDevFlg ? host : host.replace("-pre-", "-dev-");
                                  navigator.clipboard.writeText(val);
                                  setCopiedDev(true);
                                  setTimeout(() => setCopiedDev(false), 2000);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-bold text-[10px] rounded border border-indigo-100 transition-all shrink-0 cursor-pointer"
                              >
                                {copiedDev ? "คัดลอกสำเร็จ!" : "กดคัดลอก"}
                              </button>
                            </div>
                          </div>

                          {/* Shared Domain Box */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-inner">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">โดเมนหลักสำหรับแชร์ต่อ (Shared Domain)</span>
                            <div className="flex items-center justify-between gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                              <code className="font-mono text-[10.5px] font-bold text-indigo-950 select-all break-all pr-1">
                                {(() => {
                                  const host = typeof window !== "undefined" ? window.location.hostname : "ais-dev-2s4wc4heyaup26qob2vft7-799010934055.asia-southeast1.run.app";
                                  const isDevFlg = host.includes("-dev-");
                                  return isDevFlg ? host.replace("-dev-", "-pre-") : host;
                                })()}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  const host = typeof window !== "undefined" ? window.location.hostname : "ais-dev-2s4wc4heyaup26qob2vft7-799010934055.asia-southeast1.run.app";
                                  const isDevFlg = host.includes("-dev-");
                                  const val = isDevFlg ? host.replace("-dev-", "-pre-") : host;
                                  navigator.clipboard.writeText(val);
                                  setCopiedShared(true);
                                  setTimeout(() => setCopiedShared(false), 2000);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-bold text-[10px] rounded border border-indigo-100 transition-all shrink-0 cursor-pointer"
                              >
                                {copiedShared ? "คัดลอกสำเร็จ!" : "กดคัดลอก"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 text-amber-900 border border-amber-200/60 rounded-xl p-3.5 font-semibold text-[11px] leading-relaxed">
                  💡 <strong>คำแนะนำเพิ่มเติม:</strong> เมื่อบันทึกแจ้งข้อมูลใน Firebase console เรียบร้อยแล้ว ให้ทำการรีเฟรชหน้าบราวเซอร์ของแอปฯ นี้หนึ่งครั้ง <strong>แล้วกลับมากดเชื่อมต่อ Google ใหม่อีกหน</strong> ระบบก็จะจดจำและลงทะเบียนไปที่ชีทแบบเรียลไทม์ได้อย่างสมบูรณ์แบบโดยสงบแน่นอนค่ะ!
                </div>
              </motion.div>
            )}
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
      googleToken={googleToken}
      isSyncingWithSheets={isSyncingWithSheets}
      onSyncWithGoogleSheets={onSyncWithGoogleSheets}
    />
  </div>
);
}
