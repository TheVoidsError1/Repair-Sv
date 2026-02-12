import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar language={language} />
      <main className="flex-1 overflow-auto transition-all duration-300 main-content-with-sidebar">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
