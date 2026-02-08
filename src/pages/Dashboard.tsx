import { RecentRepairs } from "@/components/dashboard/RecentRepairs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { StockAlerts } from "@/components/dashboard/StockAlerts";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, Package, Users, Wrench } from "lucide-react";

const Dashboard = () => {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("dashboard")}</h1>
            <p className="page-description">{t("dashboardWelcome")}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t("activeRepairs")}
          value={24}
          change={12}
          changeLabel={t("vsLastWeek")}
          icon={<Wrench className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          title={t("partsInStock")}
          value={156}
          change={-5}
          changeLabel={t("vsLastMonth")}
          icon={<Package className="w-5 h-5 text-status-pending" />}
          iconBg="bg-status-pending/10"
        />
        <StatCard
          title={t("todaysRevenue")}
          value="฿12,450"
          change={8}
          changeLabel={t("vsYesterday")}
          icon={<DollarSign className="w-5 h-5 text-status-completed" />}
          iconBg="bg-status-completed/10"
        />
        <StatCard
          title={t("customers")}
          value={342}
          change={15}
          changeLabel={t("newThisMonth")}
          icon={<Users className="w-5 h-5 text-chart-4" />}
          iconBg="bg-chart-4/10"
        />
      </div>

      {/* Charts and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <StockAlerts />
        </div>
      </div>

      {/* Recent Repairs */}
      <RecentRepairs />
    </MainLayout>
  );
};

export default Dashboard;
