export const MONTHS_THAI = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export const MONTHS_SHORT_THAI = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function formatThaiDate(timestamp: number, showTime: boolean = true): string {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = MONTHS_THAI[date.getMonth()];
  const yearTh = date.getFullYear() + 543; // Convert AD to BE
  
  if (showTime) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${yearTh} เวลา ${hours}:${minutes} น.`;
  }
  
  return `${day} ${month} ${yearTh}`;
}

export function formatThaiDateShort(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = MONTHS_SHORT_THAI[date.getMonth()];
  const yearTh = (date.getFullYear() + 543).toString().slice(-2);
  return `${day} ${month} ${yearTh}`;
}

export function getTodayString(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${date}`;
}

export function getMonthString(timestamp: number): string {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
}

export function getYearString(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}`;
}
