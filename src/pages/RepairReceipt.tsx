/**
 * หน้าใบเสร็จรับเงิน (Receipt)
 * แสดง ReceiptContent และปุ่มพิมพ์ — แยกจากใบแจ้งซ่อมเพื่อให้ตรวจเช็ค/แก้ไขง่าย
 */
import { MainLayout } from "@/components/layout/MainLayout";
import { ReceiptContent } from "@/components/receipt/ReceiptContent";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import { mapRepairOrderToReceiptData } from "@/lib/receipt";
import type { RepairOrderData, ServiceType } from "@/types/repairOrder";
import {
    buildPickupIsoFromDateAndTime,
    getTodayIsoDate,
    roundTimeTo30Min,
} from "@/types/repairOrder";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function getDefaultReportDateTime(language: "th" | "en") {
  const now = new Date();
  return {
    dateOfReport: now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    timeOfReport: roundTimeTo30Min(
      `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    ),
  };
}

function getInitialReportDateTime() {
  const now = new Date();
  const raw = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return {
    dateOfReport: now.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    timeOfReport: roundTimeTo30Min(raw),
  };
}

const RepairReceipt = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const dataFromNav = location.state as (RepairOrderData & { repairId?: string }) | null | undefined;
  const [reportDate, setReportDate] = useState(() => getInitialReportDateTime().dateOfReport);
  const [reportTime, setReportTime] = useState(() => getInitialReportDateTime().timeOfReport);
  const [serviceType, setServiceType] = useState<ServiceType>("walk_in");
  const [receiveTime, setReceiveTime] = useState(() => getInitialReportDateTime().timeOfReport);
  const [receiveDate, setReceiveDate] = useState(() => getTodayIsoDate());
  const [selectedPart, setSelectedPart] = useState<{ partNumber?: string; name?: string; nameTh?: string; price?: number } | null>(null);
  const [selectedParts, setSelectedParts] = useState<Array<{ partNumber?: string; name?: string; nameTh?: string; price?: number }>>([]);

  // Load repair data from API if repairId is provided
  useEffect(() => {
    const loadRepairData = async () => {
      // ถ้ามี selectedParts ใน dataFromNav (จาก RepairBill ที่ส่งมา) ให้ใช้เลย
      if (dataFromNav && 'selectedParts' in dataFromNav && dataFromNav.selectedParts) {
        setSelectedParts(dataFromNav.selectedParts as any);
        return;
      }

      // ถ้ามี selectedPart ใน dataFromNav (backward compatibility) ให้ใช้เลย
      if (dataFromNav && 'selectedPart' in dataFromNav && dataFromNav.selectedPart) {
        setSelectedPart(dataFromNav.selectedPart as any);
        return;
      }

      // ถ้าไม่มี repairId แต่มี selectedPartId ใน dataFromNav ให้ดึง part จาก API
      if (!dataFromNav?.repairId && dataFromNav?.selectedPartId) {
        try {
          const partResponse = await apiClient.getPartById(dataFromNav.selectedPartId);
          if (partResponse.status === 'success' && partResponse.data) {
            const part = partResponse.data;
            setSelectedPart({
              partNumber: part.partNumber || undefined,
              name: part.name,
              nameTh: part.nameTh || part.name,
              price: part.price,
            });
          }
        } catch (error) {
          console.error('Error loading part data:', error);
        }
        return;
      }
      
      if (!dataFromNav?.repairId) return;
      
      try {
        // ดึงข้อมูล repairs ทั้งหมดและหา repair ที่ตรงกับ repairId (อาจเป็น repairNumber หรือ UUID)
        const response = await apiClient.getRepairs();
        if (response.status === 'success' && response.data) {
          // หา repair จาก repairNumber หรือ id
          const repair = response.data.find((r: any) => 
            r.repairNumber === dataFromNav.repairId || r.id === dataFromNav.repairId
          );
          if (repair) {
            // ถ้ามี selectedParts (array) ให้ใช้
            if (repair.selectedParts && Array.isArray(repair.selectedParts) && repair.selectedParts.length > 0) {
              setSelectedParts(repair.selectedParts.map((part: any) => ({
                partNumber: part.partNumber || undefined,
                name: part.name,
                nameTh: part.nameTh || part.name,
                price: part.price,
              })));
            } else if (repair.selectedPart) {
              // backward compatibility: ถ้ามี selectedPart เดียว
              setSelectedPart({
                partNumber: repair.selectedPart.partNumber || undefined,
                name: repair.selectedPart.name,
                nameTh: repair.selectedPart.nameTh || repair.selectedPart.name,
                price: repair.selectedPart.price,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading repair data:', error);
      }
    };

    loadRepairData();
  }, [dataFromNav?.repairId, dataFromNav?.selectedPartId, dataFromNav]);

  useEffect(() => {
    if (!dataFromNav) return;
    const defaultDt = getDefaultReportDateTime(language);
    let dateVal = dataFromNav.dateOfReport || defaultDt.dateOfReport;
    let timeVal = dataFromNav.timeOfReport ?? defaultDt.timeOfReport;
    if (dateVal.includes("T")) {
      try {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          dateVal = d.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          if (!dataFromNav.timeOfReport)
            timeVal = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        }
      } catch {
        //
      }
    }
    setReportDate(dateVal);
    setReportTime(timeVal);
    const st = dataFromNav.service_type ?? "walk_in";
    setServiceType(st);
    if (dataFromNav.receive_time) setReceiveTime(roundTimeTo30Min(dataFromNav.receive_time));
    else if (st === "walk_in") setReceiveTime(roundTimeTo30Min(timeVal));
    if (st === "drop_off" && dataFromNav.receive_date) {
      const rd = dataFromNav.receive_date;
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
  }, [
    dataFromNav?.dateOfReport,
    dataFromNav?.timeOfReport,
    dataFromNav?.service_type,
    dataFromNav?.receive_date,
    dataFromNav?.receive_time,
    language,
    !!dataFromNav,
  ]);

  const handlePrint = () => window.print();

  const effectiveData: RepairOrderData | null = (() => {
    if (!dataFromNav) return null;
    const todayIso = getTodayIsoDate();
    const todayLocale = new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (serviceType === "walk_in") {
      const pickupIso = buildPickupIsoFromDateAndTime(todayIso, receiveTime);
      return {
        ...dataFromNav,
        service_type: "walk_in",
        receive_date: todayIso,
        receive_time: receiveTime,
        dateOfReport: dataFromNav.dateOfReport || todayLocale,
        timeOfReport: dataFromNav.timeOfReport ?? receiveTime,
        scheduledPickupTime: pickupIso ?? dataFromNav.scheduledPickupTime,
      };
    }
    const pickupIso = buildPickupIsoFromDateAndTime(receiveDate, receiveTime);
    return {
      ...dataFromNav,
      service_type: "drop_off",
      receive_date: receiveDate,
      receive_time: receiveTime,
      dateOfReport: reportDate || dataFromNav.dateOfReport,
      timeOfReport: reportTime || dataFromNav.timeOfReport,
      scheduledPickupTime: pickupIso ?? dataFromNav.scheduledPickupTime,
    };
  })();

  const receiptData = effectiveData
    ? mapRepairOrderToReceiptData(effectiveData, {
        receiptNo: (dataFromNav as { repairId?: string })?.repairId ?? "—",
        issueDate: effectiveData.dateOfReport,
        copyLabel: t("receiptForCustomer"),
        selectedPart: selectedPart, // backward compatibility
        selectedParts: selectedParts.length > 0 ? selectedParts : undefined,
      })
    : null;

  if (!dataFromNav) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-muted-foreground text-center py-8">
            {language === "th" ? "กรุณาเลือกงานซ่อมจากรายการออกบิล" : "Please select a repair from the bill list."}
          </p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/repairs/bill")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {language === "th" ? "กลับไปรายการออกบิล" : "Back to bill list"}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto repair-receipt-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
          <Button variant="outline" onClick={() => navigate("/repairs/bill")} className="gap-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            {language === "th" ? "กลับรายการ" : "Back to list"}
          </Button>
          <Button onClick={handlePrint} className="gap-2 w-fit">
            <Printer className="w-4 h-4" />
            {t("printBill")}
          </Button>
        </div>

        <div className="receipt-print-wrapper hidden print:block">
          {receiptData && <ReceiptContent data={receiptData} />}
        </div>

        <div className="print:hidden flex flex-col w-full max-w-[210mm] mx-auto">
          {receiptData && <ReceiptContent data={receiptData} />}
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

export default RepairReceipt;
