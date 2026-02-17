import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Store, Package, List, FileText, ClipboardList, UserSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const RepairMenu = () => {
  const { language } = useLanguage();
  const isTh = language === "th";

  const menuItems = [
    {
      id: "add-in-store",
      titleTh: "รับซ่อมหน้าร้าน",
      titleEn: "Walk-in Repair",
      descriptionTh: "รับซ่อมเครื่องที่ลูกค้านำมาซ่อมหน้าร้าน",
      descriptionEn: "Receive repair for devices brought to the store",
      icon: Store,
      path: "/repairs/new?type=in-store",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      id: "add-leave-device",
      titleTh: "รับซ่อมฝากเครื่อง",
      titleEn: "Drop-off Repair",
      descriptionTh: "รับซ่อมเครื่องที่ลูกค้าฝากไว้",
      descriptionEn: "Receive repair for devices left by customers",
      icon: Package,
      path: "/repairs/new?type=leave-device",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      id: "status",
      titleTh: "สถานะงานซ่อม",
      titleEn: "Repair Status",
      descriptionTh: "ดูและจัดการสถานะงานซ่อมทั้งหมด",
      descriptionEn: "View and manage all repair statuses",
      icon: List,
      path: "/repairs",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      id: "bill",
      titleTh: "ออกบิล",
      titleEn: "Issue Bill",
      descriptionTh: "ออกบิลสำหรับงานซ่อม",
      descriptionEn: "Issue bill for repairs",
      icon: FileText,
      path: "/repairs/bill",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      id: "bill-management",
      titleTh: "จัดการใบแจ้งซ่อม",
      titleEn: "Manage Repair Bills",
      descriptionTh: "จัดการ แก้ไข และลบใบแจ้งซ่อม",
      descriptionEn: "Manage, edit, and delete repair bills",
      icon: ClipboardList,
      path: "/repairs/bill/management",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
    },
    {
      id: "customer-bills",
      titleTh: "ดูใบแจ้งซ่อมของลูกค้า",
      titleEn: "Customer Bills",
      descriptionTh: "ดูและค้นหาใบแจ้งซ่อมของลูกค้า",
      descriptionEn: "View and search customer bills",
      icon: UserSearch,
      path: "/repairs/bill/customer",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-500",
    },
  ];

  return (
    <MainLayout>
      <div className="page-header mb-8">
        <h1 className="page-title">
          {isTh ? "งานซ่อม" : "Repairs"}
        </h1>
        <p className="page-description">
          {isTh
            ? "จัดการงานซ่อมและบิล"
            : "Manage repairs and bills"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              className="stat-card flex flex-col gap-4 p-6 hover:border-primary/40 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0",
                    item.iconBg
                  )}
                >
                  <Icon className={cn("w-7 h-7", item.iconColor)} />
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {isTh ? item.titleTh : item.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isTh ? item.descriptionTh : item.descriptionEn}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </MainLayout>
  );
};

export default RepairMenu;
