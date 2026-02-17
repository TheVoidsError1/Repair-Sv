import { AlertTriangle, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";

interface PartFromAPI {
  id: string;
  name: string;
  nameTh?: string;
  stockQuantity: number;
  minStockLevel: number;
  [key: string]: any;
}

interface StockAlert {
  id: string;
  part: string;
  partTh: string;
  stock: number;
  minStock: number;
  critical: boolean;
}

export function StockAlerts() {
  const { t, language } = useLanguage();
  const [parts, setParts] = useState<PartFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูล parts จาก API
  useEffect(() => {
    const loadParts = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getParts();
        if (response.status === "success" && response.data) {
          setParts(response.data as PartFromAPI[]);
        } else {
          console.error("Failed to load parts:", response.message);
          setParts([]);
        }
      } catch (error) {
        console.error("Error loading parts:", error);
        setParts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadParts();
  }, []);

  // กรองและแปลงข้อมูลเป็น alerts
  const alerts = useMemo(() => {
    return parts
      .filter((part) => part.stockQuantity <= part.minStockLevel)
      .map((part) => ({
        id: part.id,
        part: part.name,
        partTh: part.nameTh || part.name,
        stock: part.stockQuantity,
        minStock: part.minStockLevel,
        critical: part.stockQuantity === 0, // critical ถ้าสต็อกเป็น 0
      }))
      .sort((a, b) => {
        // เรียงลำดับ: critical (stock = 0) ก่อน, แล้วตาม stock ที่เหลือ (น้อยก่อน)
        if (a.critical && !b.critical) return -1;
        if (!a.critical && b.critical) return 1;
        return a.stock - b.stock;
      })
      .slice(0, 5); // แสดงสูงสุด 5 รายการ
  }, [parts]);

  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in h-full">
      <div className="flex items-center gap-2 p-4 sm:p-6 border-b border-border">
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-status-pending" />
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t("lowStockAlerts")}</h3>
      </div>
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t("loading") || "กำลังโหลด..."}
            </span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              {t("noLowStockAlerts") || "ไม่มีสินค้าใกล้หมด"}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
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
                  {language === "th" ? alert.partTh : alert.part}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("left")} {alert.stock} ({t("min")}: {alert.minStock})
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
