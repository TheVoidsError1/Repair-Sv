import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs } from "@/contexts/RepairsContext";
import { ArrowRight, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
  "picked-up": "status-completed",
};

export function RecentRepairs() {
  const { t, language } = useLanguage();
  const { repairs, isLoading } = useRepairs();

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    "in-progress": t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
    "picked-up": t("pickedUp"),
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 border-b border-border">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t("recentRepairs")}</h3>
        <Link to="/repairs">
          <Button variant="ghost" size="sm" className="gap-1 w-full sm:w-auto">
            {t("viewAll")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12 px-4">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm sm:text-base text-muted-foreground">{t("loading") || "กำลังโหลด..."}</span>
        </div>
      ) : recentRepairs.length === 0 ? (
        <div className="flex items-center justify-center py-8 sm:py-12 px-4">
          <p className="text-sm sm:text-base text-muted-foreground">{t("noData") || "ไม่มีข้อมูล"}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {recentRepairs.map((repair) => (
              <div key={repair.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{repair.id}</p>
                    <p className="text-sm font-medium text-foreground mt-1">{repair.customer}</p>
                  </div>
                  <span className={`status-badge shrink-0 ${statusStyles[repair.status] || "status-pending"}`}>
                    {statusLabels[repair.status] || repair.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground min-w-[60px]">{t("device")}:</span>
                    <span className="text-foreground">{repair.device}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground min-w-[60px]">{t("issue")}:</span>
                    <span className="text-foreground line-clamp-2">{language === "th" ? repair.issueTh : repair.issue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
