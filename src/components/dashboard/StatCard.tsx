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
      <div className="flex flex-col h-full">
        {/* Header with Icon and Title */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight flex-1 min-w-0">
            {title}
          </p>
          <div className={cn("p-2 sm:p-2.5 rounded-lg shrink-0", iconBg)}>
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="mb-3 sm:mb-4 flex-1 flex items-center">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground w-full">
            {value}
          </p>
        </div>

        {/* Change Indicator */}
        {change !== undefined && (
          <div className="flex flex-wrap items-center gap-1.5 mt-auto">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-status-completed shrink-0" />
            ) : isNegative ? (
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-status-cancelled shrink-0" />
            ) : null}
            <span
              className={cn(
                "text-xs sm:text-sm font-semibold",
                isPositive && "text-status-completed",
                isNegative && "text-status-cancelled",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {isPositive && "+"}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground leading-tight">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
