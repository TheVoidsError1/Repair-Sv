/**
 * Types และ helpers ร่วมสำหรับใบแจ้งซ่อม (Repair Order) และใบเสร็จรับเงิน
 * ใช้โดย RepairOrderBill, RepairReceipt, RepairBill, RepairNew
 */

/** รูปแบบการรับบริการ: รับหน้าร้าน = ซ่อมรอรับ, ทิ้งเครื่องไว้ = นัดมารับภายหลัง */
export type ServiceType = "walk_in" | "drop_off";

export interface RepairOrderData {
  /** Serial Number / IMEI (15 digits) — ใช้เป็นตัวระบุหลักสำหรับการรับประกัน */
  serialNumber?: string;
  customer: string;
  phone: string;
  model: string;
  color: string;
  screenLockCode: string;
  problemSymptoms: string;
  deposit: string;
  estimatedPrice: string;
  repairSummaryPrice: string;
  dateOfReport: string;
  timeOfReport?: string;
  scheduledPickupTime?: string;
  service_type?: ServiceType;
  receive_date?: string;
  receive_time?: string;
  /** รหัสอะไหล่ที่เลือก (จาก parts table) */
  selectedPartId?: string;
}

/** รายการซ่อมที่ใช้สร้างข้อมูลบิล (ฟิลด์ที่จำเป็นจาก RepairsContext) */
export interface RepairItemForBill {
  id: string;
  serialNumber?: string;
  customer: string;
  phone: string;
  device: string;
  issue: string;
  issueTh: string;
  estimatedCost: number;
  createdAt: string;
  tag?: string;
}

export type ServiceFormValidation = { valid: boolean; message?: string };

/** ได้วันที่วันนี้เป็น YYYY-MM-DD */
export function getTodayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/** ปัดเวลา HH:mm ให้เหลือเฉพาะนาที 00 หรือ 30 */
export function roundTimeTo30Min(timeStr: string): string {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "09:00";
  let h = parseInt(m[1], 10);
  let min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return "09:00";
  if (min < 15) min = 0;
  else if (min < 45) min = 30;
  else {
    h += 1;
    min = 0;
    if (h >= 24) {
      h = 23;
      min = 30;
    }
  }
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

/** แปลงวันที่+เวลาแจ้งซ่อมเป็น Date (รองรับ พ.ศ., ค.ศ. และ ISO) */
export function parseReportDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;
  let parsedTime = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})/);
  let hour: number, minute: number;
  const dateOnly = dateStr.split("T")[0];
  if (parsedTime) {
    hour = parseInt(parsedTime[1], 10);
    minute = parseInt(parsedTime[2], 10);
  } else if (dateStr.includes("T") && /T\d{1,2}:\d{1,2}/.test(dateStr)) {
    const t = dateStr.match(/T(\d{1,2}):(\d{1,2})/);
    if (!t) return null;
    hour = parseInt(t[1], 10);
    minute = parseInt(t[2], 10);
  } else return null;
  if (hour > 23 || minute > 59) return null;

  const dash = dateOnly.includes("-");
  const slash = dateOnly.includes("/");
  let year: number, month: number, day: number;

  if (dash) {
    const [y, m, d] = dateOnly.split("-").map((s) => parseInt(s, 10));
    if (!y || !m || !d) return null;
    year = y;
    month = m;
    day = d;
  } else if (slash) {
    const parts = dateOnly.split("/").map((s) => s.trim());
    if (parts.length < 3) return null;
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
    if (year > 2500) year -= 543;
  } else return null;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day, hour, minute);
  return isNaN(d.getTime()) ? null : d;
}

/** บวกชั่วโมงแล้วได้ ISO string สำหรับนัดรับเครื่อง */
export function addHoursToPickup(dateStr: string, timeStr: string, hoursToAdd: number): string | null {
  const base = parseReportDateTime(dateStr, timeStr);
  if (!base || hoursToAdd < 0) return null;
  const pickup = new Date(base.getTime() + hoursToAdd * 60 * 60 * 1000);
  return pickup.toISOString();
}

/** สร้าง ISO string สำหรับนัดรับจากวันที่ (YYYY-MM-DD) + เวลา (HH:mm) */
export function buildPickupIsoFromDateAndTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!t) return null;
  const h = parseInt(t[1], 10);
  const m = parseInt(t[2], 10);
  if (h > 23 || m > 59) return null;
  const timePart = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  const iso = `${dateStr}T${timePart}:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** ตรวจสอบว่าเป็นวันย้อนหลัง (เทียบแค่วัน ไม่รวมเวลา) */
export function isPastDate(isoDateStr: string): boolean {
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/**
 * สร้าง payload สำหรับ save บิลรับซ่อม (backward compatible)
 */
export function buildRepairBillSavePayload(data: RepairOrderData): {
  service_type: ServiceType;
  receive_date: string;
  receive_time: string;
  [key: string]: unknown;
} {
  const st = data.service_type ?? "walk_in";
  const todayIso = getTodayIsoDate();
  return {
    ...data,
    service_type: st,
    receive_date: st === "walk_in" ? todayIso : (data.receive_date ?? todayIso),
    receive_time: data.receive_time ?? "",
  };
}

/** Validation สำหรับฟอร์มรูปแบบการรับบริการ */
export function validateServiceForm(
  serviceType: ServiceType,
  receiveDate: string | undefined,
  receiveTime: string | undefined,
  t: (key: string) => string
): ServiceFormValidation {
  if (serviceType === "walk_in") {
    if (!receiveTime || !/^\d{1,2}:\d{2}$/.test(receiveTime.trim()))
      return { valid: false, message: t("validationTimeRequired") };
    return { valid: true };
  }
  if (!receiveDate?.trim()) return { valid: false, message: t("validationDateRequired") };
  const isoDate = receiveDate.includes("T") ? receiveDate.slice(0, 10) : receiveDate.replace(/\//g, "-").split("-").length === 3
    ? (() => {
        const p = receiveDate.trim().split(/[/-]/).map((s) => parseInt(s, 10));
        if (p.length < 3) return "";
        let y = p[2], m = p[1], d = p[0];
        if (y > 2500) y -= 543;
        return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      })()
    : receiveDate;
  if (isPastDate(isoDate)) return { valid: false, message: t("validationNoPastDate") };
  if (!receiveTime || !/^\d{1,2}:\d{2}$/.test(receiveTime.trim()))
    return { valid: false, message: t("validationTimeRequired") };
  return { valid: true };
}

/** แมปรายการซ่อม → ข้อมูลสำหรับใบรับซ่อม */
export function repairItemToBillData(item: RepairItemForBill & { selectedPartId?: string; selectedPart?: { partNumber?: string; name?: string; nameTh?: string } }, language: "th" | "en"): RepairOrderData {
  const problemText = language === "th" ? item.issueTh : item.issue;
  const cost = String(item.estimatedCost);
  const service_type: ServiceType = item.tag === "endOfDay" ? "walk_in" : "drop_off";
  const now = new Date();
  const rawTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return {
    serialNumber: item.serialNumber,
    customer: item.customer,
    phone: item.phone,
    model: item.device,
    color: "",
    screenLockCode: "",
    problemSymptoms: problemText,
    deposit: "",
    estimatedPrice: cost,
    repairSummaryPrice: cost,
    dateOfReport: item.createdAt,
    timeOfReport: undefined,
    scheduledPickupTime: undefined,
    service_type,
    receive_date: getTodayIsoDate(),
    receive_time: roundTimeTo30Min(rawTime),
    selectedPartId: item.selectedPartId,
  };
}
