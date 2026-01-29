import { AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const alerts = [
  {
    id: 1,
    part: "iPhone 14 Screen",
    stock: 2,
    minStock: 5,
    critical: true,
  },
  {
    id: 2,
    part: "Samsung S23 Battery",
    stock: 3,
    minStock: 5,
    critical: true,
  },
  {
    id: 3,
    part: "USB-C Charging Ports",
    stock: 8,
    minStock: 10,
    critical: false,
  },
  {
    id: 4,
    part: "iPhone 13 Back Glass",
    stock: 4,
    minStock: 5,
    critical: false,
  },
];

export function StockAlerts() {
  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in h-full">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <AlertTriangle className="w-5 h-5 text-status-pending" />
        <h3 className="text-lg font-semibold text-foreground">Low Stock Alerts</h3>
      </div>
      <div className="p-4 space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border",
              alert.critical
                ? "bg-status-cancelled/5 border-status-cancelled/20"
                : "bg-status-pending/5 border-status-pending/20"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-lg",
                alert.critical ? "bg-status-cancelled/10" : "bg-status-pending/10"
              )}
            >
              <Package
                className={cn(
                  "w-4 h-4",
                  alert.critical ? "text-status-cancelled" : "text-status-pending"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {alert.part}
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.stock} left (min: {alert.minStock})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
