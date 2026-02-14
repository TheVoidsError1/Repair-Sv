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
import { useState, useEffect } from "react";
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
import { apiClient } from "@/lib/api";

const Finance = () => {
  const { t, language } = useLanguage();
  const [timeRange, setTimeRange] = useState("6m");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Financial summary state
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalPartsCost: 0,
    totalPartsSalePrice: 0,
    partsMarkup: 0,
    partsMarkupPercentage: 0,
    totalLaborCost: 0,
    incomeChange: 0,
    expensesChange: 0,
    profitChange: 0,
    profitMargin: 0,
    totalStockValue: 0,
    totalStockQuantity: 0,
    averageProfitPerRepair: 0,
    totalRepairs: 0,
  });

  // Chart data state
  const [chartData, setChartData] = useState<Array<{
    month: string;
    monthTh: string;
    income: number;
    expenses: number;
    name: string;
  }>>([]);

  // Expense breakdown state
  const [expenseBreakdown, setExpenseBreakdown] = useState<Array<{
    name: string;
    nameTh: string;
    value: number;
    amount: number;
    color: string;
  }>>([]);

  // Transactions state
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    type: "income" | "expense";
    description: string;
    descriptionTh: string;
    amount: number;
    date: string;
    method: string;
    methodTh: string;
  }>>([]);

  const [transactionTab, setTransactionTab] = useState("all");

  // Fetch financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel (always fetch all transactions, filter on frontend)
        const [summaryRes, chartRes, breakdownRes, transactionsRes] = await Promise.all([
          apiClient.getFinancialSummary(timeRange),
          apiClient.getIncomeExpensesChart(timeRange),
          apiClient.getExpenseBreakdown(timeRange),
          apiClient.getTransactions(timeRange, 'all', 100), // Fetch all, filter on frontend
        ]);

        if (summaryRes.status === "success" && summaryRes.data) {
          setSummary(summaryRes.data);
        }

        if (chartRes.status === "success" && chartRes.data) {
          const formattedChartData = chartRes.data.map((d) => ({
            ...d,
            name: language === "th" ? d.monthTh : d.month,
          }));
          setChartData(formattedChartData);
        }

        if (breakdownRes.status === "success" && breakdownRes.data) {
          // Map expense breakdown with colors
          const colors = [
            "hsl(217, 91%, 60%)", // Blue for parts
            "hsl(142, 71%, 45%)", // Green for labor
            "hsl(45, 93%, 47%)",  // Yellow for utilities
            "hsl(280, 65%, 60%)", // Purple for other
          ];
          const formattedBreakdown = breakdownRes.data.map((item, index) => ({
            ...item,
            name: language === "th" ? item.nameTh : (t(item.name as any) || item.name),
            color: colors[index % colors.length],
          }));
          setExpenseBreakdown(formattedBreakdown);
        }

        if (transactionsRes.status === "success" && transactionsRes.data) {
          setTransactions(transactionsRes.data);
        }
      } catch (err) {
        console.error("Error fetching financial data:", err);
        setError(err instanceof Error ? err.message : "Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [timeRange, language, t]);

  // Filter transactions based on selected tab
  const filteredTransactions = transactionTab === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === transactionTab);

  // Create financial breakdown data for pie chart (based on total expenses to ensure percentages don't exceed 100%)
  // Calculate percentages relative to total expenses to ensure they sum to 100% or less
  const financialBreakdown = summary.totalExpenses > 0 ? [
    {
      name: language === "th" ? "ต้นทุนอะไหล่" : "Cost of Parts",
      nameTh: "ต้นทุนอะไหล่",
      value: Math.min((summary.totalPartsCost / summary.totalExpenses) * 100, 100),
      amount: summary.totalPartsCost,
      color: "hsl(217, 91%, 60%)", // Blue
    },
    {
      name: language === "th" ? "ค่าใช้จ่ายรวม" : "Total Expenses",
      nameTh: "ค่าใช้จ่ายรวม",
      value: 100.0,
      amount: summary.totalExpenses,
      color: "hsl(0, 84%, 60%)", // Red
    },
    {
      name: language === "th" ? "กำไรจากอะไหล่" : "Profit from Parts",
      nameTh: "กำไรจากอะไหล่",
      value: summary.totalExpenses > 0
        ? Math.min((summary.partsMarkup / summary.totalExpenses) * 100, 100)
        : 0,
      amount: summary.partsMarkup,
      color: "hsl(142, 71%, 45%)", // Green
    },
    {
      name: language === "th" ? "กำไรเฉลี่ยต่องาน" : "Avg Profit per Job",
      nameTh: "กำไรเฉลี่ยต่องาน",
      value: summary.totalExpenses > 0
        ? Math.min((summary.averageProfitPerRepair / summary.totalExpenses) * 100, 100)
        : 0,
      amount: summary.averageProfitPerRepair,
      color: "hsl(45, 93%, 47%)", // Yellow/Orange
    },
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-status-cancelled mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("totalIncome")}</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className={`flex items-center gap-1 mt-2 ${summary.incomeChange >= 0 ? "text-status-completed" : "text-status-cancelled"}`}>
                {summary.incomeChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {summary.incomeChange >= 0 ? "+" : ""}{summary.incomeChange.toFixed(1)}%
                </span>
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
                ฿{summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className={`flex items-center gap-1 mt-2 ${summary.expensesChange >= 0 ? "text-status-cancelled" : "text-status-completed"}`}>
                {summary.expensesChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {summary.expensesChange >= 0 ? "+" : ""}{summary.expensesChange.toFixed(1)}%
                </span>
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
                ฿{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className={`flex items-center gap-1 mt-2 ${summary.profitChange >= 0 ? "text-status-completed" : "text-status-cancelled"}`}>
                {summary.profitChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {summary.profitChange >= 0 ? "+" : ""}{summary.profitChange.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">อัตรากำไร</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                {summary.profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                จากรายได้ทั้งหมด
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">มูลค่าสต็อก</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{summary.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalStockQuantity.toLocaleString()} ชิ้น
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">กำไรเฉลี่ยต่องาน</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{summary.averageProfitPerRepair.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalRepairs} งาน
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">กำไรจากอะไหล่</p>
              <p className="text-2xl font-semibold mt-1 text-foreground">
                ฿{summary.partsMarkup.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.partsMarkupPercentage.toFixed(1)}% จากต้นทุน
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10">
              <ArrowUpRight className="w-5 h-5 text-purple-500" />
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
            {chartData.length > 0 ? (
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
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `฿${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `฿${(value / 1000).toFixed(1)}k`;
                    } else {
                      return `฿${value.toFixed(0)}`;
                    }
                  }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 32%, 91%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    const formattedValue = typeof value === 'number' 
                      ? `฿${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : value;
                    return [formattedValue, name === 'income' ? t("income") : t("expenses")];
                  }}
                  labelFormatter={(label) => label}
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("expenseBreakdown")}
          </h3>
          <div className="h-[200px]">
            {financialBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {financialBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, entry: any) => {
                      const percentage = typeof value === 'number' ? value.toFixed(1) : value;
                      const amount = entry?.payload?.amount || 0;
                      const label = entry?.payload?.name || name;
                      return [
                        `${percentage}% (฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                        label
                      ];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
          <div className="space-y-2 mt-4">
            {/* Expense Breakdown Items */}
            {expenseBreakdown
              .filter(item => item.nameTh !== "ต้นทุนอะไหล่" && item.name !== "Cost of Parts")
              .map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{item.value.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">
                      ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Additional Financial Metrics */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            {financialBreakdown.map((item, index) => (
              <div 
                key={item.name} 
                className={`flex items-center justify-between ${index > 0 ? 'pt-2 border-t border-border/50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={`text-sm ${index === 0 ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-xl border border-border">
        <Tabs value={transactionTab} onValueChange={setTransactionTab} className="w-full">
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
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn) => (
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
                          {txn.type === "income" ? "+" : "-"}฿{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>{txn.date}</td>
                        <td>{language === "th" ? txn.methodTh : txn.method}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </td>
                    </tr>
                  )}
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
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn) => (
                        <tr key={txn.id}>
                          <td className="font-medium text-foreground">{txn.id}</td>
                          <td>{language === "th" ? txn.descriptionTh : txn.description}</td>
                          <td className="text-status-completed font-medium">
                            +฿{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>{txn.date}</td>
                          <td>{language === "th" ? txn.methodTh : txn.method}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </td>
                    </tr>
                  )}
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
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn) => (
                        <tr key={txn.id}>
                          <td className="font-medium text-foreground">{txn.id}</td>
                          <td>{language === "th" ? txn.descriptionTh : txn.description}</td>
                          <td className="text-status-cancelled font-medium">
                            -฿{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>{txn.date}</td>
                          <td>{language === "th" ? txn.methodTh : txn.method}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </td>
                    </tr>
                  )}
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

