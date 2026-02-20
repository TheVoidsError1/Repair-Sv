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
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    CheckCircle2,
    Clock,
    Eye,
    Filter,
    Plus,
    Search,
    ShieldCheck,
    User,
    Wrench,
    XCircle,
} from "lucide-react";
import { type ReactNode, useMemo, useState, useEffect } from "react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

/** จำนวนวันรับประกันเริ่มต้น (เริ่มนับเมื่อสถานะงานซ่อมเป็น "รับเครื่องแล้ว" / picked-up) */
const DEFAULT_WARRANTY_DAYS = 90;

/** ดึงจำนวนวันรับประกันจาก repair (ถ้าไม่มี ใช้ค่าเริ่มต้น) */
function getWarrantyDaysFromRepair(repair: any): number {
  const wd = Number(repair?.warrantyDays);
  if (!Number.isFinite(wd) || !Number.isInteger(wd) || wd < 0) return DEFAULT_WARRANTY_DAYS;
  return wd;
}

/** แปลงวันที่เป็นรูปแบบ YYYY-MM-DD */
function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split('T')[0];
}

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
  
  // State สำหรับงานซ่อมที่ "รับเครื่องแล้ว" ทั้งหมด (เริ่มนับประกัน)
  const [allCompletedRepairs, setAllCompletedRepairs] = useState<any[]>([]);
  const [loadingCompletedRepairs, setLoadingCompletedRepairs] = useState(false);

  // State สำหรับ "งานซ่อมทั้งหมด" (ใช้หา SN ล่าสุดของลูกค้าใน Step 1)
  const [globalCompletedRepairs, setGlobalCompletedRepairs] = useState<any[]>([]);
  const [loadingGlobalCompletedRepairs, setLoadingGlobalCompletedRepairs] = useState(false);
  
  // State สำหรับ 2-step dialog
  const [dialogStep, setDialogStep] = useState<"customer" | "repair">("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // State สำหรับ pagination
  const [pendingApprovalPage, setPendingApprovalPage] = useState(1);
  const [warrantyListPage, setWarrantyListPage] = useState(1);
  const ITEMS_PER_PAGE_PENDING = 4; // คำขอที่รออนุมัติ ไม่เกิน 4 รายการต่อหน้า
  const ITEMS_PER_PAGE_WARRANTY = 6; // รายการรับประกัน ไม่เกิน 6 รายการต่อหน้า

  // โหลดลูกค้าทั้งหมดเมื่อเปิด dialog
  useEffect(() => {
    if (isDialogOpen && dialogStep === "customer") {
      loadCustomers();
      loadGlobalCompletedRepairs();
    }
  }, [isDialogOpen, dialogStep]);

  const loadGlobalCompletedRepairs = async () => {
    setLoadingGlobalCompletedRepairs(true);
    try {
      // ดึงงานซ่อมจำนวนมากพอเพื่อหา SN ล่าสุดของลูกค้า (เฉพาะ picked-up และมี serialNumber)
      const response = await apiClient.getRepairs(1, 1000) as any;
      if (response.status === "success" && Array.isArray(response.data)) {
        const completed = response.data.filter(
          (r: any) => r?.status === "picked-up" && typeof r?.serialNumber === "string" && r.serialNumber.trim()
        );
        setGlobalCompletedRepairs(completed);
      } else {
        setGlobalCompletedRepairs([]);
      }
    } catch (error) {
      console.error("Failed to load global completed repairs:", error);
      setGlobalCompletedRepairs([]);
    } finally {
      setLoadingGlobalCompletedRepairs(false);
    }
  };

  const latestSnByCustomerId = useMemo(() => {
    const map = new Map<string, { sn: string; date: string }>();
    for (const r of globalCompletedRepairs) {
      const customerId = r?.customer?.id;
      const sn = typeof r?.serialNumber === "string" ? r.serialNumber.trim() : "";
      if (!customerId || !sn) continue;

      const date =
        formatDate(r?.pickedUpDate ?? r?.completedDate ?? r?.dateOfReport ?? r?.createdAt) || "";
      const prev = map.get(customerId);
      if (!prev) {
        map.set(customerId, { sn, date });
        continue;
      }
      // ถ้ามีวันที่ ให้ใช้ตัวที่ใหม่กว่า (YYYY-MM-DD เทียบแบบ string ได้)
      if (date && (!prev.date || date > prev.date)) {
        map.set(customerId, { sn, date });
      }
    }
    return map;
  }, [globalCompletedRepairs]);

  // โหลดงานซ่อมของลูกค้าที่เลือก
  useEffect(() => {
    if (isDialogOpen && dialogStep === "repair" && selectedCustomerId) {
      loadCustomerRepairs(selectedCustomerId);
    }
  }, [isDialogOpen, dialogStep, selectedCustomerId]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await apiClient.getCustomers();
      if (response.status === 'success' && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" 
          ? "ไม่สามารถโหลดรายการลูกค้าได้" 
          : "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadCustomerRepairs = async (customerId: string) => {
    setLoadingCompletedRepairs(true);
    try {
      const response = await apiClient.getCustomerWithRepairs(customerId);
      if (response.status === 'success' && response.data) {
        // กรองเฉพาะงานที่รับเครื่องแล้ว (picked-up) และมี serialNumber
        const completed = (response.data.repairs || []).filter((r: any) => 
          r.status === 'picked-up' && r.serialNumber
        );
        setAllCompletedRepairs(completed);
      }
    } catch (error) {
      console.error('Failed to load customer repairs:', error);
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

  const loadCompletedRepairs = async () => {
    setLoadingCompletedRepairs(true);
    try {
      // โหลดหลายหน้าเพื่อให้ได้งานซ่อมที่รับเครื่องแล้ว (picked-up) ทั้งหมด
      const response = await apiClient.getRepairs(1, 1000) as any;
      if (response.status === 'success' && response.data) {
        // กรองเฉพาะงานที่รับเครื่องแล้ว (picked-up) และมี serialNumber
        const completed = response.data.filter((r: any) => 
          r.status === 'picked-up' && r.serialNumber
        );
        console.log('Loaded picked-up repairs:', completed);
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

  // เลือกได้เฉพาะงานซ่อมที่รับเครื่องแล้ว (และยังไม่มีเคลมของงานนี้ในบางระบบ — ที่นี่ให้เลือกซ้ำได้)
  // เรียงลำดับตามวันที่สร้าง (ใหม่สุดก่อน) และกรองเฉพาะที่มี serialNumber
  const completedRepairs = allCompletedRepairs
    .map((r) => {
      // วันเริ่มนับประกัน: pickedUpDate (fallback เผื่อข้อมูลเก่า)
      const repairDate =
        formatDate(r.pickedUpDate ?? r.completedDate ?? r.dateOfReport ?? r.createdAt) ||
        formatDate(new Date());
      const expiryDate = getWarrantyExpiryDate(repairDate, getWarrantyDaysFromRepair(r));
      const remainingDays = getRemainingWarrantyDays(expiryDate);
      return {
        id: r.id,
        repairNumber: r.repairNumber || r.id,
        serialNumber: r.serialNumber,
        customer: r.customer?.fullName || `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim() || 'Unknown',
        device: r.deviceModel || r.deviceType || r.device || '-',
        createdAt: repairDate,
        expiryDate,
        remainingDays,
        warrantyStatus: getWarrantyBadgeStatus(remainingDays),
      };
    })
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

  // Pagination สำหรับคำขอที่รออนุมัติ
  const pendingApprovalTotalPages = Math.ceil(pendingClaims.length / ITEMS_PER_PAGE_PENDING);
  const pendingApprovalStartIndex = (pendingApprovalPage - 1) * ITEMS_PER_PAGE_PENDING;
  const pendingApprovalEndIndex = pendingApprovalStartIndex + ITEMS_PER_PAGE_PENDING;
  const paginatedPendingClaims = pendingClaims.slice(pendingApprovalStartIndex, pendingApprovalEndIndex);

  // Pagination สำหรับรายการรับประกัน
  const warrantyListTotalPages = Math.ceil(filteredClaims.length / ITEMS_PER_PAGE_WARRANTY);
  const warrantyListStartIndex = (warrantyListPage - 1) * ITEMS_PER_PAGE_WARRANTY;
  const warrantyListEndIndex = warrantyListStartIndex + ITEMS_PER_PAGE_WARRANTY;
  const paginatedFilteredClaims = filteredClaims.slice(warrantyListStartIndex, warrantyListEndIndex);

  // Reset pagination เมื่อ filter เปลี่ยน
  useEffect(() => {
    setPendingApprovalPage(1);
  }, [pendingClaims.length]);

  useEffect(() => {
    setWarrantyListPage(1);
  }, [searchQuery, statusFilter]);

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;

  // เลือกงานซ่อมจาก dropdown (เฉพาะที่รับเครื่องแล้ว / picked-up)
  const [selectedRepairId, setSelectedRepairId] = useState<string>("");
  const [newClaimReason, setNewClaimReason] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedRepairId("");
      setNewClaimReason("");
      setDialogStep("customer");
      setSelectedCustomerId("");
      setCustomerSearchTerm("");
    }
  }, [isDialogOpen]);

  /** หางานซ่อมที่เลือกจาก dropdown */
  const repairBySn = selectedRepairId
    ? allCompletedRepairs.find((r) => r.id === selectedRepairId)
    : null;
  const repairDateBySn = formatDate(
    repairBySn?.pickedUpDate ?? repairBySn?.completedDate ?? repairBySn?.dateOfReport ?? repairBySn?.createdAt
  );
  const expiryDateBySn = repairDateBySn ? getWarrantyExpiryDate(repairDateBySn, getWarrantyDaysFromRepair(repairBySn)) : "";
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {dialogStep === "customer" ? (
                    <>
                      <User className="w-5 h-5" />
                      {language === "th" ? "ขั้นตอนที่ 1: เลือกลูกค้า" : "Step 1: Select Customer"}
                    </>
                  ) : (
                    <>
                      <Wrench className="w-5 h-5" />
                      {language === "th" ? "ขั้นตอนที่ 2: เลือกงานซ่อม" : "Step 2: Select Repair"}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {dialogStep === "customer"
                    ? (language === "th"
                        ? "เลือกลูกค้าที่ต้องการสร้างเคลมการรับประกัน"
                        : "Select the customer to create a warranty claim")
                    : (language === "th"
                        ? "เลือกงานซ่อมที่รับเครื่องแล้วของลูกค้านี้"
                        : "Select a picked-up repair for this customer")}
                </DialogDescription>
              </DialogHeader>
              
              {dialogStep === "customer" ? (
                <div className="grid gap-4 py-4">
                  {/* Search Customer */}
                  <div className="grid gap-2">
                    <Label htmlFor="customerSearch" className="text-base font-semibold">
                      {language === "th" ? "ค้นหาลูกค้า" : "Search Customer"}
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="customerSearch"
                        placeholder={language === "th" ? "🔍 ค้นหาด้วยชื่อหรือ SN..." : "🔍 Search by name or SN..."}
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {loadingGlobalCompletedRepairs && (
                      <p className="text-xs text-muted-foreground">
                        {language === "th" ? "กำลังโหลดข้อมูล SN..." : "Loading SN data..."}
                      </p>
                    )}
                  </div>

                  {/* Customer List */}
                  <div className="border border-border rounded-lg max-h-[400px] overflow-y-auto">
                    {loadingCustomers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground">
                            {language === "th" ? "กำลังโหลด..." : "Loading..."}
                          </p>
                        </div>
                      </div>
                    ) : (() => {
                      const filteredCustomers = customers.filter((c) => {
                        if (!customerSearchTerm.trim()) return true;
                        const term = customerSearchTerm.toLowerCase();
                        const fullName = c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim();
                        const latestSn = (latestSnByCustomerId.get(c.id)?.sn ?? "").toLowerCase();
                        return (
                          fullName.toLowerCase().includes(term) ||
                          c.firstName?.toLowerCase().includes(term) ||
                          c.lastName?.toLowerCase().includes(term) ||
                          latestSn.includes(term) ||
                          c.phone?.includes(term)
                        );
                      });

                      if (filteredCustomers.length === 0) {
                        return (
                          <div className="py-8 text-center">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {language === "th" ? "ไม่พบลูกค้า" : "No customers found"}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="divide-y divide-border">
                          {filteredCustomers.map((customer) => {
                            const fullName = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
                            const latestSn = latestSnByCustomerId.get(customer.id)?.sn ?? "";
                            return (
                              <button
                                key={customer.id}
                                onClick={() => {
                                  setSelectedCustomerId(customer.id);
                                  setDialogStep("repair");
                                }}
                                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">{fullName}</p>
                                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                                      SN: {latestSn || "-"}
                                    </p>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  {/* Selected Customer Info */}
                  {(() => {
                    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
                    if (!selectedCustomer) return null;
                    const fullName = selectedCustomer.fullName || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim();
                    const latestSn = latestSnByCustomerId.get(selectedCustomerId)?.sn ?? "";
                    return (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{fullName}</p>
                            <p className="text-sm text-muted-foreground font-mono">SN: {latestSn || "-"}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDialogStep("customer");
                            setSelectedCustomerId("");
                            setSelectedRepairId("");
                          }}
                        >
                          {language === "th" ? "เปลี่ยน" : "Change"}
                        </Button>
                      </div>
                    );
                  })()}

                  {/* Repair List */}
                  <div className="grid gap-2">
                    <Label className="text-base font-semibold">
                      {language === "th" ? "เลือกงานซ่อม" : "Select Repair"}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="border border-border rounded-lg max-h-[400px] overflow-y-auto">
                      {loadingCompletedRepairs ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <p className="text-sm text-muted-foreground">
                              {language === "th" ? "กำลังโหลด..." : "Loading..."}
                            </p>
                          </div>
                        </div>
                      ) : completedRepairs.length === 0 ? (
                        <div className="py-8 text-center">
                          <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {language === "th" ? "ลูกค้านี้ยังไม่มีงานซ่อมที่รับเครื่องแล้ว" : "This customer has no picked-up repairs"}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {completedRepairs.map((repair) => {
                            const statusColor = 
                              repair.warrantyStatus === "valid" ? "text-emerald-600" :
                              repair.warrantyStatus === "expiring_soon" ? "text-amber-600" :
                              "text-red-600";
                            const statusIcon = 
                              repair.warrantyStatus === "valid" ? "✓" :
                              repair.warrantyStatus === "expiring_soon" ? "⚠" :
                              "✗";
                            const isSelected = selectedRepairId === repair.id;
                            return (
                              <button
                                key={repair.id}
                                onClick={() => setSelectedRepairId(repair.id)}
                                className={cn(
                                  "w-full p-4 text-left transition-colors",
                                  isSelected
                                    ? "bg-primary/10 border-l-4 border-l-primary"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-foreground">{repair.repairNumber}</span>
                                      {isSelected && (
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      📱 {repair.device}
                                      {repair.serialNumber && (
                                        <span className="ml-2 font-mono">· SN: {repair.serialNumber}</span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span>📅 {language === "th" ? "รับเครื่อง" : "Picked up"}: {repair.createdAt}</span>
                                      <span>⏰ {language === "th" ? "หมดอายุ" : "Expiry"}: {repair.expiryDate}</span>
                                    </div>
                                  </div>
                                  <span className={cn("text-xs font-medium px-2 py-1 rounded", statusColor, "bg-current/10")}>
                                    {statusIcon} {repair.remainingDays >= 0 
                                      ? `${repair.remainingDays} ${language === "th" ? "วัน" : "days"}`
                                      : language === "th" ? "หมดอายุ" : "Expired"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Repair Info */}
                  {repairBySn && (
                    <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-foreground">
                              {repairBySn.repairNumber || repairBySn.id}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-semibold",
                              getWarrantyBadgeStatus(remainingDaysBySn) === "valid"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : getWarrantyBadgeStatus(remainingDaysBySn) === "expiring_soon"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                  : "bg-red-500/20 text-red-700 dark:text-red-400"
                            )}>
                              {getWarrantyBadgeStatus(remainingDaysBySn) === "valid"
                                ? "✓ " + (language === "th" ? "ภายในประกัน" : "In warranty")
                                : getWarrantyBadgeStatus(remainingDaysBySn) === "expiring_soon"
                                  ? "⚠ " + (language === "th" ? "ใกล้หมด" : "Expiring soon")
                                  : "✗ " + (language === "th" ? "หมดอายุ" : "Expired")}
                            </span>
                          </div>
                          {(repairBySn.deviceModel || repairBySn.deviceType || repairBySn.device) && (
                            <p className="text-sm text-muted-foreground">
                              📱 {repairBySn.deviceModel || repairBySn.deviceType || repairBySn.device}
                              {repairBySn.serialNumber && (
                                <span className="ml-2 font-mono">· SN: {repairBySn.serialNumber}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            📅 {language === "th" ? "วันที่ซ่อม" : "Repair date"}
                          </p>
                          <p className="text-sm font-semibold text-foreground">{repairDateBySn}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            ⏰ {language === "th" ? "วันหมดประกัน" : "Expiry date"}
                          </p>
                          <p className="text-sm font-semibold text-foreground">{expiryDateBySn}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {remainingDaysBySn >= 0 ? "⏳" : "❌"} {language === "th" ? "วันคงเหลือ" : "Remaining days"}
                          </p>
                          <p className={cn(
                            "text-sm font-semibold",
                            remainingDaysBySn < 0
                              ? "text-red-600 dark:text-red-400"
                              : remainingDaysBySn <= 30
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {remainingDaysBySn < 0
                              ? (language === "th" ? "หมดอายุแล้ว" : "Expired")
                              : `${remainingDaysBySn} ${language === "th" ? "วัน" : "days"}`}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            📋 {language === "th" ? "จำนวนเคลมก่อนหน้า" : "Previous claims"}
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {previousClaimCountBySn} {language === "th" ? "ครั้ง" : "times"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claim Reason */}
                  <div className="grid gap-2">
                    <Label htmlFor="claimReason" className="text-base font-semibold">
                      {t("claimReason")}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Textarea
                      id="claimReason"
                      placeholder={t("describeIssue")}
                      value={newClaimReason}
                      onChange={(e) => setNewClaimReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                {dialogStep === "customer" ? (
                  <>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                      {t("cancel")}
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedCustomerId) {
                          setDialogStep("repair");
                        }
                      }}
                      disabled={!selectedCustomerId}
                      className="w-full sm:w-auto"
                    >
                      {language === "th" ? "ถัดไป" : "Next"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setDialogStep("customer");
                        setSelectedRepairId("");
                      }}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {language === "th" ? "กลับ" : "Back"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      {t("cancel")}
                    </Button>
                    <Button 
                      onClick={handleSubmitClaim} 
                      disabled={!canSubmitClaim || (repairBySn ? getRemainingWarrantyDays(expiryDateBySn) < 0 : true)}
                      className="w-full sm:w-auto"
                    >
                      {t("submitClaim")}
                    </Button>
                  </>
                )}
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
          <div className="overflow-x-auto min-w-full">
            <table className="data-table min-w-[900px]">
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
                {paginatedPendingClaims.map((claim) => {
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
                  const repairDate = formatDate(repair?.pickedUpDate ?? repair?.completedDate ?? repair?.dateOfReport ?? repair?.createdAt ?? claim.claimDate);
                  const expiryDate = repairDate ? getWarrantyExpiryDate(repairDate, getWarrantyDaysFromRepair(repair)) : "";
                  const remainingDays = expiryDate ? getRemainingWarrantyDays(expiryDate) : 0;
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
                      <td>{formatDate(claim.claimDate)}</td>
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
                            {language === "th" ? "เคลมเรียบร้อย" : "Approve"}
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
                            {language === "th" ? "ปฏิเสธเคลม" : "Reject"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pendingApprovalTotalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (pendingApprovalPage > 1) {
                          setPendingApprovalPage(pendingApprovalPage - 1);
                        }
                      }}
                      className={
                        pendingApprovalPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: pendingApprovalTotalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setPendingApprovalPage(page)}
                        isActive={pendingApprovalPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (pendingApprovalPage < pendingApprovalTotalPages) {
                          setPendingApprovalPage(pendingApprovalPage + 1);
                        }
                      }}
                      className={
                        pendingApprovalPage === pendingApprovalTotalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
          <>
            <div className="overflow-x-auto min-w-full">
              <table className="data-table min-w-[900px]">
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
                {paginatedFilteredClaims.map((claim) => {
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
                  const repairDate = formatDate(repair?.pickedUpDate ?? repair?.completedDate ?? repair?.dateOfReport ?? repair?.createdAt ?? claim.claimDate);
                  const expiryDate = repairDate ? getWarrantyExpiryDate(repairDate, getWarrantyDaysFromRepair(repair)) : "";
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
            {warrantyListTotalPages > 1 && (
              <div className="border-t border-border p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          if (warrantyListPage > 1) {
                            setWarrantyListPage(warrantyListPage - 1);
                          }
                        }}
                        className={
                          warrantyListPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: warrantyListTotalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setWarrantyListPage(page)}
                          isActive={warrantyListPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          if (warrantyListPage < warrantyListTotalPages) {
                            setWarrantyListPage(warrantyListPage + 1);
                          }
                        }}
                        className={
                          warrantyListPage === warrantyListTotalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
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
            const repairDate = formatDate(repair?.pickedUpDate ?? repair?.completedDate ?? repair?.dateOfReport ?? repair?.createdAt ?? selectedClaim.claimDate);
            const expiryDate = repairDate ? getWarrantyExpiryDate(repairDate, getWarrantyDaysFromRepair(repair)) : "";
            const remainingDays = expiryDate ? getRemainingWarrantyDays(expiryDate) : 0;
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
                {row(t("date"), formatDate(selectedClaim.claimDate))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Warranty;
