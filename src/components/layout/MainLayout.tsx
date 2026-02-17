import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ReactNode, useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar language={language} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      {/* Mobile Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-30 bg-background/90 backdrop-blur-sm border border-border shadow-md h-10 w-10"
        onClick={() => setMobileOpen(true)}
        aria-label={language === "th" ? "เปิดเมนู" : "Open menu"}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <main className="flex-1 overflow-auto transition-all duration-300 main-content-with-sidebar">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-16 sm:pt-16 md:pt-6 lg:pt-8 max-w-[1920px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
