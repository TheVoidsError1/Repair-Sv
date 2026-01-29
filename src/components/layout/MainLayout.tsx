import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface MainLayoutProps {
  children: ReactNode;
  language?: "en" | "th";
}

export function MainLayout({ children, language = "en" }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar language={language} />
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
