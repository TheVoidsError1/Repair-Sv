import {
    getSubjectIdFromPath,
    isSubjectsMode,
    SUBJECT_ORDER,
    SUBJECTS_CONFIG,
    type SidebarMenuItem,
    type SidebarSubjectConfig,
} from "@/config/sidebarConfig";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessSubject } from "@/lib/roleConfig";
import { Language } from "@/lib/translations";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  Package,
  ShieldCheck,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

/** หน้าแรก = แดชบอร์ด (ไม่ใช้หน้าเลือกหมวดกับการ์ด) */
const SUBJECTS_PATH = "/";

interface AppSidebarProps {
  language?: Language;
}

export function AppSidebar({ language = "th" }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const subjectsMode = isSubjectsMode(location.pathname);
  const currentSubjectId = getSubjectIdFromPath(location.pathname);
  const currentSubject = currentSubjectId ? SUBJECTS_CONFIG[currentSubjectId] : null;

  // Navigation items for main sidebar
  const navItems = SUBJECT_ORDER.map((subjectId) => {
    const subject = SUBJECTS_CONFIG[subjectId];
    return {
      href: subject.basePath,
      icon: subject.icon,
      title: subject.titleEn,
      titleTh: subject.titleTh,
    };
  });

  // Check if a route is active
  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary">
          <Smartphone className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              RepairPro
            </span>
            <span className="text-xs text-sidebar-muted">
              {language === "th" ? "ระบบจัดการ" : "Management"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "sidebar-link",
              isActive(item.href) && "active"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="truncate">
                {language === "th" ? item.titleTh : item.title}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Collapse Toggle - Desktop Only */}
      <div className="hidden lg:block p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>{language === "th" ? "ย่อ" : "Collapse"}</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-md"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[19rem] min-w-[19rem] max-w-[90vw] bg-sidebar flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-sidebar-foreground hover:text-sidebar-primary"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
