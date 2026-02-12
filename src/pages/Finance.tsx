import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    DollarSign,
    Download,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const revenueData = [
  { month: "Jan", monthTh: "ม.ค.", income: 125000, expenses: 45000 },
  { month: "Feb", monthTh: "ก.พ.", income: 132000, expenses: 48000 },
  { month: "Mar", monthTh: "มี.ค.", income: 141000, expenses: 52000 },
  { month: "Apr", monthTh: "เม.ย.", income: 128000, expenses: 46000 },
  { month: "May", monthTh: "พ.ค.", income: 156000, expenses: 55000 },
  { month: "Jun", monthTh: "มิ.ย.", income: 168000, expenses: 58000 },
];

const transactions = [
  {
    id: "TXN-001",
    type: "income",
    description: "Repair Payment - REP-001",
    descriptionTh: "ชำระค่าซ่อม - REP-001",
    amount: 4500,
    date: "2024-01-15",
    method: "Cash",
    methodTh: "เงินสด",
  },
  {
    id: "TXN-002",
    type: "income",
    description: "Repair Payment - REP-002",
    descriptionTh: "ชำระค่าซ่อม - REP-002",
    amount: 1200,
    date: "2024-01-15",
    method: "Credit Card",
    methodTh: "บัตรเครดิต",
  },
  {
    id: "TXN-003",
    type: "expense",
    description: "iPhone 14 Screens (5 units)",
    descriptionTh: "หน้าจอ iPhone 14 (5 ชิ้น)",
    amount: 17500,
    date: "2024-01-14",
    method: "Transfer",
    methodTh: "โอนเงิน",
  },
  {
    id: "TXN-004",
    type: "income",
    description: "Repair Payment - REP-003",
    descriptionTh: "ชำระค่าซ่อม - REP-003",
    amount: 3200,
    date: "2024-01-14",
    method: "Cash",
    methodTh: "เงินสด",
  },
  {
    id: "TXN-005",
    type: "expense",
    description: "Monthly Utilities",
    descriptionTh: "ค่าสาธารณูปโภครายเดือน",
    amount: 4500,
    date: "2024-01-14",
    method: "Transfer",
    methodTh: "โอนเงิน",
  },
];

const Finance = () => {
  const { t, language } = useLanguage();
  const [timeRange, setTimeRange] = useState("6m");

  const expenseBreakdown = [
    { name: t("partsCost"), value: 45, color: "hsl(217, 91%, 60%)" },
    { name: t("labor"), value: 25, color: "hsl(142, 71%, 45%)" },
    { name: t("utilities"), value: 15, color: "hsl(45, 93%, 47%)" },
    { name: t("other"), value: 15, color: "hsl(280, 65%, 60%)" },
  ];

  const chartData = revenueData.map(d => ({
    ...d,
    name: language === "th" ? d.monthTh : d.month
  }));

  const totalIncome = revenueData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = revenueData.reduce((sum, d) => sum + d.expenses, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("financeWarehouse")}</h1>
            <p className="page-description">{t("financeDescription")}</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">{t("daily")}</SelectItem>
                <SelectItem value="1w">{t("weekly")}</SelectItem>
                <SelectItem value="1m">{t("lastMonth")}</SelectItem>
                <SelectItem value="3m">{t("last3Months")}</SelectItem>
                <SelectItem value="6m">{t("last6Months")}</SelectItem>
                <SelectItem value="1y">{t("lastYear")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {t("export")}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("totalIncome")}</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{totalIncome.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-status-completed">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+12.5%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-status-completed/10">
              <ArrowUpRight className="w-5 h-5 text-status-completed" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("totalExpenses")}</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{totalExpenses.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-status-cancelled">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">+8.2%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-status-cancelled/10">
              <ArrowDownRight className="w-5 h-5 text-status-cancelled" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("netProfit")}</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{netProfit.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-status-completed">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+15.8%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("incomeVsExpenses")}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(215, 16%, 47%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215, 16%, 47%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `฿${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 32%, 91%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name={t("income")}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                  name={t("expenses")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("expenseBreakdown")}
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 32%, 91%)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {expenseBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-xl border border-border">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              {t("recentTransactions")}
            </h3>
            <TabsList>
              <TabsTrigger value="all">{t("all")}</TabsTrigger>
              <TabsTrigger value="income">{t("income")}</TabsTrigger>
              <TabsTrigger value="expense">{t("expenses")}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("transactionId")}</th>
                    <th>{t("description")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("date")}</th>
                    <th>{t("method")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="font-medium text-foreground">{txn.id}</td>
                      <td>{language === "th" ? txn.descriptionTh : txn.description}</td>
                      <td
                        className={
                          txn.type === "income"
                            ? "text-status-completed font-medium"
                            : "text-status-cancelled font-medium"
                        }
                      >
                        {txn.type === "income" ? "+" : "-"}฿{txn.amount.toLocaleString()}
                      </td>
                      <td>{txn.date}</td>
                      <td>{language === "th" ? txn.methodTh : txn.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="income" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("transactionId")}</th>
                    <th>{t("description")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("date")}</th>
                    <th>{t("method")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => t.type === "income")
                    .map((txn) => (
                      <tr key={txn.id}>
                        <td className="font-medium text-foreground">{txn.id}</td>
                        <td>{language === "th" ? txn.descriptionTh : txn.description}</td>
                        <td className="text-status-completed font-medium">
                          +฿{txn.amount.toLocaleString()}
                        </td>
                        <td>{txn.date}</td>
                        <td>{language === "th" ? txn.methodTh : txn.method}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="expense" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("transactionId")}</th>
                    <th>{t("description")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("date")}</th>
                    <th>{t("method")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => t.type === "expense")
                    .map((txn) => (
                      <tr key={txn.id}>
                        <td className="font-medium text-foreground">{txn.id}</td>
                        <td>{language === "th" ? txn.descriptionTh : txn.description}</td>
                        <td className="text-status-cancelled font-medium">
                          -฿{txn.amount.toLocaleString()}
                        </td>
                        <td>{txn.date}</td>
                        <td>{language === "th" ? txn.methodTh : txn.method}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Finance;
