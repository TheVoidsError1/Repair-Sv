import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs, type RepairItem } from "@/contexts/RepairsContext";
import { ArrowLeft, FileText, Plus, Printer } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
}

interface BillContentProps {
  data: RepairOrderData;
  formatPrice: (value: string) => string;
  copyLabel: string;
  t: (key: string) => string;
  footerText: string;
}

/** แมปงานซ่อมจากรายการ → ข้อมูลสำหรับใบรับซ่อม */
function repairItemToBillData(item: RepairItem, language: "th" | "en"): RepairOrderData {
  const problemText = language === "th" ? item.issueTh : item.issue;
  const cost = String(item.estimatedCost);
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
  };
}

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
          {data.timeOfReport && (
            <div className="flex items-center gap-2">
              <span>เวลาแจ้งซ่อม</span>
              <div className="border-b border-gray-500 min-w-[70px] text-[11px] text-right">
                {data.timeOfReport}
              </div>
            </div>
          )}
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

      {data.scheduledPickupTime && (
        <div className="flex gap-4 items-center">
          <span className="text-xs">นัดรับเครื่อง</span>
          <div className="flex-1 border-b border-gray-400 min-h-[18px] text-[11px] px-1">
            {(() => {
              try {
                const d = new Date(data.scheduledPickupTime);
                return isNaN(d.getTime()) ? data.scheduledPickupTime : d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
              } catch {
                return data.scheduledPickupTime;
              }
            })()}
          </div>
        </div>
      )}

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

const RepairBill = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { repairs } = useRepairs();
  const dataFromNav = location.state as RepairOrderData | null | undefined;
  const [selectedBillData, setSelectedBillData] = useState<RepairOrderData | null>(null);

  const displayData = dataFromNav ?? selectedBillData;

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "-" : `฿${num.toLocaleString()}`;
  };

  const footerText = language === "th" ? "" : "";

  const handleCreateNewBill = () => {
    navigate("/repairs/new");
  };

  const handleSelectRepair = (item: RepairItem) => {
    setSelectedBillData(repairItemToBillData(item, language));
  };

  const handleBackToList = () => {
    setSelectedBillData(null);
  };

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
                  ? "เลือกงานซ่อมจากรายการด้านล่างเพื่อออกใบรับซ่อม หรือสร้างใบรับซ่อมใหม่"
                  : "Select a repair to issue a receipt, or create a new one."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/repairs")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t("backToRepairs")}
              </Button>
              <Button onClick={handleCreateNewBill} className="gap-2">
                <Plus className="w-4 h-4" />
                {language === "th" ? "สร้างใบรับซ่อมใหม่" : "New receipt"}
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

        <div className="repair-bill-print-wrapper hidden print:flex print:flex-row">
          <BillContent
            data={displayData}
            formatPrice={formatPrice}
            copyLabel={t("customerCopy")}
            t={t}
            footerText={footerText}
          />
          <BillContent
            data={displayData}
            formatPrice={formatPrice}
            copyLabel={t("shopCopy")}
            t={t}
            footerText={footerText}
          />
        </div>

        <div className="print:hidden flex flex-row gap-4 w-full">
          <div className="flex-1 min-w-0">
            <BillContent
              data={displayData}
              formatPrice={formatPrice}
              copyLabel={t("customerCopy")}
              t={t}
              footerText={footerText}
            />
          </div>
          <div className="flex-1 min-w-0">
            <BillContent
              data={displayData}
              formatPrice={formatPrice}
              copyLabel={t("shopCopy")}
              t={t}
              footerText={footerText}
            />
          </div>
        </div>
        <p className="print:hidden text-center text-sm text-muted-foreground mt-4">
          {language === "th"
            ? "เมื่อพิมพ์จะได้ 2 ชุด (สำเนาลูกค้า ซ้าย | สำเนาร้าน ขวา) ต่อ 1 แผ่น A4 แนวนอน"
            : "Printing: 2 copies (Customer left | Shop right) per A4 landscape page"}
        </p>
      </div>
    </MainLayout>
  );
};

export default RepairBill;
