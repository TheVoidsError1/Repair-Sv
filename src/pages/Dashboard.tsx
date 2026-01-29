import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRepairs } from "@/components/dashboard/RecentRepairs";
import { StockAlerts } from "@/components/dashboard/StockAlerts";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Wrench, Package, DollarSign, Users } from "lucide-react";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Welcome back! Here's what's happening with your repair shop today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Repairs"
          value={24}
          change={12}
          changeLabel="vs last week"
          icon={<Wrench className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Parts in Stock"
          value={156}
          change={-5}
          changeLabel="vs last month"
          icon={<Package className="w-5 h-5 text-status-pending" />}
          iconBg="bg-status-pending/10"
        />
        <StatCard
          title="Today's Revenue"
          value="฿12,450"
          change={8}
          changeLabel="vs yesterday"
          icon={<DollarSign className="w-5 h-5 text-status-completed" />}
          iconBg="bg-status-completed/10"
        />
        <StatCard
          title="Customers"
          value={342}
          change={15}
          changeLabel="new this month"
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
