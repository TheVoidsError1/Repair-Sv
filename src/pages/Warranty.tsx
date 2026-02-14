import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs } from "@/contexts/RepairsContext";
import { useWarranty, type WarrantyClaim } from "@/contexts/WarrantyContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    CheckCircle,
    CheckCircle2,
    Clock,
    Eye,
    Filter,
    Plus,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { type ReactNode, useState, useEffect } from "react";

/** จำนวนวันรับประกันเริ่มต้น (ใช้จาก repair.createdAt ของงานซ่อมที่ completed) */
const DEFAULT_WARRANTY_DAYS = 90;

/** คำนวณวันหมดประกันจากวันที่ซ่อม (YYYY-MM-DD) + จำนวนวัน */
function getWarrantyExpiryDate(repairDateStr: string, warrantyDays: number): string {
  const d = new Date(repairDateStr + "T00:00:00");
  if (isNaN(d.getTime())) return repairDateStr;
  d.setDate(d.getDate() + warrantyDays);
  return d.toISOString().slice(0, 10);
}

/** คำนวณจำนวนวันคงเหลือจนหมดประกัน (ติดลบ = หมดอายุแล้ว) */
function getRemainingWarrantyDays(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr + "T00:00:00");
  if (isNaN(expiry.getTime())) return 0;
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

/** สถานะประกันสำหรับ badge: valid (เขียว), expiring_soon (เหลือง), expired (แดง) */
function getWarrantyBadgeStatus(remainingDays: number): "valid" | "expiring_soon" | "expired" {
  if (remainingDays < 0) return "expired";
  if (remainingDays <= 30) return "expiring_soon";
  return "valid";
}

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  approved: "status-completed",
  rejected: "status-cancelled",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  "in-progress": <ShieldCheck className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
};

const Warranty = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { repairs } = useRepairs();
  const { claims, isLoading, addClaim, updateClaimStatus } = useWarranty();
  const { toast } = useToast();
  const isOwner = currentUser?.role === "owner";
  const pendingClaims = claims.filter((c) => c.status === "pending");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [inspectionClaim, setInspectionClaim] = useState<WarrantyClaim | null>(null);
  const [inspectionChecks, setInspectionChecks] = useState({
    deviceCondition: false,
    claimReasonMatch: false,
    customerVerified: false,
  });
  const [snMismatchClaim, setSnMismatchClaim] = useState<WarrantyClaim | null>(null);
  
  // State สำหรับงานซ่อมที่เสร็จแล้วทั้งหมด
  const [allCompletedRepairs, setAllCompletedRepairs] = useState<any[]>([]);
  const [loadingCompletedRepairs, setLoadingCompletedRepairs] = useState(false);

  // โหลดงานซ่อมที่เสร็จแล้วทั้งหมดเมื่อเปิด dialog
  useEffect(() => {
    if (isDialogOpen) {
      loadCompletedRepairs();
    }
  }, [isDialogOpen]);

  const loadCompletedRepairs = async () => {
    setLoadingCompletedRepairs(true);
    try {
      // โหลดหลายหน้าเพื่อให้ได้งานซ่อมที่ completed ทั้งหมด
      const response = await apiClient.getRepairs(1, 1000) as any;
      if (response.status === 'success' && response.data) {
        // กรองเฉพาะงานที่ completed และมี serialNumber
        const completed = response.data.filter((r: any) => 
          r.status === 'completed' && r.serialNumber
        );
        console.log('Loaded completed repairs:', completed);
        setAllCompletedRepairs(completed);
      }
    } catch (error) {
      console.error('Failed to load completed repairs:', error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" 
          ? "ไม่สามารถโหลดรายการงานซ่อมได้" 
          : "Failed to load repairs",
        variant: "destructive",
      });
    } finally {
      setLoadingCompletedRepairs(false);
    }
  };

  const resetInspectionModal = () => {
    setInspectionClaim(null);
    setInspectionChecks({ deviceCondition: false, claimReasonMatch: false, customerVerified: false });
  };

  const inspectionComplete =
    inspectionChecks.deviceCondition && inspectionChecks.claimReasonMatch && inspectionChecks.customerVerified;

  // เลือกได้เฉพาะงานซ่อมที่เสร็จแล้ว (และยังไม่มีเคลมของงานนี้ในบางระบบ — ที่นี่ให้เลือกซ้ำได้)
  // เรียงลำดับตามวันที่สร้าง (ใหม่สุดก่อน) และกรองเฉพาะที่มี serialNumber
  const completedRepairs = allCompletedRepairs
    .map((r) => ({
      id: r.id,
      serialNumber: r.serialNumber,
      customer: r.customer?.fullName || `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim() || 'Unknown',
      createdAt: r.dateOfReport ? new Date(r.dateOfReport).toISOString().split('T')[0] : r.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    }))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const statusLabels: Record<string, string> = {
    pending: t("pendingReview"),
    "in-progress": t("underInspection"),
    approved: t("approved"),
    rejected: t("rejected"),
  };

  const filteredClaims = claims.filter((claim) => {
    const repair = claim.repair || repairs.find((r) => r.id === claim.repairId);
    const customer = repair?.customer?.firstName 
      ? `${repair.customer.firstName} ${repair.customer.lastName || ''}`
      : repair?.customer || "";
    const sn = (claim.serialNumber ?? "").toLowerCase();
    const claimNum = (claim.claimNumber ?? "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      claimNum.includes(q) ||
      claim.repairId.toLowerCase().includes(q) ||
      customer.toLowerCase().includes(q) ||
      (sn && sn.includes(q));
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;

  // เลือกงานซ่อมจาก dropdown (เฉพาะที่ completed)
  const [selectedRepairId, setSelectedRepairId] = useState<string>("");
  const [newClaimReason, setNewClaimReason] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedRepairId("");
      setNewClaimReason("");
    }
  }, [isDialogOpen]);

  /** หางานซ่อมที่เลือกจาก dropdown */
  const repairBySn = selectedRepairId
    ? allCompletedRepairs.find((r) => r.id === selectedRepairId)
    : null;
  const repairDateBySn = repairBySn?.dateOfReport 
    ? new Date(repairBySn.dateOfReport).toISOString().split('T')[0]
    : repairBySn?.createdAt?.split('T')[0] || "";
  const expiryDateBySn = repairDateBySn ? getWarrantyExpiryDate(repairDateBySn, DEFAULT_WARRANTY_DAYS) : "";
  const remainingDaysBySn = expiryDateBySn ? getRemainingWarrantyDays(expiryDateBySn) : 0;
  const previousClaimCountBySn = repairBySn
    ? claims.filter((c) => c.repairId === repairBySn.repairNumber || c.repairId === repairBySn.id).length
    : 0;
  const canSubmitClaim = !!repairBySn && newClaimReason.trim().length > 0;

  const handleSubmitClaim = async () => {
    if (!repairBySn) {
      toast({
        title: language === "th" ? "แจ้งเตือน" : "Notice",
        description: language === "th" ? "กรุณาเลือกงานซ่อม" : "Please select a repair.",
        variant: "destructive",
      });
      return;
    }
    if (!newClaimReason.trim()) {
      toast({
        title: language === "th" ? "แจ้งเตือน" : "Notice",
        description: language === "th" ? "กรุณากรอกเหตุผลการเคลม" : "Please enter the claim reason.",
        variant: "destructive",
      });
      return;
    }
    const reason = newClaimReason.trim();
    console.log('Submitting claim with repair:', repairBySn);
    console.log('Repair ID:', repairBySn.id);
    console.log('Serial Number:', repairBySn.serialNumber);
    
    const result = await addClaim({
      repairId: repairBySn.id,
      serialNumber: repairBySn.serialNumber,
      claimReason: reason,
      claimReasonTh: reason,
    });
    
    if (result) {
      toast({
        title: language === "th" ? "สำเร็จ" : "Success",
        description: t("submitClaim"),
      });
      setSelectedRepairId("");
      setNewClaimReason("");
      setIsDialogOpen(false);
    } else {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "ไม่สามารถสร้างเคลมได้" : "Failed to create claim",
        variant: "destructive",
      });
    }
  };

  const handleViewReport = (claim: WarrantyClaim) => {
    setSelectedClaim(claim);
    setReportDialogOpen(true);
  };

  const selectedRepair = selectedClaim?.repair || (selectedClaim
    ? repairs.find((r) => r.id === selectedClaim.repairId)
    : null);

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("warrantyClaims")}</h1>
            <p className="page-description">{t("warrantyDescription")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("newClaim")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("createWarrantyClaim")}</DialogTitle>
                <DialogDescription>
                  {language === "th"
                    ? "เลือกงานซ่อมที่เสร็จแล้วเพื่อสร้างเคลมการรับประกัน"
                    : "Select a completed repair to create a warranty claim"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="repairSelect">
                    {language === "th" ? "เลือกงานซ่อม" : "Select Repair"}
                  </Label>
                  <Select
                    value={selectedRepairId}
                    onValueChange={(value) => setSelectedRepairId(value)}
                  >
                    <SelectTrigger id="repairSelect">
                      <SelectValue placeholder={language === "th" ? "เลือกงานซ่อมที่เสร็จแล้ว" : "Select completed repair"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCompletedRepairs ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        </div>
                      ) : completedRepairs.length === 0 ? (
                        <SelectItem value="no-repairs" disabled>
                          {language === "th" ? "ไม่มีงานซ่อมที่เสร็จแล้ว" : "No completed repairs"}
                        </SelectItem>
                      ) : (
                        completedRepairs.map((repair) => {
                          const displayText = repair.serialNumber
                            ? `${repair.serialNumber} - ${repair.customer}`
                            : repair.customer;
                          return (
                            <SelectItem key={repair.id} value={repair.id}>
                              {displayText}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {repairBySn && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                    <p className="font-medium text-foreground">
                      {repairBySn.repairNumber || repairBySn.id} · {repairBySn.customer?.fullName || `${repairBySn.customer?.firstName || ''} ${repairBySn.customer?.lastName || ''}`.trim()}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>{language === "th" ? "วันที่ซ่อม" : "Repair date"}</span>
                      <span className="text-foreground">{repairDateBySn}</span>
                      <span>{language === "th" ? "วันหมดประกัน" : "Expiry date"}</span>
                      <span className="text-foreground">{expiryDateBySn}</span>
                      <span>{language === "th" ? "วันคงเหลือ" : "Remaining days"}</span>
                      <span className="text-foreground">
                        {remainingDaysBySn < 0
                          ? (language === "th" ? "หมดอายุ" : "Expired")
                          : `${remainingDaysBySn} ${language === "th" ? "วัน" : "days"}`}
                      </span>
                      <span>{language === "th" ? "จำนวนเคลมก่อนหน้า" : "Previous claims"}</span>
                      <span className="text-foreground">{previousClaimCountBySn}</span>
                    </div>
                    <p className={cn(
                      "text-xs font-medium pt-1",
                      getWarrantyBadgeStatus(remainingDaysBySn) === "valid"
                        ? "text-emerald-600"
                        : getWarrantyBadgeStatus(remainingDaysBySn) === "expiring_soon"
                          ? "text-amber-600"
                          : "text-red-600"
                    )}>
                      {getWarrantyBadgeStatus(remainingDaysBySn) === "valid"
                        ? (language === "th" ? "ภายในประกัน" : "In warranty")
                        : getWarrantyBadgeStatus(remainingDaysBySn) === "expiring_soon"
                          ? (language === "th" ? "ใกล้หมด" : "Expiring soon")
                          : (language === "th" ? "หมดอายุ" : "Expired")}
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="claimReason">{t("claimReason")}</Label>
                  <Textarea
                    id="claimReason"
                    placeholder={t("describeIssue")}
                    value={newClaimReason}
                    onChange={(e) => setNewClaimReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSubmitClaim} disabled={!canSubmitClaim || (repairBySn ? getRemainingWarrantyDays(expiryDateBySn) < 0 : true)}>
                  {t("submitClaim")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* เจ้าของเท่านั้น: จัดการคำขออนุมัติเคลม */}
      {isOwner && pendingClaims.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-500/30 border-border overflow-hidden mb-6">
          <div className="p-4 border-b border-border bg-amber-500/5">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              {language === "th" ? "คำขอที่รออนุมัติ" : "Pending approval"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "th" ? "อนุมัติหรือปฏิเสธเคลมการรับประกัน" : "Approve or reject warranty claims"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("claimId")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("serialOrImei")}</th>
                  <th>{t("claimReason")}</th>
                  <th>{t("date")}</th>
                  <th>{language === "th" ? "วันหมดประกัน" : "Expiry date"}</th>
                  <th>{language === "th" ? "การดำเนินการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => {
                  const repair = claim.repair || repairs.find((r) => r.id === claim.repairId);
                  const noRepairRecord = !repair;
                  const snMismatch =
                    !!repair &&
                    !!claim.serialNumber &&
                    !!repair.serialNumber &&
                    claim.serialNumber.trim().toLowerCase() !== repair.serialNumber.trim().toLowerCase();
                  const customer = repair?.customer?.firstName 
                    ? `${repair.customer.firstName} ${repair.customer.lastName || ''}`
                    : repair?.customer || "—";
                  const reasonText = language === "th" ? claim.claimReasonTh : claim.claimReason;
                  const repairDate = repair?.createdAt ?? claim.claimDate;
                  const expiryDate = getWarrantyExpiryDate(repairDate, DEFAULT_WARRANTY_DAYS);
                  const remainingDays = getRemainingWarrantyDays(expiryDate);
                  const isExpired = remainingDays < 0;
                  const approveDisabled = isExpired || noRepairRecord || snMismatch;
                  return (
                    <tr key={claim.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground">{claim.claimNumber}</p>
                          <p className="text-xs text-muted-foreground">{claim.repairId}</p>
                        </div>
                      </td>
                      <td>{customer}</td>
                      <td>
                        <span className="font-mono text-sm">
                          {claim.serialNumber || repair?.serialNumber || "—"}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate">{reasonText}</td>
                      <td>{claim.claimDate}</td>
                      <td>{expiryDate}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1 bg-status-completed hover:bg-status-completed/90 disabled:opacity-60"
                            disabled={approveDisabled}
                            onClick={() => {
                              if (approveDisabled) return;
                              if (snMismatch) {
                                setSnMismatchClaim(claim);
                                return;
                              }
                              setInspectionClaim(claim);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {language === "th" ? "อนุมัติ" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={async () => {
                              await updateClaimStatus(claim.id, "rejected");
                              toast({
                                title: language === "th" ? "ปฏิเสธแล้ว" : "Rejected",
                                description: `${claim.claimNumber} ${language === "th" ? "ปฏิเสธเคลมแล้ว" : "claim rejected"}`,
                                variant: "destructive",
                              });
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            {language === "th" ? "ปฏิเสธ" : "Reject"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SN ไม่ตรงกับงานซ่อมเดิม — แจ้งเตือนก่อนเปิด inspection */}
      <Dialog open={!!snMismatchClaim} onOpenChange={(open) => !open && setSnMismatchClaim(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {language === "th" ? "หมายเลขเครื่องไม่ตรงกับงานซ่อมเดิม" : "Serial number mismatch"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "หมายเลข IMEI/SN ของเคลมนี้ไม่ตรงกับงานซ่อมที่อ้างอิง ลูกค้าอาจนำเครื่องคนละเครื่องมาเคลม ต้องการดำเนินการต่อหรือไม่?"
                : "This claim's IMEI/SN does not match the original repair record. Customer may be claiming with a different device. Continue anyway?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnMismatchClaim(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (snMismatchClaim) {
                  setInspectionClaim(snMismatchClaim);
                  setSnMismatchClaim(null);
                }
              }}
            >
              {language === "th" ? "ดำเนินการต่อ" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection checklist modal — ก่อนอนุมัติเคลม (เจ้าของเท่านั้น) */}
      <Dialog open={!!inspectionClaim} onOpenChange={(open) => !open && resetInspectionModal()}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "รายการตรวจก่อนอนุมัติ" : "Inspection checklist"}
            </DialogTitle>
            <DialogDescription>
              {inspectionClaim
                ? (language === "th"
                  ? "ยืนยันรายการด้านล่างก่อนอนุมัติเคลม"
                  : "Confirm the items below before approving the claim.")
                : ""}
            </DialogDescription>
          </DialogHeader>
          {inspectionClaim && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "เคลม" : "Claim"}: <span className="font-medium text-foreground">{inspectionClaim.claimNumber}</span>
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={inspectionChecks.deviceCondition}
                    onCheckedChange={(c) => setInspectionChecks((prev) => ({ ...prev, deviceCondition: !!c }))}
                    className="border-border"
                  />
                  <span className="text-sm">
                    {language === "th" ? "ตรวจสอบสภาพเครื่องและความเสียหายตรงกับเหตุผลเคลม" : "Device condition and damage match claim reason"}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={inspectionChecks.claimReasonMatch}
                    onCheckedChange={(c) => setInspectionChecks((prev) => ({ ...prev, claimReasonMatch: !!c }))}
                    className="border-border"
                  />
                  <span className="text-sm">
                    {language === "th" ? "เหตุผลการเคลมสอดคล้องกับงานซ่อมเดิม" : "Claim reason matches original repair"}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={inspectionChecks.customerVerified}
                    onCheckedChange={(c) => setInspectionChecks((prev) => ({ ...prev, customerVerified: !!c }))}
                    className="border-border"
                  />
                  <span className="text-sm">
                    {language === "th" ? "ยืนยันตัวตนลูกค้าแล้ว" : "Customer identity verified"}
                  </span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={resetInspectionModal}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!inspectionComplete}
              className="gap-1 bg-status-completed hover:bg-status-completed/90"
              onClick={async () => {
                if (!inspectionClaim || !inspectionComplete) return;
                await updateClaimStatus(inspectionClaim.id, "approved");
                toast({
                  title: language === "th" ? "อนุมัติแล้ว" : "Approved",
                  description: `${inspectionClaim.claimNumber} ${language === "th" ? "อนุมัติเคลมแล้ว" : "claim approved"}`,
                });
                resetInspectionModal();
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {language === "th" ? "ยืนยันอนุมัติ" : "Confirm approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Cards — รูปแบบเดียวกับ Finance / Repairs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-pending/10">
              <Clock className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("pending")}</p>
              <p className="text-xl font-semibold text-foreground">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-completed/10">
              <CheckCircle className="w-5 h-5 text-status-completed" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("approved")}</p>
              <p className="text-xl font-semibold text-foreground">
                {approvedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-cancelled/10">
              <XCircle className="w-5 h-5 text-status-cancelled" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("rejected")}</p>
              <p className="text-xl font-semibold text-foreground">
                {rejectedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ค้นหา + ตัวกรอง — รูปแบบเดียวกับ Repairs / Inventory */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchClaims")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="in-progress">{t("underInspection")}</SelectItem>
            <SelectItem value="approved">{t("approved")}</SelectItem>
            <SelectItem value="rejected">{t("rejected")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ตารางเคลม — แสดงข้อมูลจากงานซ่อมที่อ้างอิง */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead>
              <tr>
                <th>{t("claimId")}</th>
                <th>{t("customer")}</th>
                <th>{t("device")}</th>
                <th>{t("serialOrImei")}</th>
                <th>{t("originalRepair")}</th>
                <th>{t("claimReason")}</th>
                <th>{t("status")}</th>
                <th>{language === "th" ? "วันหมดประกัน" : "Expiry date"}</th>
                <th>{t("report")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => {
                const repair = claim.repair || repairs.find((r) => r.id === claim.repairId);
                const originalRepairText = repair
                  ? language === "th"
                    ? repair.problemSymptoms || repair.problemDescription
                    : repair.problemDescription
                  : "—";
                const customer = repair?.customer?.firstName 
                  ? `${repair.customer.firstName} ${repair.customer.lastName || ''}`
                  : repair?.customer || "—";
                const device = repair?.deviceModel || repair?.device || "—";
                const reasonText =
                  language === "th" ? claim.claimReasonTh : claim.claimReason;
                const repairDate = repair?.createdAt ?? claim.claimDate;
                const expiryDate = getWarrantyExpiryDate(repairDate, DEFAULT_WARRANTY_DAYS);
                return (
                  <tr key={claim.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{claim.claimNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {claim.repairId}
                        </p>
                      </div>
                    </td>
                    <td>{customer}</td>
                    <td>{device}</td>
                    <td>
                      <span className="font-mono text-sm">
                        {claim.serialNumber || repair?.serialNumber || "—"}
                      </span>
                    </td>
                    <td>{originalRepairText}</td>
                    <td className="max-w-[200px] truncate">{reasonText}</td>
                    <td>
                      <span
                        className={`status-badge ${statusStyles[claim.status]} flex items-center gap-1`}
                      >
                        {statusIcons[claim.status]}
                        {statusLabels[claim.status]}
                      </span>
                    </td>
                    <td>{expiryDate}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleViewReport(claim)}
                      >
                        <Eye className="w-4 h-4" />
                        {t("view")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Dialog ดูรายละเอียด — ขนาดใหญ่ อ่านง่าย */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl">
              {t("report")} · {selectedClaim?.claimNumber ?? ""}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {language === "th" ? "รายละเอียดเคลม" : "Claim details"}
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (() => {
            const repair = selectedClaim.repair || repairs.find((r) => r.id === selectedClaim.repairId);
            const repairDate = repair?.createdAt ?? selectedClaim.claimDate;
            const expiryDate = getWarrantyExpiryDate(repairDate, DEFAULT_WARRANTY_DAYS);
            const remainingDays = getRemainingWarrantyDays(expiryDate);
            const warrantyStatus = getWarrantyBadgeStatus(remainingDays);
            const warrantyBadgeClass =
              warrantyStatus === "valid"
                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                : warrantyStatus === "expiring_soon"
                  ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                  : "bg-red-500/15 text-red-600 border-red-500/30";
            const warrantyBadgeLabel =
              warrantyStatus === "valid"
                ? language === "th" ? "ภายในประกัน" : "In warranty"
                : warrantyStatus === "expiring_soon"
                  ? language === "th" ? "ใกล้หมด" : "Expiring soon"
                  : language === "th" ? "หมดอายุ" : "Expired";
            const row = (label: string, value: ReactNode) => (
              <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-3 items-baseline border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                <span className="text-sm text-foreground min-w-0">{value}</span>
              </div>
            );
            const customer = repair?.customer?.firstName 
              ? `${repair.customer.firstName} ${repair.customer.lastName || ''}`
              : repair?.customer || "—";
            const device = repair?.deviceModel || repair?.device || "—";
            const originalRepair = repair
              ? language === "th"
                ? repair.problemSymptoms || repair.problemDescription
                : repair.problemDescription
              : "—";
            return (
              <div className="px-6 pb-6 space-y-0">
                {row(t("claimId"), <span>{selectedClaim.claimNumber} <span className="text-muted-foreground">/ {selectedClaim.repairId}</span></span>)}
                {row(t("customer"), customer)}
                {row(t("device"), device)}
                {row(t("serialOrImei"), <span className="font-mono">{selectedClaim.serialNumber || repair?.serialNumber || "—"}</span>)}
                {row(t("originalRepair"), originalRepair)}
                {row(t("claimReason"), language === "th" ? selectedClaim.claimReasonTh : selectedClaim.claimReason)}
                {row(t("status"), (
                  <span className={`status-badge ${statusStyles[selectedClaim.status]} inline-flex items-center gap-1 w-fit`}>
                    {statusIcons[selectedClaim.status]}
                    {statusLabels[selectedClaim.status]}
                  </span>
                ))}
                {row(language === "th" ? "วันหมดประกัน" : "Expiry date", expiryDate)}
                {row(language === "th" ? "วันคงเหลือ" : "Remaining days", remainingDays < 0 ? (language === "th" ? "หมดอายุ" : "Expired") : `${remainingDays} ${language === "th" ? "วัน" : "days"}`)}
                {row(language === "th" ? "สถานะประกัน" : "Warranty status", (
                  <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", warrantyBadgeClass)}>
                    {warrantyBadgeLabel}
                  </span>
                ))}
                {row(t("date"), selectedClaim.claimDate)}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Warranty;
