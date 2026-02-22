import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ArrowRight, MessageSquare, UserCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";

const SystemManagement = () => {
  const { language } = useLanguage();
  const isTh = language === "th";

  const menuItems = [
    {
      id: "users",
      titleTh: "จัดการผู้ใช้",
      titleEn: "User Management",
      descriptionTh: "จัดการข้อมูลผู้ใช้ในระบบ",
      descriptionEn: "Manage user information in the system",
      icon: Users,
      path: "/admin/users",
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      cardBorder: "hover:border-violet-400/50",
      cardShadow: "hover:shadow-[0_12px_40px_-8px_rgba(139,92,246,0.25)]",
      accent: "bg-violet-500",
    },
    {
      id: "line",
      titleTh: "จัดการLINE",
      titleEn: "LINE Management",
      descriptionTh: "จัดการ LINE Official Account",
      descriptionEn: "Manage LINE Official Account",
      icon: MessageSquare,
      path: "/system/line",
      gradient: "from-emerald-500 to-green-600",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      cardBorder: "hover:border-emerald-400/50",
      cardShadow: "hover:shadow-[0_12px_40px_-8px_rgba(16,185,129,0.25)]",
      accent: "bg-emerald-500",
    },
    {
      id: "customers",
      titleTh: "ดูข้อมูลลูกค้า",
      titleEn: "Customer Management",
      descriptionTh: "ดูและค้นหาข้อมูลลูกค้าทั้งหมด",
      descriptionEn: "View and search all customer information",
      icon: UserCircle,
      path: "/system/customers",
      gradient: "from-cyan-500 to-teal-600",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      cardBorder: "hover:border-cyan-400/50",
      cardShadow: "hover:shadow-[0_12px_40px_-8px_rgba(6,182,212,0.25)]",
      accent: "bg-cyan-500",
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
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border-2 border-border/60 bg-card p-6",
                "transition-all duration-300 ease-out hover:scale-[1.02] hover:border-opacity-100",
                "hover:shadow-xl",
                item.cardBorder,
                item.cardShadow
              )}
            >
              {/* Gradient strip at top */}
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                  item.gradient
                )}
              />
              <div className="flex items-start justify-between gap-4">
                <span
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                    "bg-gradient-to-br",
                    item.gradient
                  )}
                >
                  <Icon className={cn("w-7 h-7", item.iconColor)} />
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0",
                    item.accent,
                    item.iconColor
                  )}
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                <h3 className="font-bold text-lg tracking-tight text-foreground">
                  {isTh ? item.titleTh : item.titleEn}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
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
