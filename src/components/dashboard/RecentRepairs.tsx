import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs } from "@/contexts/RepairsContext";
import { useMemo } from "react";

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
};

export function RecentRepairs() {
  const { t, language } = useLanguage();
  const { repairs, isLoading } = useRepairs();

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    "in-progress": t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  };

  // เรียงลำดับตามวันที่สร้าง (ล่าสุดก่อน) และจำกัด 5 รายการ
  const recentRepairs = useMemo(() => {
    return [...repairs]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // เรียงจากใหม่ไปเก่า
      })
      .slice(0, 5); // แสดง 5 รายการล่าสุด
  }, [repairs]);

  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">{t("recentRepairs")}</h3>
        <Link to="/repairs">
          <Button variant="ghost" size="sm" className="gap-1">
            {t("viewAll")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{t("loading") || "กำลังโหลด..."}</span>
          </div>
        ) : recentRepairs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t("noData") || "ไม่มีข้อมูล"}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("orderId")}</th>
                <th>{t("customer")}</th>
                <th>{t("device")}</th>
                <th>{t("issue")}</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {recentRepairs.map((repair) => (
                <tr key={repair.id}>
                  <td className="font-medium text-foreground">{repair.id}</td>
                  <td>{repair.customer}</td>
                  <td>{repair.device}</td>
                  <td>{language === "th" ? repair.issueTh : repair.issue}</td>
                  <td>
                    <span className={`status-badge ${statusStyles[repair.status] || "status-pending"}`}>
                      {statusLabels[repair.status] || repair.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
