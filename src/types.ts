export interface VisitorRecord {
  id: string;
  firstName: string;
  lastName: string;
  organization: string; // หน่วยสังกัด/สถานภาพ
  timestamp: number; // For exact date-time
  dateString: string; // YYYY-MM-DD
}

export interface QuotaSettings {
  daily: number;
  monthly: number;
  yearly: number;
}

export interface MonthlyCount {
  monthIndex: number; // 0-11
  monthNameTh: string;
  count: number;
}

export interface YearlyCount {
  yearEn: number;
  yearTh: number; // พ.ศ.
  count: number;
}
