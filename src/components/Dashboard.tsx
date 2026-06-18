import React, { useState, useMemo } from "react";
import { VisitorRecord, QuotaSettings } from "../types";
import { 
  formatThaiDate, 
  MONTHS_THAI, 
  getTodayString 
} from "../utils";
import { 
  Users, 
  CalendarDays, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  Search, 
  SlidersHorizontal, 
  Check, 
  X, 
  Sparkles,
  BarChart3,
  Download,
  Flame,
  BatteryCharging,
  Sun,
  Timer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  visitors: VisitorRecord[];
  quotaSettings: QuotaSettings;
  isAdminLoggedIn: boolean;
  onDeleteVisitor: (id: string) => void;
  onEditVisitor: (id: string, firstName: string, lastName: string, organization: string) => void;
}

export default function Dashboard({
  visitors,
  quotaSettings,
  isAdminLoggedIn,
  onDeleteVisitor,
  onEditVisitor,
}: DashboardProps) {
  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editOrg, setEditOrg] = useState("");

  const currentYearEn = new Date().getFullYear();
  const currentMonthEn = new Date().getMonth();

  // 1. Calculate General Aggregations
  const totalCount = visitors.length;

  const todayStr = getTodayString();
  const todayCount = useMemo(() => {
    return visitors.filter((v) => v.dateString === todayStr).length;
  }, [visitors, todayStr]);

  const thisMonthCount = useMemo(() => {
    return visitors.filter((v) => {
      const d = new Date(v.timestamp);
      return d.getMonth() === currentMonthEn && d.getFullYear() === currentYearEn;
    }).length;
  }, [visitors, currentMonthEn, currentYearEn]);

  const thisYearCount = useMemo(() => {
    return visitors.filter((v) => {
      return new Date(v.timestamp).getFullYear() === currentYearEn;
    }).length;
  }, [visitors, currentYearEn]);

  // 2. Monthly Stats: Calculate visitors per month specifically for the selected year (default current year)
  const activeYearEn = selectedYearFilter === "all" ? currentYearEn : parseInt(selectedYearFilter);

  const monthlyStats = useMemo(() => {
    const stats = Array.from({ length: 12 }, (_, index) => ({
      monthIndex: index,
      monthName: MONTHS_THAI[index],
      count: 0,
    }));

    visitors.forEach((visitor) => {
      const date = new Date(visitor.timestamp);
      if (date.getFullYear() === activeYearEn) {
        stats[date.getMonth()].count += 1;
      }
    });

    return stats;
  }, [visitors, activeYearEn]);

  // Find max monthly count to scale the charts correctly
  const maxMonthlyCount = useMemo(() => {
    const max = Math.max(...monthlyStats.map((s) => s.count));
    return max > 0 ? max : 5; // Default safe denominator
  }, [monthlyStats]);

  // 3. Yearly Stats: Group by Thai Buddhist Year
  const yearlyStats = useMemo(() => {
    const countsMap: { [key: number]: number } = {};
    visitors.forEach((visitor) => {
      const yearEn = new Date(visitor.timestamp).getFullYear();
      const yearTh = yearEn + 543;
      countsMap[yearTh] = (countsMap[yearTh] || 0) + 1;
    });

    return Object.entries(countsMap)
      .map(([yearTh, count]) => ({
        yearTh: parseInt(yearTh),
        count,
      }))
      .sort((a, b) => b.yearTh - a.yearTh); // descending
  }, [visitors]);

  // Extract unique available years for dropdown list
  const availableYearsEn = useMemo(() => {
    const years = new Set<number>();
    visitors.forEach((v) => years.add(new Date(v.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [visitors]);

  // Filter visitors to display in table
  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      // Name or Organization search
      const textMatch =
        `${visitor.firstName} ${visitor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.organization.toLowerCase().includes(searchTerm.toLowerCase());

      // Month filter
      const date = new Date(visitor.timestamp);
      const monthMatch = selectedMonthFilter === "all" || date.getMonth() === parseInt(selectedMonthFilter);

      // Year filter
      const yearMatch = selectedYearFilter === "all" || date.getFullYear() === parseInt(selectedYearFilter);

      return textMatch && monthMatch && yearMatch;
    });
  }, [visitors, searchTerm, selectedMonthFilter, selectedYearFilter]);

  // Init inline edit form
  const startEdit = (visitor: VisitorRecord) => {
    setEditingId(visitor.id);
    setEditFirstName(visitor.firstName);
    setEditLastName(visitor.lastName);
    setEditOrg(visitor.organization);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editFirstName.trim() || !editLastName.trim() || !editOrg.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก");
      return;
    }
    onEditVisitor(id, editFirstName.trim(), editLastName.trim(), editOrg.trim());
    setEditingId(null);
  };

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ["ลำดับที่", "ชื่อ", "นามสกุล", "หน่วยสังกัด/สถานภาพ", "วัน_เดือน_ปี_เข้าชม"];
    const rows = filteredVisitors.map((v, i) => [
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
    <div className="space-y-8">
      {/* 2x2 or 4x1 Bento Overview Cards representing quotas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core total counter (Geometric Indigo Theme) */}
        <div className="bg-indigo-900 text-white p-5 rounded-xl border border-indigo-950 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-3 bottom-1 text-indigo-800/50 pointer-events-none">
            <Users className="w-20 h-20 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>จำนวนยอดเข้าเยี่ยมชมรวม</span>
            </div>
            <p className="text-3.5xl font-black mt-2 tracking-tight">
              {totalCount} <span className="text-sm font-normal text-indigo-200">คน</span>
            </p>
          </div>
          <p className="text-[10px] text-indigo-300 font-medium mt-3 pt-2 border-t border-indigo-800">
            นับรวมสถิติจากหน่วยจัดเก็บข้อมูลสะสม
          </p>
        </div>

        {/* Daily Quota Counter with Sky-500 bottom border */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-sky-500 p-5 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">โควต้าผู้เข้าชมต่อวัน</p>
            <h3 className="text-3xl font-black text-slate-850 mt-1.5">
              {todayCount} <span className="text-slate-400 text-sm font-normal">/ {quotaSettings.daily} คน</span>
            </h3>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  todayCount >= quotaSettings.daily ? "bg-rose-500" : "bg-sky-500"
                }`}
                style={{ width: `${Math.min(100, (todayCount / quotaSettings.daily) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-500 font-bold mt-2 flex items-center justify-between">
              <span>ว่างจองวันนี้: {Math.max(0, quotaSettings.daily - todayCount)} คน</span>
              <span className="text-sky-600">Daily Balance</span>
            </p>
          </div>
        </div>

        {/* Monthly Quota Counter with Emerald-500 bottom border */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-emerald-500 p-5 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">โควต้าผู้เข้าชมต่อเดือน</p>
            <h3 className="text-3xl font-black text-slate-850 mt-1.5">
              {thisMonthCount} <span className="text-slate-400 text-sm font-normal">/ {quotaSettings.monthly} คน</span>
            </h3>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (thisMonthCount / quotaSettings.monthly) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-500 font-bold mt-2 flex items-center justify-between">
              <span>สถิติเดือน: {MONTHS_THAI[currentMonthEn]}</span>
              <span className="text-emerald-600">Active Month</span>
            </p>
          </div>
        </div>

        {/* Yearly Quota Counter with Amber-500 bottom border */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-amber-500 p-5 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">ความสำเร็จโควต้าปีนี้</p>
            <h3 className="text-3xl font-black text-slate-855 mt-1.5">
              {thisYearCount} <span className="text-slate-400 text-sm font-normal">/ {quotaSettings.yearly} คน</span>
            </h3>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (thisYearCount / quotaSettings.yearly) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-500 font-bold mt-2 flex items-center justify-between">
              <span>ปีงบประมาณ พ.ศ. {currentYearEn + 543}</span>
              <span className="text-amber-600">Yearly Goal</span>
            </p>
          </div>
        </div>
      </div>

      {/* Visual Report Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly report visual chart - Modern Deep Indigo bars */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-900 rounded-lg border border-slate-100">
                  <BarChart3 className="w-5 h-5 text-indigo-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    รายงานผู้เข้าเยี่ยมชมรายเดือน (มกราคม - ธันวาคม)
                  </h3>
                  <p className="text-xs text-slate-400">
                    รายงานเปรียบเทียบสถิติอัตราส่วน ประจำปี พ.ศ. {activeYearEn + 543}
                  </p>
                </div>
              </div>
              
              {/* Year Selector for Monthly Report */}
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none"
              >
                <option value="all">ปี พ.ศ. ทั้งหมด</option>
                {availableYearsEn.map((yr) => (
                  <option key={yr} value={yr}>พ.ศ. {yr + 543}</option>
                ))}
              </select>
            </div>

            {/* Custom Responsive Vertical Bar Chart */}
            <div className="h-64 flex items-end gap-1.5 sm:gap-2.5 border-b border-slate-100 pb-2 pt-6">
              {monthlyStats.map((stat) => {
                const percent = (stat.count / maxMonthlyCount) * 100;
                const isCurrentMonth = stat.monthIndex === currentMonthEn && activeYearEn === currentYearEn;
                return (
                  <div key={stat.monthIndex} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {stat.monthName}: {stat.count} ท่าน
                    </div>

                    {/* Bar background track for elegant spacing */}
                    <div className="w-full bg-slate-50 hover:bg-slate-100/85 rounded-md flex items-end h-full relative overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${percent || 4}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`w-full rounded-t transition-all ${
                          stat.count > 0 
                            ? isCurrentMonth
                              ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                              : "bg-gradient-to-t from-indigo-900 to-indigo-600" 
                            : "bg-slate-200"
                        }`}
                      />
                    </div>
                    
                    {/* Month Label */}
                    <span className="text-[10px] text-slate-500 font-bold mt-2 break-all text-center">
                      {stat.monthName.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="flex items-center gap-1 font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>ระดับผู้ร่วมศึกษาดูงานสูงสุด: {MONTHS_THAI[monthlyStats.reduce((maxIdx, current, idx, arr) => current.count > arr[maxIdx].count ? idx : maxIdx, 0)]}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">STATUS: ACTIVE GENERATOR</span>
          </div>
        </div>

        {/* Yearly comparative statistics column - Geometric Side board */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2.5 bg-indigo-50 text-indigo-900 rounded-lg border border-slate-100">
                <Users className="w-5 h-5 text-indigo-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850">
                  สถิติตามรายปีงบจำแนก
                </h3>
                <p className="text-xs text-slate-400">
                  ผลรวมสถิติการเยี่ยมชมคลังข้อมูล
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {yearlyStats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">ไม่มีข้อมูลการกรอกข้อมูลผู้เข้าชม</p>
              ) : (
                yearlyStats.map((stat, i) => {
                  const isCurrentThYear = stat.yearTh === (currentYearEn + 543);
                  return (
                    <div 
                      key={stat.yearTh}
                      className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                        isCurrentThYear
                          ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-100 border-l-4"
                          : "bg-slate-50 border-slate-200 border-l-4 border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded font-mono font-bold flex items-center justify-center text-[10px] ${
                          isCurrentThYear 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            พ.ศ. {stat.yearTh}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">
                            {isCurrentThYear ? "ปีงบประมาณปัจจุบัน" : "ปีงบประมาณก่อนหน้า"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-slate-800">
                          {stat.count}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">คน</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-indigo-50 text-indigo-950 rounded-lg border border-indigo-100">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
              💡 ข้อควรรู้ระบบพลังงานไฟฟ้าสะสม
            </h4>
            <p className="text-[10px] text-indigo-800 mt-1 leading-relaxed font-medium">
              พลังงานที่สะสมผ่านระบบ Solar PV ร่วมกักเก็บไฟฟ้าใช้ภายในโรงเรียน ช่วยลดค่ากระแสไฟฟ้าได้กว่า 42% ต่อเนื่องตลอดรอบปี
            </p>
          </div>
        </div>
      </div>

      {/* Main real-time responsive records table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 md:p-8 space-y-6">
        
        {/* Table Search & Export Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              แฟ้มบันทึกรายชื่อผู้เข้าชมศึกษาเรียนรู้ (Real-time Logs)
            </h3>
            <p className="text-xs text-gray-500">
              แสดงข้อมูลตามตารางกรองและค้นหา ({filteredVisitors.length} รายการจากทั้งหมด {totalCount} รายการ)
            </p>
          </div>

          <button
            onClick={exportToCSV}
            className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดรายงาน (CSV)</span>
          </button>
        </div>

        {/* Filter controls panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          
          {/* Keyword Query Search */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <Search className="w-3 h-3 text-emerald-600" /> สมุดบันทึกค้นหาชื่อ/สังกัด
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="พิมพ์ชื่อ นามสกุล หรือสังกัดย่อย..."
              className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Month selective filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-emerald-600" /> คัดแยกตามรายเดือน
            </span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
            >
              <option value="all">ทุก ๆ เดือน</option>
              {MONTHS_THAI.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year selective filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-emerald-600" /> คัดแยกตามรายปี (พ.ศ.)
            </span>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
            >
              <option value="all">ทุก ๆ ปี พ.ศ.</option>
              {availableYearsEn.map((yr) => (
                <option key={yr} value={yr}>พ.ศ. {yr + 543}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full border-collapse text-left text-xs text-gray-700">
            <thead className="bg-slate-50 text-gray-600 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center" style={{ width: "80px" }}>ลำดับที่</th>
                <th className="px-4 py-3">ชื่อคลัง</th>
                <th className="px-4 py-3">นามสกุล</th>
                <th className="px-4 py-3">หน่วยสังกัด / สถานภาพ</th>
                <th className="px-4 py-3" style={{ width: "220px" }}>วัน/เดือน/ปี ที่เข้าชม</th>
                {isAdminLoggedIn && <th className="px-4 py-3 text-center" style={{ width: "120px" }}>ดำเนินการ</th>}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={isAdminLoggedIn ? 6 : 5} className="text-center py-12 text-gray-400">
                    ❌ ไม่พบรายชื่อผู้เข้าเยี่ยมชมตามตัวกรองที่เลือก
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v, i) => {
                  const isEditing = editingId === v.id;
                  
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Index No. */}
                      <td className="px-4 py-3 text-center font-bold text-gray-500">
                        {i + 1}
                      </td>

                      {/* First Name */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            className="px-2 py-1 border border-amber-300 rounded text-xs w-full bg-white text-gray-800"
                          />
                        ) : (
                          <span className="font-semibold text-gray-900">{v.firstName}</span>
                        )}
                      </td>

                      {/* Last Name */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            className="px-2 py-1 border border-amber-300 rounded text-xs w-full bg-white text-gray-800"
                          />
                        ) : (
                          <span className="text-gray-700">{v.lastName}</span>
                        )}
                      </td>

                      {/* Organization/Status */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editOrg}
                            onChange={(e) => setEditOrg(e.target.value)}
                            className="px-2 py-1 border border-amber-300 rounded text-xs w-full bg-white text-gray-800"
                          />
                        ) : (
                          <span className="text-gray-500 bg-slate-100 px-2 py-1 rounded-md text-[10px] font-medium border border-slate-200">
                            {v.organization}
                          </span>
                        )}
                      </td>

                      {/* Thai Timestamp */}
                      <td className="px-4 py-3 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                        {formatThaiDate(v.timestamp)}
                      </td>

                      {/* Admin Controls */}
                      {isAdminLoggedIn && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(v.id)}
                                title="บันทึกข้อมูล"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                title="ยกเลิกการแก้ไข"
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center items-center gap-1">
                              <button
                                onClick={() => startEdit(v)}
                                title="แก้ไขรายชื่อ"
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการเข้าชมของ คุณ ${v.firstName} ${v.lastName}?`)) {
                                    onDeleteVisitor(v.id);
                                  }
                                }}
                                title="ลบข้อมูล"
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
