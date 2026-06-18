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
  Timer,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  visitors: VisitorRecord[];
  quotaSettings: QuotaSettings;
}

export default function Dashboard({
  visitors,
  quotaSettings,
}: DashboardProps) {
  // Query state for chart year filtering
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

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

  return (
    <div className="space-y-8">
      {/* 4x1 Bento Overview Cards representing quotas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Monthly Quota Counter with Emerald-500 bottom border */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-b-4 border-emerald-500 p-5 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">จำนวนผู้เข้าเยี่ยมชมต่อเดือน</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1.5">
              {thisMonthCount} <span className="text-slate-400 text-sm font-normal">คน</span>
            </h3>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-emerald-500"
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-[9px] text-slate-500 font-bold mt-2 flex items-center justify-between">
              <span>สถิติเดือน: {MONTHS_THAI[currentMonthEn]}</span>
              <span className="text-emerald-600 font-bold">ไม่จำกัดความจุ</span>
            </p>
          </div>
        </div>

        {/* Yearly Quota Counter with Amber-500 bottom border */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-255 border-b-4 border-amber-500 p-5 flex flex-col justify-between transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">จำนวนผู้เข้าเยี่ยมชมต่อปี</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1.5">
              {thisYearCount} <span className="text-slate-400 text-sm font-normal">คน</span>
            </h3>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-amber-500"
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-[9px] text-slate-500 font-bold mt-2 flex items-center justify-between">
              <span>ปีงบประมาณ พ.ศ. {currentYearEn + 543}</span>
              <span className="text-amber-600 font-bold">ไม่จำกัดความจุ</span>
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
                <h3 className="text-sm font-bold text-slate-800">
                  สถิติตามรายปี
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

    </div>
  );
}
