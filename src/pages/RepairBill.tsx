/**
 * หน้ารายการออกบิล — เลือกงานซ่อมแล้วไปยัง ใบเสร็จรับเงิน (RepairReceipt)
 * แยกไฟล์ระหว่างใบแจ้งซ่อมกับใบเสร็จรับเงินเพื่อให้ตรวจเช็คและแก้ไขง่าย
 */
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs, type RepairItem } from "@/contexts/RepairsContext";
import { repairItemToBillData } from "@/types/repairOrder";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RepairBill = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { repairs } = useRepairs();

  const handleIssueReceipt = (item: RepairItem) => {
    const orderData = repairItemToBillData(item, language);
    navigate("/repairs/bill/receipt", { state: { ...orderData, repairId: item.id } });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("repairBill")}</h1>
            <p className="page-description">
              {language === "th"
                ? "เลือกงานซ่อมจากรายการด้านล่างเพื่อออกใบเสร็จรับเงิน"
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
                ? "กดปุ่มออกใบเสร็จที่แถวที่ต้องการ"
                : "Click Issue receipt on a row."}
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
                      <th className="text-right p-3 font-medium w-32">
                        {language === "th" ? "ใบเสร็จ" : "Receipt"}
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
                        <td className="p-3">
                          <div>{item.customer}</div>
                          {item.phone && (
                            <div className="text-muted-foreground text-xs mt-0.5">{item.phone}</div>
                          )}
                        </td>
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
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleIssueReceipt(item)}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            {language === "th" ? "ออกใบเสร็จ" : "Receipt"}
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
};

export default RepairBill;
