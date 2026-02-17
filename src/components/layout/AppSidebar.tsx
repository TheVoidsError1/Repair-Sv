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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/** หน้าแรก = แดชบอร์ด (ไม่ใช้หน้าเลือกหมวดกับการ์ด) */
const SUBJECTS_PATH = "/";

interface AppSidebarProps {
language?: Language;
collapsed?: boolean;
setCollapsed?: (value: boolean) => void;
mobileOpen?: boolean;
setMobileOpen?: (value: boolean) => void;
}

/** เช็คว่า pathname + search ตรงกับเมนูย่อยนี้หรือไม่ */
function isMenuItemActive(
item: SidebarMenuItem,
pathname: string,
searchParams: URLSearchParams
): boolean {
const basePath = item.href.split("?")[0];
if (pathname !== basePath) return false;
if (!item.matchQuery || Object.keys(item.matchQuery).length === 0) {
  // เมนูแบบไม่มี query (เช่น "ทั้งหมด"): active เมื่อ path ตรงและไม่มี filter
  const hasNoFilter = !searchParams.get("status") && !searchParams.get("openCreate");
  return hasNoFilter;
}
for (const [key, value] of Object.entries(item.matchQuery)) {
  if (searchParams.get(key) !== value) return false;
}
return true;
}

/** โหมดที่ 1: Subjects — แสดงรายการหมวดหลัก (กรองตาม role) */
function SubjectsNav({
language,
collapsed,
setMobileOpen,
userRole,
}: {
language: Language;
collapsed: boolean;
setMobileOpen: (v: boolean) => void;
userRole: "owner" | "staff";
}) {
const location = useLocation();
const currentSubjectId = getSubjectIdFromPath(location.pathname);

return (
  <div className="space-y-1">
      {!collapsed && (
        <p className="px-2 lg:px-3 pt-1 pb-2 text-[10px] sm:text-xs font-medium text-sidebar-muted uppercase tracking-wider">
          {language === "th" ? "เลือกหมวด" : "Subjects"}
        </p>
      )}
    {SUBJECT_ORDER.filter((subjectId) => canAccessSubject(subjectId, userRole)).map((subjectId) => {
      const subject = SUBJECTS_CONFIG[subjectId];
      if (!subject) return null;
      const isActive = currentSubjectId === subjectId;
      const title = language === "th" ? subject.titleTh : subject.titleEn;
      return (
        <Link
          key={subject.id}
          to={subject.basePath}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "sidebar-link flex items-center gap-2 lg:gap-3 rounded-lg border-l-2 -ml-px",
            isActive ? "active border-sidebar-primary text-sidebar-primary" : "border-transparent"
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0",
              isActive ? "bg-sidebar-primary/20 text-sidebar-primary" : subject.iconBg
            )}
          >
            <subject.icon className="w-4 h-4" />
          </span>
          {!collapsed && (
            <span className="flex-1 min-w-0 text-left whitespace-nowrap overflow-hidden text-ellipsis text-sm sm:text-base">
              {title}
            </span>
          )}
        </Link>
      );
    })}
  </div>
);
}

/** โหมดที่ 2: Context Sidebar — เมนูย่อยของหมวดที่เลือก */
function ContextNav({
subject,
language,
collapsed,
pathname,
searchParams,
setMobileOpen,
}: {
subject: SidebarSubjectConfig;
language: Language;
collapsed: boolean;
pathname: string;
searchParams: URLSearchParams;
setMobileOpen: (v: boolean) => void;
}) {
const navigate = useNavigate();
const title = language === "th" ? subject.titleTh : subject.titleEn;

const handleBack = () => {
  setMobileOpen(false);
  // ไปหน้าแรก (dashboard) เสมอ
  navigate("/dashboard", { replace: true });
};

return (
  <div className="space-y-4">
    {/* ปุ่มกลับไปหมวดหลัก */}
    <button
      onClick={handleBack}
      className={cn(
        "sidebar-link flex items-center gap-2 lg:gap-3 rounded-lg text-sidebar-muted hover:text-sidebar-foreground w-full"
      )}
    >
      <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0">
        <ArrowLeft className="w-4 h-4" />
      </span>
      {!collapsed && (
        <span className="flex-1 min-w-0 text-left whitespace-nowrap overflow-hidden text-ellipsis text-sm sm:text-base">
          {language === "th" ? "กลับหมวดหลัก" : "Back to subjects"}
        </span>
      )}
    </button>

    {/* ชื่อหมวดปัจจุบัน — ไม่ใช้พื้นหลังแบบกดได้ */}
    {!collapsed && (
      <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5">
        <span className={cn("flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0", subject.iconBg)}>
          <subject.icon className="w-4 h-4" />
        </span>
        <span className="text-xs sm:text-sm font-medium text-sidebar-foreground truncate">{title}</span>
      </div>
    )}

    {/* Sections + รายการเมนูย่อย */}
    {subject.sections.map((section) => (
      <div key={section.id} className="space-y-1">
        {!collapsed && (
          <p className="px-2 lg:px-3 pt-1 pb-2 text-[10px] sm:text-xs font-medium text-sidebar-muted uppercase tracking-wider">
            {language === "th" ? section.labelTh : section.labelEn}
          </p>
        )}
        <div className="space-y-0.5">
          {section.items.map((item) => {
            const active = isMenuItemActive(item, pathname, searchParams);
            const label = language === "th" ? item.labelTh : item.labelEn;
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 lg:gap-3 py-2 px-2 lg:px-3 rounded-lg text-sm transition-colors -ml-px border-l-2",
                  "text-sidebar-foreground/90 hover:text-sidebar-foreground",
                  active
                    ? "border-sidebar-primary text-sidebar-primary font-medium"
                    : "border-transparent"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md flex-shrink-0",
                  active ? "text-sidebar-primary" : "text-sidebar-muted"
                )}>
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                {!collapsed && (
                  <span className="flex-1 min-w-0 truncate text-xs sm:text-sm">{label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);
}

export function AppSidebar({
language = "th",
collapsed: controlledCollapsed,
setCollapsed: controlledSetCollapsed,
mobileOpen: controlledMobileOpen,
setMobileOpen: controlledSetMobileOpen,
}: AppSidebarProps) {
const location = useLocation();
const [internalCollapsed, setInternalCollapsed] = useState(false);
const [internalMobileOpen, setInternalMobileOpen] = useState(false);

const collapsed = controlledCollapsed ?? internalCollapsed;
const setCollapsed = controlledSetCollapsed ?? setInternalCollapsed;
const mobileOpen = controlledMobileOpen ?? internalMobileOpen;
const setMobileOpen = controlledSetMobileOpen ?? setInternalMobileOpen;
const navigate = useNavigate();
const { logout, currentUser } = useAuth();
const { toast } = useToast();
const userRole = currentUser?.role ?? "staff";
const searchParams = new URLSearchParams(location.search);

const subjectsMode = isSubjectsMode(location.pathname);
const currentSubjectId = getSubjectIdFromPath(location.pathname);
const currentSubject = currentSubjectId ? SUBJECTS_CONFIG[currentSubjectId] : null;

// Set CSS variable for sidebar width
useEffect(() => {
  const root = document.documentElement;
  if (collapsed) {
    root.style.setProperty('--sidebar-width', '5rem');
  } else {
    // Check screen size and set appropriate width
    const isXl = window.matchMedia('(min-width: 1280px)').matches;
    root.style.setProperty('--sidebar-width', isXl ? '19rem' : '16rem');
    
    // Update on resize
    const handleResize = () => {
      if (!collapsed) {
        const isXlNow = window.matchMedia('(min-width: 1280px)').matches;
        root.style.setProperty('--sidebar-width', isXlNow ? '19rem' : '16rem');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }
}, [collapsed]);

const SidebarContent = () => (
  <>
    {/* Logo */}
    <div className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 lg:px-4 py-4 sm:py-5 lg:py-6 border-b border-sidebar-border">
      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sidebar-primary flex-shrink-0">
        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-sidebar-primary-foreground" />
      </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-sidebar-foreground truncate">Macfix service</span>
          <span className="text-[10px] sm:text-xs text-sidebar-muted truncate">
            {language === "th" ? "ระบบจัดการร้านซ่อม" : "Management"}
          </span>
        </div>
      )}
    </div>

    <nav className="sidebar-nav-scroll flex-1 min-h-0 overflow-y-auto px-2 sm:px-2 lg:px-3 py-3 sm:py-4">
      {subjectsMode ? (
        <SubjectsNav
          language={language}
          collapsed={collapsed}
          setMobileOpen={setMobileOpen}
          userRole={userRole}
        />
      ) : currentSubject && canAccessSubject(currentSubjectId!, userRole) ? (
        <ContextNav
          subject={currentSubject}
          language={language}
          collapsed={collapsed}
          pathname={location.pathname}
          searchParams={searchParams}
          setMobileOpen={setMobileOpen}
        />
      ) : (
        /* อยู่หน้าที่ไม่ใช่ /subjects และไม่ตรงหมวดใด หรือพนักงานเข้า path เฉพาะเจ้าของ — แสดง subjects เป็น fallback */
        <SubjectsNav
          language={language}
          collapsed={collapsed}
          setMobileOpen={setMobileOpen}
          userRole={userRole}
        />
      )}
    </nav>

    {/* Logout */}
    <div className="shrink-0 p-2 sm:p-2 lg:p-3 border-t border-sidebar-border">
      <button
        onClick={() => {
          setMobileOpen(false);
          toast({
            title: language === "th" ? "ออกจากระบบสำเร็จ" : "Logged out",
            description: language === "th" ? "คุณได้ออกจากระบบแล้ว" : "You have been logged out successfully.",
          });
          logout();
          navigate("/login");
        }}
        className="sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        {!collapsed && (
          <span className="truncate text-xs sm:text-sm">{language === "th" ? "ออกจากระบบ" : "Log out"}</span>
        )}
      </button>
    </div>
  </>
);

return (
  <>
    {mobileOpen && (
      <div
        className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
        onClick={() => setMobileOpen(false)}
      />
    )}

    <aside
      className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[19rem] min-w-[280px] sm:min-w-[19rem] max-w-[85vw] sm:max-w-[90vw] bg-sidebar flex flex-col transition-transform duration-300 ease-in-out shadow-xl",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <button
        onClick={() => setMobileOpen(false)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-primary/10 transition-colors"
        aria-label={language === "th" ? "ปิดเมนู" : "Close menu"}
      >
        <X className="w-5 h-5" />
      </button>
      <SidebarContent />
    </aside>

    <aside
      className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-10 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed 
          ? "w-20 min-w-[5rem]" 
          : "w-[19rem] min-w-[19rem] xl:w-[19rem] lg:w-[16rem]"
      )}
    >
      <SidebarContent />
    </aside>
  </>
);
}