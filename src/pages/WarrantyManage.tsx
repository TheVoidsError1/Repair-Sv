import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_WARRANTY_DAYS = 90;

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getRemainingDays(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr + "T00:00:00");
  if (isNaN(expiry.getTime())) return 0;
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

async function fetchAllRepairs(limit = 100): Promise<any[]> {
  let page = 1;
  const all: any[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = (await apiClient.getRepairs(page, limit)) as any;
    if (res.status !== "success" || !Array.isArray(res.data)) break;
    all.push(...res.data);
    const totalPages = res.pagination?.totalPages ?? 1;
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

export default function WarrantyManage() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [draftDays, setDraftDays] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const all = await fetchAllRepairs(100);
      const pickedUp = all
        .filter((r) => r?.status === "picked-up")
        .sort((a, b) => String(b?.pickedUpDate ?? b?.createdAt ?? "").localeCompare(String(a?.pickedUpDate ?? a?.createdAt ?? "")));
      setRepairs(pickedUp);

      const nextDraft: Record<string, string> = {};
      pickedUp.forEach((r: any) => {
        nextDraft[r.id] = String(r.warrantyDays ?? DEFAULT_WARRANTY_DAYS);
      });
      setDraftDays(nextDraft);
    } catch (e) {
      console.error(e);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "โหลดข้อมูลงานซ่อมไม่สำเร็จ" : "Failed to load repairs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    return repairs.map((r) => {
      const startDate = formatDate(r.pickedUpDate ?? r.completedDate ?? r.dateOfReport ?? r.createdAt);
      const daysRaw = draftDays[r.id];
      const days = Number(daysRaw);
      const safeDays = Number.isFinite(days) ? Math.max(0, Math.min(3650, Math.trunc(days))) : DEFAULT_WARRANTY_DAYS;
      const expiry = startDate ? addDays(startDate, safeDays) : "";
      const remaining = expiry ? getRemainingDays(expiry) : 0;
      return { r, startDate, safeDays, expiry, remaining };
    });
  }, [repairs, draftDays]);

  const saveWarrantyDays = async (repairId: string) => {
    const raw = draftDays[repairId];
    const wd = Number(raw);
    if (!Number.isFinite(wd) || !Number.isInteger(wd) || wd < 0 || wd > 3650) {
      toast({
        title: language === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid",
        description: language === "th" ? "กรุณาใส่จำนวนวันเป็นเลขจำนวนเต็ม 0 - 3650" : "Warranty days must be an integer 0 - 3650",
        variant: "destructive",
      });
      return;
    }

    setSavingId(repairId);
    try {
      const res = await apiClient.updateRepair(repairId, { warrantyDays: wd });
      if (res.status === "success") {
        setRepairs((prev) => prev.map((p) => (p.id === repairId ? { ...p, warrantyDays: wd } : p)));
        toast({
          title: language === "th" ? "บันทึกแล้ว" : "Saved",
          description: language === "th" ? "อัปเดตจำนวนวันรับประกันเรียบร้อย" : "Warranty days updated",
        });
      } else {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: res.message || (language === "th" ? "บันทึกไม่สำเร็จ" : "Save failed"),
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "บันทึกไม่สำเร็จ" : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{language === "th" ? "จัดการเคลม" : "Claim Management"}</h1>
            <p className="page-description">
              {language === "th"
                ? "กำหนดจำนวนวันรับประกัน/เคลมต่อรายการงานซ่อม (เริ่มนับเมื่อรับเครื่องแล้ว)"
                : "Set warranty/claim days per repair (starts at picked-up)."}
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={isLoading} className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            {language === "th" ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="data-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>{language === "th" ? "เลขที่ซ่อม" : "Repair #"}</th>
                  <th>{language === "th" ? "ลูกค้า" : "Customer"}</th>
                  <th>{language === "th" ? "SN/IMEI" : "SN/IMEI"}</th>
                  <th>{language === "th" ? "เริ่มนับ" : "Start"}</th>
                  <th>{language === "th" ? "กี่วัน" : "Days"}</th>
                  <th>{language === "th" ? "วันหมดประกัน" : "Expiry"}</th>
                  <th>{language === "th" ? "คงเหลือ" : "Remaining"}</th>
                  <th>{language === "th" ? "การดำเนินการ" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted-foreground py-10">
                      {language === "th" ? "ยังไม่มีงานซ่อมที่รับเครื่องแล้ว" : "No picked-up repairs"}
                    </td>
                  </tr>
                ) : (
                  rows.map(({ r, startDate, expiry, remaining }) => {
                    const remainingClass =
                      remaining < 0
                        ? "text-red-600 dark:text-red-400"
                        : remaining <= 30
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400";
                    const customer =
                      r.customer?.fullName ||
                      `${r.customer?.firstName || ""} ${r.customer?.lastName || ""}`.trim() ||
                      "—";
                    return (
                      <tr key={r.id}>
                        <td>
                          <div>
                            <p className="font-medium text-foreground">{r.repairNumber || r.id}</p>
                            {/* ซ่อน UUID เพื่อให้ UI อ่านง่าย */}
                          </div>
                        </td>
                        <td>{customer}</td>
                        <td className="font-mono text-sm">{r.serialNumber || "—"}</td>
                        <td>{startDate || "—"}</td>
                        <td>
                          <Input
                            value={draftDays[r.id] ?? ""}
                            onChange={(e) => setDraftDays((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            type="number"
                            min={0}
                            max={3650}
                            className="w-[120px]"
                          />
                        </td>
                        <td>{expiry || "—"}</td>
                        <td className={cn("font-semibold", remainingClass)}>
                          {expiry ? (remaining < 0 ? (language === "th" ? "หมดอายุ" : "Expired") : `${remaining} ${language === "th" ? "วัน" : "days"}`) : "—"}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => saveWarrantyDays(r.id)}
                            disabled={savingId === r.id}
                          >
                            <Save className="w-4 h-4" />
                            {language === "th" ? "บันทึก" : "Save"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

