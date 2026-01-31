import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar
        language={language}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="flex-1 min-h-0 overflow-auto flex flex-col">
        {/* Header - ย่อ และ ออกจากระบบ */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex"
              title={language === "th" ? "ย่อเมนู" : "Collapse menu"}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/login")}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {language === "th" ? "ออกจากระบบ" : "Log out"}
          </Button>
        </header>
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
