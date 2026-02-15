import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Home, UserCog, UserPlus, Wrench, Users, MessageSquare, Network, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SystemManagement = () => {
  const { language } = useLanguage();
  const isTh = language === "th";

  const menuItems = [
    {
      id: "home",
      titleTh: "เริ่มต้น",
      titleEn: "Home",
      descriptionTh: "กลับไปหน้าแดชบอร์ดหลัก",
      descriptionEn: "Go back to main dashboard",
      icon: Home,
      path: "/dashboard",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      id: "account",
      titleTh: "จัดการบัญชี",
      titleEn: "Account Management",
      descriptionTh: "จัดการข้อมูลบัญชีผู้ใช้",
      descriptionEn: "Manage user account information",
      icon: UserCog,
      path: "/system/account",
      iconBg: "bg-status-pending/10",
      iconColor: "text-status-pending",
    },
    {
      id: "register",
      titleTh: "สมัครสมาชิก",
      titleEn: "Register",
      descriptionTh: "สมัครสมาชิกใหม่",
      descriptionEn: "Register new account",
      icon: UserPlus,
      path: "/system/register",
      iconBg: "bg-status-completed/10",
      iconColor: "text-status-completed",
    },
    {
      id: "repair-items",
      titleTh: "จัดการรายการซ่อม",
      titleEn: "Repair Items Management",
      descriptionTh: "จัดการ แก้ไข และลบรายการซ่อม",
      descriptionEn: "Manage, edit, and delete repair items",
      icon: Wrench,
      path: "/system/repair-items",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      id: "users",
      titleTh: "จัดการผู้ใช้",
      titleEn: "User Management",
      descriptionTh: "จัดการข้อมูลผู้ใช้ในระบบ",
      descriptionEn: "Manage user information in the system",
      icon: Users,
      path: "/admin/users",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      id: "line",
      titleTh: "จัดการLINE",
      titleEn: "LINE Management",
      descriptionTh: "จัดการ LINE Official Account",
      descriptionEn: "Manage LINE Official Account",
      icon: MessageSquare,
      path: "/system/line",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      id: "network",
      titleTh: "Network",
      titleEn: "Network",
      descriptionTh: "จัดการ Network และ ngrok",
      descriptionEn: "Manage Network and ngrok",
      icon: Network,
      path: "/system/network",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      id: "customers",
      titleTh: "ดูข้อมูลลูกค้า",
      titleEn: "Customer Management",
      descriptionTh: "ดูและค้นหาข้อมูลลูกค้าทั้งหมด",
      descriptionEn: "View and search all customer information",
      icon: UserCircle,
      path: "/system/customers",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
    },
  ];

  return (
    <MainLayout>
      <div className="page-header mb-8">
        <h1 className="page-title">
          {isTh ? "จัดการระบบ" : "System Management"}
        </h1>
        <p className="page-description">
          {isTh
            ? "จัดการระบบและบัญชีผู้ใช้"
            : "Manage system and user accounts"}
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

export default SystemManagement;
