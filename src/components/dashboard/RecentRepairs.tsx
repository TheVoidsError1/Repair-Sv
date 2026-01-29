import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const repairs = [
  {
    id: "REP-001",
    customer: "John Doe",
    device: "iPhone 14 Pro",
    issue: "Screen Replacement",
    issueTh: "เปลี่ยนหน้าจอ",
    status: "in-progress",
    date: "2024-01-15",
  },
  {
    id: "REP-002",
    customer: "Jane Smith",
    device: "Samsung Galaxy S23",
    issue: "Battery Replacement",
    issueTh: "เปลี่ยนแบตเตอรี่",
    status: "pending",
    date: "2024-01-15",
  },
  {
    id: "REP-003",
    customer: "Mike Johnson",
    device: "Google Pixel 7",
    issue: "Water Damage",
    issueTh: "เสียหายจากน้ำ",
    status: "completed",
    date: "2024-01-14",
  },
  {
    id: "REP-004",
    customer: "Sarah Williams",
    device: "iPhone 13",
    issue: "Back Glass Repair",
    issueTh: "ซ่อมกระจกหลัง",
    status: "completed",
    date: "2024-01-14",
  },
  {
    id: "REP-005",
    customer: "David Brown",
    device: "OnePlus 11",
    issue: "Charging Port",
    issueTh: "พอร์ตชาร์จ",
    status: "cancelled",
    date: "2024-01-13",
  },
];

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
};

export function RecentRepairs() {
  const { t, language } = useLanguage();

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    "in-progress": t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  };

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
            {repairs.map((repair) => (
              <tr key={repair.id}>
                <td className="font-medium text-foreground">{repair.id}</td>
                <td>{repair.customer}</td>
                <td>{repair.device}</td>
                <td>{language === "th" ? repair.issueTh : repair.issue}</td>
                <td>
                  <span className={`status-badge ${statusStyles[repair.status]}`}>
                    {statusLabels[repair.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
