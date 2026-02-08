import { MainLayout } from "@/components/layout/MainLayout";
import { SUBJECT_ORDER, SUBJECTS_CONFIG } from "@/config/sidebarConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const Subjects = () => {
  const { language } = useLanguage();
  const isTh = language === "th";

  return (
    <MainLayout>
      <div className="page-header mb-8">
        <h1 className="page-title">
          {isTh ? "เลือกหมวดหลัก" : "Choose subject"}
        </h1>
        <p className="page-description">
          {isTh
            ? "เลือกหมวดจากเมนูซ้าย หรือคลิกการ์ดด้านล่างเพื่อเข้าใช้งาน"
            : "Select a subject from the sidebar or click a card below."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBJECT_ORDER.map((id) => {
          const subject = SUBJECTS_CONFIG[id];
          if (!subject) return null;
          const title = isTh ? subject.titleTh : subject.titleEn;
          return (
            <Link
              key={subject.id}
              to={subject.basePath}
              className="stat-card flex items-center gap-4 p-5 hover:border-primary/40 transition-colors"
            >
              <span
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0",
                  subject.iconBg
                )}
              >
                <subject.icon className="w-6 h-6" />
              </span>
              <span className="font-medium text-foreground">{title}</span>
            </Link>
          );
        })}
      </div>
    </MainLayout>
  );
};

export default Subjects;
