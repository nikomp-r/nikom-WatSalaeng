import React, { useState, useMemo } from "react";
import { VisitorRecord } from "../types";
import { formatThaiDate, MONTHS_THAI } from "../utils";
import { 
  Users, 
  Search, 
  CalendarDays, 
  SlidersHorizontal, 
  Download, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  FileText
} from "lucide-react";

interface RealtimeLogsProps {
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
  googleToken?: string | null;
  isSyncingWithSheets?: boolean;
  onSyncWithGoogleSheets?: () => Promise<void>;
}

// Convert a unix timestamp to HTML datetime-local format (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (ts: number): string => {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert HTML datetime-local string to timestamp & dateString
const fromDatetimeLocal = (val: string): { timestamp: number; dateString: string } => {
  const d = new Date(val);
  const timestamp = d.getTime() || Date.now();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  return { timestamp, dateString };
};

export default function RealtimeLogs({
  visitors,
  onDeleteVisitor,
  onEditVisitor,
  googleToken,
  isSyncingWithSheets,
  onSyncWithGoogleSheets,
}: RealtimeLogsProps) {
  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editOrg, setEditOrg] = useState("");
  const [editDatetimeLocal, setEditDatetimeLocal] = useState("");
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  const totalCount = visitors.length;

  // Extract available years for filter
  const availableYearsEn = useMemo(() => {
    const years = new Set<number>();
    visitors.forEach((v) => years.add(new Date(v.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [visitors]);

  // Filter visitors to display in table
  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      const textMatch =
        `${visitor.firstName} ${visitor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.organization.toLowerCase().includes(searchTerm.toLowerCase());

      const date = new Date(visitor.timestamp);
      const monthMatch = selectedMonthFilter === "all" || date.getMonth() === parseInt(selectedMonthFilter);
      const yearMatch = selectedYearFilter === "all" || date.getFullYear() === parseInt(selectedYearFilter);

      return textMatch && monthMatch && yearMatch;
    });
  }, [visitors, searchTerm, selectedMonthFilter, selectedYearFilter]);

  // Init inline edit
  const startEdit = (visitor: VisitorRecord) => {
    setEditingId(visitor.id);
    setEditFirstName(visitor.firstName);
    setEditLastName(visitor.lastName);
    setEditOrg(visitor.organization);
    setEditDatetimeLocal(toDatetimeLocal(visitor.timestamp));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editFirstName.trim() || !editLastName.trim() || !editOrg.trim() || !editDatetimeLocal) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก");
      return;
    }
    
    const { timestamp, dateString } = fromDatetimeLocal(editDatetimeLocal);
    onEditVisitor(
      id, 
      editFirstName.trim(), 
      editLastName.trim(), 
      editOrg.trim(),
      timestamp,
      dateString
    );
    setEditingId(null);
  };

  // CSV Exporter
  const exportToCSV = async () => {
    let recordsToExport = filteredVisitors;

    if (googleToken) {
      setIsDownloadingCSV(true);
      try {
        const { fetchVisitorsFromSheet } = await import("../lib/googleSheets");
        const sheetVisitors = await fetchVisitorsFromSheet(googleToken);
        if (sheetVisitors && sheetVisitors.length > 0) {
          recordsToExport = sheetVisitors.filter((visitor) => {
            const textMatch =
              `${visitor.firstName} ${visitor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
              visitor.organization.toLowerCase().includes(searchTerm.toLowerCase());

            const date = new Date(visitor.timestamp);
            const monthMatch = selectedMonthFilter === "all" || date.getMonth() === parseInt(selectedMonthFilter);
            const yearMatch = selectedYearFilter === "all" || date.getFullYear() === parseInt(selectedYearFilter);

            return textMatch && monthMatch && yearMatch;
          });
        }
      } catch (err: any) {
        console.error("Direct sheet download failed, falling back to local database:", err);
        alert("⚠️ ดึงข้อมูลล่าสุดจาก Google Sheets ไม่สำเร็จ ระบบจะทำการดาวน์โหลดจากข้อมูลสถิติม๊อคสำรองในเครื่องแทนค่ะ\n(สาเหตุ: " + err.message + ")");
      } finally {
        setIsDownloadingCSV(false);
      }
    }

    const headers = ["ลำดับที่", "ชื่อ", "นามสกุล", "หน่วยสังกัด/สถานภาพ", "วัน_เดือน_ปี_เวลา_ที่เข้าชม"];
    const rows = recordsToExport.map((v, i) => [
      i + 1,
      v.firstName,
      v.lastName,
      v.organization,
      formatThaiDate(v.timestamp, true)
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานผู้เข้าชม_วัดแสลง_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 md:p-8 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-700" />
            <span>แฟ้มบันทึกรายชื่อผู้เข้าชมศึกษาเรียนรู้ (Real-time Logs) - แอดมินจัดการได้ทั้งหมด</span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            แสดงตามตัวกรองที่เลือก ({filteredVisitors.length} รายการจากทั้งหมด {totalCount} รายการ) • สิทธิ์แอดมินสามารถแก้ไขรายชื่อ สังกัด และ เวลาเข้าชมได้อย่างยืดหยุ่น
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={isDownloadingCSV}
          className="w-full md:w-auto px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 disabled:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isDownloadingCSV ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-emerald-400 rounded-full animate-spin" />
              <span>กำลังดึงข้อมูลจาก Sheets...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-emerald-400" />
              <span>ดาวน์โหลดรายงาน (CSV)</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
        {/* Text Search */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
            <Search className="w-3 h-3 text-indigo-600" /> สมุดบันทึกค้นหาชื่อ/สังกัด
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="พิมพ์ชื่อ นามสกุล หรือสังกัดย่อย..."
            className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold shadow-sm"
          />
        </div>

        {/* Month Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
            <CalendarDays className="w-3 h-3 text-indigo-600" /> คัดแยกตามรายเดือน
          </label>
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold shadow-sm"
          >
            <option value="all">ทุก ๆ เดือน</option>
            {MONTHS_THAI.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-indigo-600" /> คัดแยกตามรายปี (พ.ศ.)
          </label>
          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold shadow-sm"
          >
            <option value="all">ทุก ๆ ปี พ.ศ.</option>
            {availableYearsEn.map((yr) => (
              <option key={yr} value={yr}>พ.ศ. {yr + 543}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3.5 text-center" style={{ width: "70px" }}>ลำดับที่</th>
              <th className="px-4 py-3.5">ชื่อจริง</th>
              <th className="px-4 py-3.5">นามสกุล</th>
              <th className="px-4 py-3.5">หน่วยสังกัด / สถานภาพ</th>
              <th className="px-4 py-3.5" style={{ width: "230px" }}>วัน/เดือน/ปี และเวลา ที่เข้าเยี่ยมชม</th>
              <th className="px-4 py-3.5 text-center" style={{ width: "120px" }}>จัดการข้อมูล</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {filteredVisitors.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 font-bold bg-slate-50/50">
                  ❌ ไม่พบรายชื่อผู้เข้าเยี่ยมชมตามตัวกรองที่เลือก
                </td>
              </tr>
            ) : (
              filteredVisitors.map((v, i) => {
                const isEditing = editingId === v.id;
                
                return (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Index */}
                    <td className="px-4 py-3 text-center font-bold text-slate-500">
                      {i + 1}
                    </td>

                    {/* First Name */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="px-2 py-1.5 border border-indigo-300 rounded-lg text-xs w-full bg-white text-slate-800 font-bold focus:ring-1 focus:ring-indigo-600"
                        />
                      ) : (
                        <span className="font-bold text-slate-900">{v.firstName}</span>
                      )}
                    </td>

                    {/* Last Name */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="px-2 py-1.5 border border-indigo-300 rounded-lg text-xs w-full bg-white text-slate-800 font-bold focus:ring-1 focus:ring-indigo-600"
                        />
                      ) : (
                        <span className="text-slate-700 font-medium">{v.lastName}</span>
                      )}
                    </td>

                    {/* Organization */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editOrg}
                          onChange={(e) => setEditOrg(e.target.value)}
                          className="px-2 py-1.5 border border-indigo-300 rounded-lg text-xs w-full bg-white text-slate-800 font-bold focus:ring-1 focus:ring-indigo-600"
                        />
                      ) : (
                        <span className="text-indigo-950 bg-indigo-50 px-2.5 py-1 rounded-md text-[10px] font-bold border border-indigo-100">
                          {v.organization}
                        </span>
                      )}
                    </td>

                    {/* Date and Time */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="datetime-local"
                          value={editDatetimeLocal}
                          onChange={(e) => setEditDatetimeLocal(e.target.value)}
                          className="px-2 py-1.5 border border-indigo-300 rounded-lg text-[11px] w-full bg-white text-slate-800 font-bold focus:ring-1 focus:ring-indigo-600 font-mono"
                        />
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px] font-bold bg-slate-50 px-2.5 py-1 rounded border border-slate-150">
                          {formatThaiDate(v.timestamp)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(v.id)}
                            title="บันทึกการแก้ไข"
                            className="p-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center font-black"
                          >
                            <Check className="w-3.5 h-3.5 mr-0.5" /> บันทึก
                          </button>
                          <button
                            onClick={cancelEdit}
                            title="ยกเลิก"
                            className="p-1 px-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center font-bold"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => startEdit(v)}
                            title="แก้ไขข้อมูลผู้เข้าชม"
                            className="p-1 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer flex items-center justify-center font-bold text-[10px]"
                          >
                            <Edit3 className="w-3 h-3 mr-0.5" /> แก้ไข
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการเข้าชมของ คุณ ${v.firstName} ${v.lastName}?`)) {
                                onDeleteVisitor(v.id);
                              }
                            }}
                            title="ลบรายชื่อ"
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
