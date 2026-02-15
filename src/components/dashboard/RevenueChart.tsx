import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import { useEffect, useState } from "react";

export function RevenueChart() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<Array<{ name: string; income: number; expenses: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeeklyData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getWeeklyIncomeExpenses();
        if (response.status === "success" && response.data) {
          const formattedData = response.data.map((item) => ({
            name: language === "th" ? item.name : item.nameEn,
            income: item.income,
            expenses: item.expenses,
          }));
          setData(formattedData);
        } else {
          console.error("Failed to load weekly data:", response.message);
          setData([]);
        }
      } catch (error) {
        console.error("Error loading weekly data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeeklyData();
  }, [language]);

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{t("weeklyRevenue")}</h3>
        <p className="text-sm text-muted-foreground">
          {language === "th" ? "ภาพรวมรายได้และรายจ่ายสัปดาห์นี้" : "Income and expenses overview for this week"}
        </p>
      </div>
      <div className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{language === "th" ? "กำลังโหลด..." : "Loading..."}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
                tickFormatter={(value) => `฿${value.toLocaleString('th-TH')}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px hsl(222 47% 11% / 0.1)",
                }}
                formatter={(value: number, name: string) => {
                  const label = name === "income" 
                    ? (language === "th" ? "รายได้" : "Income")
                    : (language === "th" ? "รายจ่าย" : "Expenses");
                  return [`฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label];
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === "income") {
                    return language === "th" ? "รายได้" : "Income";
                  }
                  return language === "th" ? "รายจ่าย" : "Expenses";
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="income"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="expenses"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
