import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg = "bg-primary/10",
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-2 text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-status-completed" />
              ) : isNegative ? (
                <TrendingDown className="w-4 h-4 text-status-cancelled" />
              ) : null}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive && "text-status-completed",
                  isNegative && "text-status-cancelled",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBg)}>{icon}</div>
      </div>
    </div>
  );
}
