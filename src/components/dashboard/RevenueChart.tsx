import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const dataEn = [
  { name: "Mon", revenue: 4200, repairs: 12 },
  { name: "Tue", revenue: 3800, repairs: 10 },
  { name: "Wed", revenue: 5100, repairs: 15 },
  { name: "Thu", revenue: 4600, repairs: 13 },
  { name: "Fri", revenue: 6200, repairs: 18 },
  { name: "Sat", revenue: 7800, repairs: 22 },
  { name: "Sun", revenue: 3200, repairs: 8 },
];

const dataTh = [
  { name: "จ.", revenue: 4200, repairs: 12 },
  { name: "อ.", revenue: 3800, repairs: 10 },
  { name: "พ.", revenue: 5100, repairs: 15 },
  { name: "พฤ.", revenue: 4600, repairs: 13 },
  { name: "ศ.", revenue: 6200, repairs: 18 },
  { name: "ส.", revenue: 7800, repairs: 22 },
  { name: "อา.", revenue: 3200, repairs: 8 },
];

export function RevenueChart() {
  const { t, language } = useLanguage();
  const data = language === "th" ? dataTh : dataEn;

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{t("weeklyRevenue")}</h3>
        <p className="text-sm text-muted-foreground">
          {language === "th" ? "ภาพรวมรายได้สัปดาห์นี้" : "Revenue overview for this week"}
        </p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
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
              tickFormatter={(value) => `฿${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px hsl(222 47% 11% / 0.1)",
              }}
              formatter={(value: number) => [`฿${value}`, language === "th" ? "รายได้" : "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
