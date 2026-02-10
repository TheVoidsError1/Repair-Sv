import { MainLayout } from "@/components/layout/MainLayout";
import { ReceiptContent } from "@/components/receipt/ReceiptContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs, type RepairItem } from "@/contexts/RepairsContext";
import { mapRepairOrderToReceiptData } from "@/lib/receipt";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** รูปแบบการรับบริการ: รับหน้าร้าน = ซ่อมรอรับ, ทิ้งเครื่องไว้ = นัดมารับภายหลัง */
export type ServiceType = "walk_in" | "drop_off";

export interface RepairOrderData {
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
  /** รูปแบบการรับบริการ (เพิ่มใหม่, backward compatible) */
  service_type?: ServiceType;
  /** วันที่รับ/มารับเครื่อง (YYYY-MM-DD หรือ locale) */
  receive_date?: string;
  /** เวลารับเครื่อง (HH:mm) */
  receive_time?: string;
}

interface BillContentProps {
  data: RepairOrderData;
  formatPrice: (value: string) => string;
  copyLabel: string;
  t: (key: string) => string;
  footerText: string;
}

/** แมปงานซ่อมจากรายการ → ข้อมูลสำหรับใบรับซ่อม (ประเภทจาก tag: endOfDay=หน้าร้าน, leaveDevice=ฝากเครื่อง) */
function repairItemToBillData(item: RepairItem, language: "th" | "en"): RepairOrderData {
  const problemText = language === "th" ? item.issueTh : item.issue;
  const cost = String(item.estimatedCost);
  const service_type: ServiceType = item.tag === "endOfDay" ? "walk_in" : "drop_off";
  const now = new Date();
  const rawTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return {
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
  };
}

/** แปลงวันที่+เวลาแจ้งซ่อมเป็น Date (รองรับ พ.ศ., ค.ศ. และ ISO) */
function parseReportDateTime(dateStr: string, timeStr: string): Date | null {
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
    if (year > 2500) year -= 543; // พ.ศ. → ค.ศ.
  } else return null;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day, hour, minute);
  return isNaN(d.getTime()) ? null : d;
}

/** บวกชั่วโมงแล้วได้ ISO string สำหรับนัดรับเครื่อง */
function addHoursToPickup(dateStr: string, timeStr: string, hoursToAdd: number): string | null {
  const base = parseReportDateTime(dateStr, timeStr);
  if (!base || hoursToAdd < 0) return null;
  const pickup = new Date(base.getTime() + hoursToAdd * 60 * 60 * 1000);
  return pickup.toISOString();
}

/** ได้วันที่วันนี้เป็น YYYY-MM-DD */
function getTodayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/** ปัดเวลา HH:mm ให้เหลือเฉพาะนาที 00 หรือ 30 */
function roundTimeTo30Min(timeStr: string): string {
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

/** สร้าง ISO string สำหรับนัดรับจากวันที่ (YYYY-MM-DD) + เวลา (HH:mm) */
function buildPickupIsoFromDateAndTime(dateStr: string, timeStr: string): string | null {
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
function isPastDate(isoDateStr: string): boolean {
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export type ServiceFormValidation = { valid: boolean; message?: string };

/**
 * ตัวอย่าง: สร้าง payload สำหรับ save บิลรับซ่อม (ไม่สร้างบิลใหม่)
 * ใช้เมื่อจะส่งไป API หรือเก็บลง context/state
 * โครงสร้าง backward compatible กับบิลเดิม
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
  // drop_off
  if (!receiveDate?.trim()) return { valid: false, message: t("validationDateRequired") };
  const isoDate = receiveDate.includes("T") ? receiveDate.slice(0, 10) : receiveDate.replace(/\//g, "-").split("-").length === 3
    ? (() => {
        const p = receiveDate.trim().split(/[/-]/).map((s) => parseInt(s, 10));
        if (p.length < 3) return "";
        let y = p[2],
          m = p[1],
          d = p[0];
        if (y > 2500) y -= 543;
        return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      })()
    : receiveDate;
  if (isPastDate(isoDate)) return { valid: false, message: t("validationNoPastDate") };
  if (!receiveTime || !/^\d{1,2}:\d{2}$/.test(receiveTime.trim()))
    return { valid: false, message: t("validationTimeRequired") };
  return { valid: true };
}

const PICKUP_HOUR_OPTIONS = [1, 2, 3, 6, 12, 24, 48, 72] as const;

const BillContent = ({ data, formatPrice, copyLabel }: BillContentProps) => (
  <div className="repair-bill-single bg-white border-2 border-gray-800 rounded-lg p-4 print:p-3 text-gray-900">
    {/* แถวบนสุด เลขที่ / โลโก้ร้าน / ใบรับซ่อม + วันที่ */}
    <div className="flex justify-between items-start mb-2 text-xs">
    <div className="text-center">
        <p className="text-base font-extrabold tracking-tight leading-none">
          MacFix <span className="font-semibold">service</span>
        </p>
        <p className="text-xs font-semibold mt-1">โทร 084-615-2244</p>
        <p className="text-[10px] mt-0.5">
          456/105 ต.ตลาดขวา อ.เมือง จ.สุราษฎร์ธานี 84000
        </p>
      </div>



      <div className="text-right space-y-1">
        <p className="text-base font-bold leading-none">ใบรับซ่อม</p>
          <div className="flex flex-col items-end gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span>วันที่</span>
            <div className="border-b border-gray-500 min-w-[90px] text-[11px] text-right">
              {data.dateOfReport || "_____/_____/______"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>เวลาแจ้งซ่อม</span>
            <div className="border-b border-gray-500 min-w-[70px] text-[11px] text-right">
              {data.timeOfReport || "______"}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">({copyLabel})</p>
      </div>
    </div>

    <div className="border-t border-gray-800 mt-2 mb-3" />

    {/* ข้อมูลลูกค้า / เครื่อง */}
    <div className="text-xs space-y-2 mb-3">
      <div className="flex gap-4">
        <div className="flex-1 flex items-center gap-2">
          <span>ชื่อ</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px]">
            <span className="text-[11px] leading-tight px-1">
              {data.customer || ""}
            </span>
          </div>
        </div>
        <div className="w-48 flex items-center gap-2">
          <span>เบอร์โทร</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px]">
            <span className="text-[11px] leading-tight px-1">
              {data.phone || ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex items-center gap-2">
          <span>รุ่น</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px]">
            <span className="text-[11px] leading-tight px-1">
              {data.model || ""}
            </span>
          </div>
        </div>
        <div className="w-48 flex items-center gap-2">
          <span>สี</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px]">
            <span className="text-[11px] leading-tight px-1">
              {data.color || ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex items-center gap-2">
          <span>หมายเลขเครื่อง (IMEI)</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px]" />
        </div>
        <div className="w-48 flex items-center gap-2">
          <span>รหัสล็อคหน้าจอ</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px]">
            <span className="text-[11px] leading-tight px-1">
              {data.screenLockCode || ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <span className="pt-1">อาการเสีย</span>
        <div className="flex-1 border-b border-gray-400 min-h-[32px]">
          <span className="text-[11px] leading-tight px-1 align-top inline-block">
            {data.problemSymptoms || ""}
          </span>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <span className="text-xs">นัดรับเครื่อง</span>
        <div className="flex-1 border-b border-gray-400 min-h-[18px] text-[11px] px-1">
          {data.scheduledPickupTime
            ? (() => {
                try {
                  const d = new Date(data.scheduledPickupTime);
                  return isNaN(d.getTime()) ? data.scheduledPickupTime : d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
                } catch {
                  return data.scheduledPickupTime;
                }
              })()
            : "—"}
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <span>ประเมินราคา</span>
        <div className="w-32 border-b border-gray-400 min-h-[18px]">
          <span className="text-[11px] leading-tight px-1">
            {data.estimatedPrice ? formatPrice(data.estimatedPrice) : ""}
          </span>
        </div>
        <span>บาท</span>
        <span className="ml-4">นัดรับซ่อม</span>
        <div className="w-40 border-b border-gray-400 min-h-[18px]" />
      </div>
    </div>

    {/* แถบสรุปราคาซ่อม */}
    <div className="mt-2 mb-2">
      <div className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 inline-block rounded-t-sm">
        สรุปราคาซ่อม
      </div>
      <div className="border border-gray-800 border-t-0 rounded-b-sm p-2 text-xs">

        <div className="flex justify-between border-t border-gray-500 pt-1 mt-1 font-semibold">
          <span>รวมทั้งสิ้น (บาท)</span>
          <span>{data.repairSummaryPrice ? formatPrice(data.repairSummaryPrice) : "-"}</span>
        </div>
      </div>
    </div>

    {/* เงื่อนไขในการซ่อม */}
    <div className="mt-3 border border-gray-800 rounded-sm text-[10px]">
      <div className="bg-gray-200 border-b border-gray-800 px-2 py-1 font-semibold">
        เงื่อนไขในการซ่อม
      </div>
      <div className="p-2 space-y-1 leading-snug">
        <p>1. โปรดตรวจสอบรายการซ่อมให้ชัดเจนก่อนลงนามในเอกสารการซ่อม</p>
        <p>2. แจ้งผลการซ่อมภายใน 30 วัน นับจากวันที่แจ้งลูกค้า หากเกินกำหนดถือว่าสละสิทธิ์การรับประกัน</p>
        <p>3. เครื่องที่เดินทางมารับเกิน 30 วัน บริษัทขอคิดค่าฝากเครื่องตามอัตราที่กำหนด</p>
        <p>4. ความเสียหายจากการตก กระแทก เปียกน้ำ หรือการซ่อมแซมจากที่อื่น ไม่อยู่ในเงื่อนไขการรับประกัน</p>
        <p>5. การรับประกันไม่ครอบคลุมข้อมูลภายในเครื่อง ลูกค้าควรสำรองข้อมูลก่อนส่งซ่อมทุกครั้ง</p>
      </div>
    </div>


    {/* ลายเซ็น */}
    <div className="mt-4 flex justify-between text-[10px]">
      <div className="w-1/3 text-center">
        <div className="border-b border-gray-500 mb-1" />
        <p>ลูกค้า</p>
      </div>
      <div className="w-1/3 text-center">
        <div className="border-b border-gray-500 mb-1" />
        <p>ผู้รับซ่อม</p>
      </div>
    </div>
  </div>
);

function getDefaultReportDateTime(language: "th" | "en") {
  const now = new Date();
  return {
    dateOfReport: now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    timeOfReport: roundTimeTo30Min(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`),
  };
}

/** ค่าเริ่มต้นวันที่/เวลาแจ้งซ่อม (ใช้ตอนโหลดหน้าให้คำนวณอัตโนมัติทันที) */
function getInitialReportDateTime() {
  const now = new Date();
  const raw = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return {
    dateOfReport: now.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }),
    timeOfReport: roundTimeTo30Min(raw),
  };
}

const RepairBill = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { repairs } = useRepairs();
  const dataFromNav = location.state as RepairOrderData | null | undefined;
  const [selectedBillData, setSelectedBillData] = useState<RepairOrderData | null>(null);
  /** เลขที่บิลใบเสร็จ (จาก repair_id เมื่อเลือกจากรายการ) */
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(() => getInitialReportDateTime().dateOfReport);
  const [reportTime, setReportTime] = useState(() => getInitialReportDateTime().timeOfReport);
  const [hoursToAdd, setHoursToAdd] = useState<number>(24);

  /** รูปแบบการรับบริการ: รับหน้าร้าน | ทิ้งเครื่องไว้ */
  const [serviceType, setServiceType] = useState<ServiceType>("walk_in");
  /** เวลารับเครื่อง (HH:mm) ใช้ทั้ง walk_in และ drop_off */
  const [receiveTime, setReceiveTime] = useState(() => getInitialReportDateTime().timeOfReport);
  /** วันมารับเครื่อง (YYYY-MM-DD) ใช้เฉพาะ drop_off */
  const [receiveDate, setReceiveDate] = useState(() => getTodayIsoDate());

  const displayData = dataFromNav ?? selectedBillData;

  useEffect(() => {
    if (!displayData) return;
    const defaultDt = getDefaultReportDateTime(language);
    let dateVal = displayData.dateOfReport || defaultDt.dateOfReport;
    let timeVal = displayData.timeOfReport ?? defaultDt.timeOfReport;
    if (dateVal.includes("T")) {
      try {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          dateVal = d.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
          if (!displayData.timeOfReport) timeVal = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        }
      } catch {
        //
      }
    }
    setReportDate(dateVal);
    setReportTime(timeVal);
    // sync รูปแบบการรับบริการจากบิลเดิม (backward compatible)
    const st = displayData.service_type ?? "walk_in";
    setServiceType(st);
    if (displayData.receive_time) setReceiveTime(roundTimeTo30Min(displayData.receive_time));
    else if (st === "walk_in") setReceiveTime(roundTimeTo30Min(timeVal));
    if (st === "drop_off" && displayData.receive_date) {
      const rd = displayData.receive_date;
      if (rd.includes("-") && rd.length >= 10) setReceiveDate(rd.slice(0, 10));
      else if (rd.includes("/")) {
        const p = rd.trim().split(/[/-]/).map((s) => parseInt(s, 10));
        if (p.length >= 3) {
          let y = p[2];
          if (y > 2500) y -= 543;
          setReceiveDate(`${y}-${p[1].toString().padStart(2, "0")}-${p[0].toString().padStart(2, "0")}`);
        }
      }
    } else if (st === "drop_off") setReceiveDate(getTodayIsoDate());
  }, [displayData?.dateOfReport, displayData?.timeOfReport, displayData?.service_type, displayData?.receive_date, displayData?.receive_time, language, !!displayData]);

  const handlePrint = () => {
    window.print();
  };

  /** ตัวอย่างการ save: เมื่อต้องการบันทึกบิล (ไม่สร้างบิลใหม่) ใช้ effectiveData และ buildRepairBillSavePayload */
  // const handleSaveBill = () => {
  //   if (!serviceFormValidation.valid) return;
  //   const payload = buildRepairBillSavePayload(effectiveData);
  //   // await api.updateRepair(orderId, payload);
  //   // setRepairs(prev => prev.map(r => r.id === orderId ? { ...r, ...payload } : r));
  // };

  const formatPrice = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "-" : `฿${num.toLocaleString()}`;
  };

  const footerText = language === "th" ? "" : "";

  const handleSelectRepair = (item: RepairItem) => {
    setSelectedRepairId(item.id);
    const base = repairItemToBillData(item, language);
    const st: ServiceType = item.tag === "endOfDay" ? "walk_in" : "drop_off";
    const now = new Date();
    const rawTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setSelectedBillData({
      ...base,
      service_type: st,
      receive_date: getTodayIsoDate(),
      receive_time: roundTimeTo30Min(rawTime),
    });
  };

  const handleBackToList = () => {
    setSelectedBillData(null);
    setSelectedRepairId(null);
  };

  const computedPickupIso = reportDate && reportTime ? addHoursToPickup(reportDate, reportTime, hoursToAdd) : null;

  /** คำนวณ effectiveData ตามรูปแบบการรับบริการ (ใช้บิลเดิม ไม่สร้างบิลใหม่) */
  const effectiveData: RepairOrderData = (() => {
    if (!displayData) return null as unknown as RepairOrderData;
    const todayIso = getTodayIsoDate();
    const todayLocale = new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (serviceType === "walk_in") {
      const pickupIso = buildPickupIsoFromDateAndTime(todayIso, receiveTime);
      return {
        ...displayData,
        service_type: "walk_in",
        receive_date: todayIso,
        receive_time: receiveTime,
        dateOfReport: displayData.dateOfReport || todayLocale,
        timeOfReport: displayData.timeOfReport ?? receiveTime,
        scheduledPickupTime: pickupIso ?? displayData.scheduledPickupTime,
      };
    }
    const pickupIso = buildPickupIsoFromDateAndTime(receiveDate, receiveTime);
    return {
      ...displayData,
      service_type: "drop_off",
      receive_date: receiveDate,
      receive_time: receiveTime,
      dateOfReport: reportDate || displayData.dateOfReport,
      timeOfReport: reportTime || displayData.timeOfReport,
      scheduledPickupTime: pickupIso ?? displayData.scheduledPickupTime,
    };
  })();

  /** ข้อมูลใบเสร็จรับเงิน (ดึงจากบิลรับแจ้งซ่อม ไม่สร้างใหม่ - อ้างอิงรูปแบบต้นแบบ 100%) */
  const receiptDataBase = effectiveData
    ? mapRepairOrderToReceiptData(effectiveData, {
        receiptNo: selectedRepairId ?? "—",
        issueDate: effectiveData.dateOfReport,
        copyLabel: t("receiptForCustomer"),
      })
    : null;

  // โหมดรายการ: เลือกงานซ่อมเพื่อออกบิล
  if (!displayData) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="page-title">{t("repairBill")}</h1>
              <p className="page-description">
                {language === "th"
                  ? "เลือกงานซ่อมจากรายการด้านล่างเพื่อออกใบรับซ่อม"
                  : "Select a repair from the list below to issue a receipt."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/repairs")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t("backToRepairs")}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                {language === "th" ? "รายการงานซ่อม" : "Repair list"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "กดปุ่มออกบิลที่แถวที่ต้องการเพื่อดูและพิมพ์ใบรับซ่อม"
                  : "Click Issue bill on a row to view and print the receipt."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repairs.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  {language === "th" ? "ยังไม่มีงานซ่อมในระบบ" : "No repairs in the system."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-3 font-medium">{t("orderId")}</th>
                        <th className="text-left p-3 font-medium">{t("customer")}</th>
                        <th className="text-left p-3 font-medium">{t("device")}</th>
                        <th className="text-left p-3 font-medium">{t("issue")}</th>
                        <th className="text-right p-3 font-medium">{t("estCost")}</th>
                        <th className="text-right p-3 font-medium w-28">
                          {language === "th" ? "ออกบิล" : "Bill"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {repairs.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30"
                        >
                          <td className="p-3 font-mono text-muted-foreground">{item.id}</td>
                          <td className="p-3">{item.customer}</td>
                          <td className="p-3">{item.device}</td>
                          <td className="p-3">
                            {language === "th" ? item.issueTh : item.issue}
                          </td>
                          <td className="p-3 text-right">
                            ฿{item.estimatedCost.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1"
                              onClick={() => handleSelectRepair(item)}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {language === "th" ? "ออกบิล" : "Bill"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // โหมดแสดงใบรับซ่อม + พิมพ์
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto repair-bill-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
          <div className="flex gap-2">
            {selectedBillData ? (
              <Button variant="outline" onClick={handleBackToList} className="gap-2 w-fit">
                <ArrowLeft className="w-4 h-4" />
                {language === "th" ? "กลับรายการ" : "Back to list"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/repairs")} className="gap-2 w-fit">
                <ArrowLeft className="w-4 h-4" />
                {t("backToRepairs")}
              </Button>
            )}
          </div>
          <Button onClick={handlePrint} className="gap-2 w-fit">
            <Printer className="w-4 h-4" />
            {t("printBill")}
          </Button>
        </div>

        <div className="receipt-print-wrapper hidden print:block">
          {receiptDataBase && <ReceiptContent data={receiptDataBase} />}
        </div>

        <div className="print:hidden flex flex-col w-full max-w-[210mm] mx-auto">
          {receiptDataBase && <ReceiptContent data={receiptDataBase} />}
        </div>
        <p className="print:hidden text-center text-sm text-muted-foreground mt-4">
          {language === "th"
            ? "เมื่อพิมพ์จะได้ 1 ใบเสร็จต่อ 1 หน้า A4"
            : "Print: 1 receipt per A4 page"}
        </p>
      </div>
    </MainLayout>
  );
};

export default RepairBill;
