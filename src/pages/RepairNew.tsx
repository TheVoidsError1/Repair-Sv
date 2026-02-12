import { MainLayout } from "@/components/layout/MainLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Time30Select } from "@/components/ui/time-30-select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs } from "@/contexts/RepairsContext";
import { getPartStockStatus, partsList } from "@/lib/partsData";
import type { RepairOrderData, ServiceType } from "@/types/repairOrder";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/** อ่าน type จาก URL: in-store → walk_in, leave-device → drop_off */
function getServiceTypeFromSearchParams(searchParams: URLSearchParams): ServiceType {
  const type = searchParams.get("type");
  if (type === "leave-device") return "drop_off";
  return "walk_in"; // in-store หรือไม่มี = รับหน้าร้าน
}

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

/** IMEI/Serial: ถ้าเป็นตัวเลขเท่านั้นต้อง 15 หลัก */
function validateSerialNumber(value: string): { valid: boolean; message?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, message: "กรุณากรอกหมายเลข IMEI / Serial Number" };
  if (/^\d+$/.test(trimmed) && trimmed.length !== 15) {
    return { valid: false, message: "หมายเลข IMEI ต้องเป็นตัวเลข 15 หลัก" };
  }
  return { valid: true };
}

const initialFormData = {
  serialNumber: "",
  customer: "",
  phone: "",
  model: "",
  color: "",
  screenLockCode: "",
  problemSymptoms: "",
  deposit: "",
  estimatedPrice: "",
  repairSummaryPrice: "",
  dateOfReport: "",
  timeOfReport: "",
  scheduledPickupTime: "",
};

const RepairNew = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { repairs } = useRepairs();
  const [formData, setFormData] = useState(initialFormData);
  const [serialError, setSerialError] = useState("");
  const [duplicateSnWarning, setDuplicateSnWarning] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>("");

  /** รูปแบบการรับบริการ จาก URL (?type=in-store | type=leave-device) */
  const serviceType: ServiceType = getServiceTypeFromSearchParams(searchParams);

  /** เวลารับเครื่อง (HH:mm) ใช้ทั้ง walk_in และ drop_off — นาทีเฉพาะ 00 หรือ 30 */
  const [receiveTime, setReceiveTime] = useState(() =>
    roundTimeTo30Min(
      `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`
    )
  );
  /** วันมารับเครื่อง (YYYY-MM-DD) ใช้เฉพาะ drop_off */
  const [receiveDate, setReceiveDate] = useState(() => getTodayIsoDate());

  const receiveDateAsDate = receiveDate
    ? (() => {
        const [y, m, d] = receiveDate.split("-").map((n) => parseInt(n, 10));
        if (!y || !m || !d) return undefined;
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? undefined : dt;
      })()
    : undefined;

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /** ตั้งวันที่และเวลาแจ้งซ่อม = ช่วงที่กดเข้ามาสร้างใบแจ้งซ่อม (โหลดหน้านี้) — เรียกครั้งเดียวตอนเปิดหน้า */
  const setReportDateTimeOnOpen = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      dateOfReport: now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      timeOfReport: roundTimeTo30Min(timeStr),
    }));
  };

  useEffect(() => {
    setReportDateTimeOnOpen();
  }, []);

  const handleCreateOrder = () => {
    setSerialError("");
    setDuplicateSnWarning(false);
    const sn = formData.serialNumber.trim();
    const validation = validateSerialNumber(formData.serialNumber);
    if (!validation.valid) {
      setSerialError(language === "th" ? (validation.message ?? "กรุณากรอก IMEI 15 หลัก") : "Enter 15-digit IMEI / Serial");
      return;
    }
    const isDuplicate = repairs.some(
      (r) => r.serialNumber && r.serialNumber.trim().toLowerCase() === sn.toLowerCase()
    );
    if (isDuplicate) {
      setDuplicateSnWarning(true);
      return;
    }
    const now = new Date();
    const defaultDate = now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const todayIso = getTodayIsoDate();
    const dateForPickup = serviceType === "walk_in" ? todayIso : receiveDate;
    const timePart = /^\d{1,2}:\d{2}$/.test(receiveTime.trim())
      ? `${receiveTime.trim().split(":").map((x) => x.padStart(2, "0")).join(":")}`.slice(0, 5)
      : "09:00";
    const scheduledPickupTimeIso = dateForPickup && receiveTime
      ? `${dateForPickup}T${timePart}:00`
      : undefined;
    const pickupDate = scheduledPickupTimeIso ? new Date(scheduledPickupTimeIso) : null;
    const orderData: RepairOrderData = {
      ...formData,
      serialNumber: sn,
      dateOfReport: formData.dateOfReport || defaultDate,
      timeOfReport: formData.timeOfReport || undefined,
      scheduledPickupTime: pickupDate && !isNaN(pickupDate.getTime()) ? pickupDate.toISOString() : undefined,
      service_type: serviceType,
      receive_date: dateForPickup,
      receive_time: receiveTime,
    };
    setFormData(initialFormData);
    navigate("/repairs/bill/order", { state: orderData });
  };

  const doSubmitOrder = () => {
    const sn = formData.serialNumber.trim();
    const now = new Date();
    const defaultDate = now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const todayIso = getTodayIsoDate();
    const dateForPickup = serviceType === "walk_in" ? todayIso : receiveDate;
    const timePart = /^\d{1,2}:\d{2}$/.test(receiveTime.trim())
      ? `${receiveTime.trim().split(":").map((x) => x.padStart(2, "0")).join(":")}`.slice(0, 5)
      : "09:00";
    const scheduledPickupTimeIso = dateForPickup && receiveTime ? `${dateForPickup}T${timePart}:00` : undefined;
    const pickupDate = scheduledPickupTimeIso ? new Date(scheduledPickupTimeIso) : null;
    const orderData: RepairOrderData = {
      ...formData,
      serialNumber: sn,
      dateOfReport: formData.dateOfReport || defaultDate,
      timeOfReport: formData.timeOfReport || undefined,
      scheduledPickupTime: pickupDate && !isNaN(pickupDate.getTime()) ? pickupDate.toISOString() : undefined,
      service_type: serviceType,
      receive_date: dateForPickup,
      receive_time: receiveTime,
    };
    setFormData(initialFormData);
    setDuplicateSnWarning(false);
    navigate("/repairs/bill/order", { state: orderData });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">{t("createNewRepairOrder")}</h1>
          <p className="page-description">{t("enterCustomerDeviceDetails")}</p>
        </div>

        <Card className="w-full">
          <CardHeader className="border-b border-border/60 py-5 px-6">
            <div className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-lg">{t("createNewRepairOrder")}</CardTitle>
                <CardDescription>{t("enterCustomerDeviceDetails")}</CardDescription>
              </div>
              <div className="flex flex-col items-end rounded-lg bg-muted/50 px-3 py-2 border border-border/50 shrink-0">
                <span className="text-xs text-muted-foreground">{t("dateOfRepairReport")}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formData.dateOfReport ||
                    new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  {" · "}
                  {formData.timeOfReport ||
                    `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
              <div className="grid gap-2">
                <Label htmlFor="customer">{t("customerName")}</Label>
                <Input
                  id="customer"
                  placeholder={t("enterCustomerName")}
                  value={formData.customer}
                  onChange={(e) => handleInputChange("customer", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input
                  id="phone"
                  placeholder={t("enterPhoneNumber")}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="serialNumber">
                  {language === "th" ? "หมายเลข IMEI / Serial Number" : "IMEI / Serial Number"}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="serialNumber"
                  placeholder={language === "th" ? "กรอก 15 หลัก (ตัวเลข)" : "15 digits (numeric)"}
                  value={formData.serialNumber}
                  onChange={(e) => {
                    handleInputChange("serialNumber", e.target.value);
                    setSerialError("");
                  }}
                  className={serialError ? "border-destructive" : ""}
                />
                {serialError && (
                  <p className="text-sm text-destructive">{serialError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">{t("model")}</Label>
                <Input
                  id="model"
                  placeholder={t("enterModel")}
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">{t("color")}</Label>
                <Input
                  id="color"
                  placeholder={t("enterColor")}
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="screenLockCode">{t("screenLockCode")}</Label>
                <Input
                  id="screenLockCode"
                  placeholder={t("enterScreenLockCode")}
                  value={formData.screenLockCode}
                  onChange={(e) => handleInputChange("screenLockCode", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="issue">{t("problemSymptoms")}</Label>
                <Textarea
                  id="issue"
                  placeholder={t("enterProblemSymptoms")}
                  className="min-h-[100px] resize-y max-h-[200px]"
                  value={formData.problemSymptoms}
                  onChange={(e) => handleInputChange("problemSymptoms", e.target.value)}
                />
              </div>
              {/* รูปแบบการรับบริการ: รับหน้าร้าน = เลือกเฉพาะเวลา, ทิ้งเครื่องไว้ = เลือกวัน+เวลา */}
              {serviceType === "walk_in" && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="receive_time">{t("receiveTimeLabel")}</Label>
                  <Time30Select
                    id="receive_time"
                    value={receiveTime}
                    onChange={(v) => setReceiveTime(roundTimeTo30Min(v))}
                    className="max-w-[140px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "วันที่ใช้วันปัจจุบันอัตโนมัติ (รับซ่อมหน้าร้าน)" : "Date is set to today (walk-in)."}
                  </p>
                </div>
              )}
              {serviceType === "drop_off" && (
                <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
                  <div className="grid gap-2">
                    <Label>{t("pickupDateLabel")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {receiveDateAsDate
                            ? receiveDateAsDate.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : t("pickUpDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={receiveDateAsDate}
                          onSelect={(d) => {
                            if (d) setReceiveDate(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pickup_time">{t("pickupTimeLabel")}</Label>
                    <Time30Select
                      id="pickup_time"
                      value={receiveTime}
                      onChange={(v) => setReceiveTime(roundTimeTo30Min(v))}
                      className="w-full max-w-[140px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    {language === "th" ? "ห้ามเลือกวันย้อนหลัง" : "Past dates are not allowed."}
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="deposit">{t("deposit")}</Label>
                <Input
                  id="deposit"
                  type="number"
                  placeholder={t("enterDeposit")}
                  value={formData.deposit}
                  onChange={(e) => handleInputChange("deposit", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimatedPrice">{t("estimatedPriceBaht")}</Label>
                <Input
                  id="estimatedPrice"
                  type="number"
                  placeholder={t("enterEstimatedPrice")}
                  value={formData.estimatedPrice}
                  onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="repairSummaryPrice">{t("repairSummaryPrice")}</Label>
                <Input
                  id="repairSummaryPrice"
                  type="number"
                  placeholder={t("enterRepairSummaryPrice")}
                  value={formData.repairSummaryPrice}
                  onChange={(e) => handleInputChange("repairSummaryPrice", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 border-t border-border/60 bg-muted/20 py-5 px-6">
            <Button variant="outline" onClick={() => navigate("/repairs")}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreateOrder}>{t("createOrder")}</Button>
          </CardFooter>
        </Card>

        <AlertDialog open={duplicateSnWarning} onOpenChange={(open) => !open && setDuplicateSnWarning(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "th" ? "หมายเลข IMEI / SN ซ้ำ" : "Duplicate Serial Number"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "th"
                  ? "หมายเลขนี้มีในประวัติงานซ่อมแล้ว การสร้างซ้ำอาจส่งผลต่อการรับประกัน ต้องการดำเนินการต่อหรือไม่?"
                  : "This serial number already exists in repair history. Creating again may affect warranty. Continue anyway?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={doSubmitOrder}>
                {language === "th" ? "ดำเนินการต่อ" : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default RepairNew;
