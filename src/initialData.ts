import { VisitorRecord, QuotaSettings } from "./types";

export const DEFAULT_QUOTA_SETTINGS: QuotaSettings = {
  daily: 40,
  monthly: 300,
  yearly: 2000,
};

export const INITIAL_VISITORS: VisitorRecord[] = [
  // Jan 2026 (พ.ศ. 2569)
  {
    id: "v-1",
    firstName: "สมศักดิ์",
    lastName: "รักเรียน",
    organization: "นักเรียน ชั้น ม.3 โรงเรียนวัดแสลง",
    timestamp: new Date(2026, 0, 15, 10, 30).getTime(),
    dateString: "2026-01-15",
  },
  {
    id: "v-2",
    firstName: "ประหยัด",
    lastName: "แสงอาทิตย์",
    organization: "องค์การบริหารส่วนตำบลแสลง (อบต.)",
    timestamp: new Date(2026, 0, 15, 11, 15).getTime(),
    dateString: "2026-01-15",
  },
  {
    id: "v-3",
    firstName: "เยาวภา",
    lastName: "งามยิ่ง",
    organization: "อาจารย์ มหาวิทยาลัยราชภัฏรำไพพรรณี",
    timestamp: new Date(2026, 0, 20, 13, 0).getTime(),
    dateString: "2026-01-20",
  },
  // Feb 2026
  {
    id: "v-4",
    firstName: "วิชัย",
    lastName: "เดชเดชา",
    organization: "นักศึกษา คณะวิศวกรรมศาสตร์ มรภ.รำไพพรรณี",
    timestamp: new Date(2026, 1, 5, 9, 45).getTime(),
    dateString: "2026-02-05",
  },
  {
    id: "v-5",
    firstName: "อารีย์",
    lastName: "ขยันดี",
    organization: "ชุมชนคนรักษ์พลังงานบ้านแสลง",
    timestamp: new Date(2026, 1, 5, 14, 20).getTime(),
    dateString: "2026-02-05",
  },
  {
    id: "v-6",
    firstName: "ณัฐวุฒิ",
    lastName: "พึ่งรุ่ง",
    organization: "นักเรียน ชั้น ม.2 โรงเรียนวัดคิริวิหาร",
    timestamp: new Date(2026, 1, 24, 10, 0).getTime(),
    dateString: "2026-02-24",
  },
  // Mar 2026
  {
    id: "v-7",
    firstName: "ศิริพร",
    lastName: "สุนทรชัย",
    organization: "เจ้าหน้าที่ การไฟฟ้าส่วนภูมิภาค จ.จันทบุรี",
    timestamp: new Date(2026, 2, 12, 10, 30).getTime(),
    dateString: "2026-03-12",
  },
  {
    id: "v-8",
    firstName: "ธนวัฒน์",
    lastName: "เจริญสุข",
    organization: "นักท่องเที่ยว/ประชาชนทั่วไป",
    timestamp: new Date(2026, 2, 15, 15, 10).getTime(),
    dateString: "2026-03-15",
  },
  // Apr 2026 (พ.ศ. 2569)
  {
    id: "v-9",
    firstName: "สุวรรณ",
    lastName: "โพธิ์ศรี",
    organization: "คณะครู โรงเรียนชุมชนบ้านเนินดินแดง",
    timestamp: new Date(2026, 3, 2, 11, 0).getTime(),
    dateString: "2026-04-02",
  },
  // May 2026
  {
    id: "v-10",
    firstName: "มานพ",
    lastName: "รุ่งอรุณ",
    organization: "วิศวกร บริษัท พลังงานสะอาด จำกัด",
    timestamp: new Date(2026, 4, 18, 14, 0).getTime(),
    dateString: "2026-05-18",
  },
  {
    id: "v-11",
    firstName: "กิตติพงษ์",
    lastName: "ปัญญาไว",
    organization: "นักศึกษา ระดับ ปวส. เทคนิคจันทบุรี",
    timestamp: new Date(2026, 4, 18, 14, 30).getTime(),
    dateString: "2026-05-18",
  },
  {
    id: "v-12",
    firstName: "เบญจวรรณ",
    lastName: "สิงหร",
    organization: "คณะกรรมการพัฒนาสตรีหมู่บ้าน แสลง",
    timestamp: new Date(2026, 4, 25, 9, 30).getTime(),
    dateString: "2026-05-25",
  },
  // Jun 2026
  {
    id: "v-13",
    firstName: "พัชรา",
    lastName: "บุญส่ง",
    organization: "นักเรียน ชั้น ม.1 โรงเรียนวัดแสลง",
    timestamp: new Date(2026, 5, 12, 10, 0).getTime(),
    dateString: "2026-06-12",
  },
  {
    id: "v-14",
    firstName: "อภิสิทธิ์",
    lastName: "พรมศิริ",
    organization: "บุคคลทั่วไป สนใจระบบโซลาร์เซลล์",
    timestamp: new Date(2026, 5, 15, 13, 10).getTime(),
    dateString: "2026-06-15",
  },
  {
    id: "v-15",
    firstName: "ดวงฤดี",
    lastName: "มั่งคั่ง",
    organization: "ผู้ปกครองนักเรียน โรงเรียนวัดแสลง",
    timestamp: new Date(2026, 5, 17, 10, 50).getTime(),
    dateString: "2026-06-17",
  },
  {
    id: "v-16",
    firstName: "จิรยุทธ์",
    lastName: "โสภณ",
    organization: "นักศึกษา ฝึกงาน แผนกไฟฟ้าเทคโนโลยี",
    timestamp: new Date(2026, 5, 18, 8, 15).getTime(),
    dateString: "2026-06-18", // Will correct, just today's example
  },
  // Visitors from previous year (2025 / พ.ศ. 2568)
  {
    id: "v-old-1",
    firstName: "สมพร",
    lastName: "ใจดี",
    organization: "ครูวิชาการ โรงเรียนวัดวังทอง",
    timestamp: new Date(2025, 10, 20, 10, 15).getTime(),
    dateString: "2025-11-20",
  },
  {
    id: "v-old-2",
    firstName: "พีระพล",
    lastName: "ดวงตา",
    organization: "กลุ่มศึกษาดูงานระบบผลิตไฟฟ้าพลังงานชีวมวล จันทบุรี",
    timestamp: new Date(2025, 11, 15, 14, 0).getTime(),
    dateString: "2025-12-15",
  },
];
