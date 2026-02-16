import { MainLayout } from "@/components/layout/MainLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useRepairs, type RepairItem, type RepairTag } from "@/contexts/RepairsContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { repairItemToBillData, type RepairOrderData } from "@/types/repairOrder";
import { ChevronLeft, ChevronRight, Eye, FileText, Filter, Pencil, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
  "picked-up": "status-completed",
};

const RepairBillPreview = ({
  data,
  copyLabel,
  onChange,
}: {
  data: RepairOrderData;
  copyLabel: string;
  onChange: (patch: Partial<RepairOrderData>) => void;
}) => {
  const formatPrice = (value: string) => {
    const num = parseFloat(value);
    return Number.isNaN(num) ? "-" : `฿${num.toLocaleString()}`;
  };

  return (
    <div className="repair-bill-single bg-white border-2 border-gray-800 rounded-lg p-4 text-gray-900">
      <div className="flex justify-between items-start mb-3 text-xs">
        <div className="text-center">
          <p className="text-base font-extrabold tracking-tight leading-none">
            MacFix <span className="font-semibold">service</span>
          </p>
          <p className="text-xs font-semibold mt-1">โทร 084-615-2244</p>
          <p className="text-[10px] mt-0.5">
            456/105 ต.ตลาดขวา อ.เมือง จ.สุราษฎร์ธานี 84000
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-base font-bold leading-none">ใบรับซ่อม</p>
          <div className="flex flex-col items-end gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span>วันที่</span>
              <div className="border-b border-gray-500 min-w-[90px] text-[11px] text-right">
                {data.dateOfReport || "_____/_____/______"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>เวลาแจ้งซ่อม</span>
              <div className="border-b border-gray-500 min-w-[70px] text-[11px] text-right">
                {data.timeOfReport || "______"}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">({copyLabel})</p>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-3 mb-4" />

      <div className="text-xs space-y-3 mb-4">
        <div className="flex gap-4">
          <div className="flex-1 flex items-center gap-2">
            <span>ชื่อ</span>
            <div className="flex-1 border-b border-gray-400 min-h-[20px]">
              <input
                className="w-full text-[11px] leading-tight px-1 bg-transparent outline-none"
                value={data.customer}
                onChange={(e) => onChange({ customer: e.target.value })}
              />
            </div>
          </div>
          <div className="w-48 flex items-center gap-2">
            <span>เบอร์โทร</span>
            <div className="flex-1 border-b border-gray-400 min-h-[20px]">
              <input
                className="w-full text-[11px] leading-tight px-1 bg-transparent outline-none"
                value={data.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 flex items-center gap-2">
            <span>รุ่น</span>
            <div className="flex-1 border-b border-gray-400 min-h-[20px]">
              <input
                className="w-full text-[11px] leading-tight px-1 bg-transparent outline-none"
                value={data.model}
                onChange={(e) => onChange({ model: e.target.value })}
              />
            </div>
          </div>
          <div className="w-48 flex items-center gap-2">
            <span>สี</span>
            <div className="flex-1 border-b border-gray-400 min-h-[20px]">
              <input
                className="w-full text-[11px] leading-tight px-1 bg-transparent outline-none"
                value={data.color}
                onChange={(e) => onChange({ color: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 flex items-center gap-2">
            <span>หมายเลขเครื่อง (IMEI)</span>
            <div className="flex-1 border-b border-gray-400 min-h-[20px]" />
          </div>
          <div className="w-48 flex items-center gap-2">
            <span>รหัสล็อคหน้าจอ</span>
            <div className="flex-1 border-b border-gray-400 min-h-[20px]">
              <input
                className="w-full text-[11px] leading-tight px-1 bg-transparent outline-none"
                value={data.screenLockCode}
                onChange={(e) => onChange({ screenLockCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="pt-1">อาการเสีย</span>
          <div className="flex-1 border-b border-gray-400 min-h-[42px]">
            <textarea
              className="w-full text-[11px] leading-tight px-1 align-top inline-block bg-transparent outline-none resize-none"
              value={data.problemSymptoms}
              onChange={(e) =>
                onChange({ problemSymptoms: e.target.value })
              }
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <span className="text-xs">นัดรับเครื่อง</span>
          <div className="flex-1 border-b border-gray-400 min-h-[20px] text-[11px] px-1">
            {data.scheduledPickupTime
              ? (() => {
                  try {
                    const d = new Date(data.scheduledPickupTime);
                    return Number.isNaN(d.getTime())
                      ? data.scheduledPickupTime
                      : d.toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        });
                  } catch {
                    return data.scheduledPickupTime;
                  }
                })()
              : "—"}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <span>ประเมินราคา</span>
          <div className="w-32 border-b border-gray-400 min-h-[20px]">
            <input
              className="w-full text-[11px] leading-tight px-1 bg-transparent outline-none"
              value={data.estimatedPrice}
              onChange={(e) =>
                onChange({
                  estimatedPrice: e.target.value,
                  repairSummaryPrice: e.target.value,
                })
              }
            />
          </div>
          <span>บาท</span>
        </div>
      </div>

      <div className="mt-2 mb-3">
        <div className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 inline-block rounded-t-sm">
          สรุปราคาซ่อม
        </div>
        <div className="border border-gray-800 border-t-0 rounded-b-sm p-2 text-xs">
          <div className="flex justify-between border-t border-gray-500 pt-1 mt-1 font-semibold">
            <span>รวมทั้งสิ้น (บาท)</span>
            <span>
              {data.repairSummaryPrice
                ? formatPrice(data.repairSummaryPrice)
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 border border-gray-800 rounded-sm text-[10px]">
        <div className="bg-gray-200 border-b border-gray-800 px-2 py-1 font-semibold">
          เงื่อนไขในการซ่อม
        </div>
        <div className="p-2 space-y-1.5 leading-relaxed">
          <p>1. โปรดตรวจสอบรายการซ่อมให้ชัดเจนก่อนลงนามในเอกสารการซ่อม</p>
          <p>
            2. แจ้งผลการซ่อมภายใน 30 วัน นับจากวันที่แจ้งลูกค้า หากเกินกำหนดถือว่าสละสิทธิ์การรับประกัน
          </p>
          <p>
            3. เครื่องที่เดินทางมารับเกิน 30 วัน บริษัทขอคิดค่าฝากเครื่องตามอัตราที่กำหนด
          </p>
          <p>
            4. ความเสียหายจากการตก กระแทก เปียกน้ำ หรือการซ่อมแซมจากที่อื่น ไม่อยู่ในเงื่อนไขการรับประกัน
          </p>
          <p>
            5. การรับประกันไม่ครอบคลุมข้อมูลภายในเครื่อง ลูกค้าควรสำรองข้อมูลก่อนส่งซ่อมทุกครั้ง
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-[10px]">
        <div className="w-1/3 text-center">
          <div className="border-b border-gray-500 mb-1" />
          <p>ลูกค้า</p>
        </div>
        <div className="w-1/3 text-center">
          <div className="border-b border-gray-500 mb-1" />
          <p>ผู้รับซ่อม</p>
        </div>
      </div>
    </div>
  );
};

const Repairs = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { repairs, setRepairs, refreshRepairs, isLoading, pagination, setPagination } = useRepairs();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<"all" | "endOfDay" | "leaveDevice">("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);
  const [detailOrder, setDetailOrder] = useState<RepairOrderData | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [detailTag, setDetailTag] = useState<RepairTag | "">("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [editingStatus, setEditingStatus] = useState<
    "pending" | "in-progress" | "completed" | "cancelled" | "picked-up"
  >("pending");
  const [cancelReason, setCancelReason] = useState("");
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  // เปลี่ยนสถานะจากตารางโดยตรง (ไม่ผ่าน Edit dialog)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    repair: RepairItem;
    newStatus: "pending" | "in-progress" | "completed" | "cancelled" | "picked-up";
  } | null>(null);
  const [cancelReasonOpen, setCancelReasonOpen] = useState(false);
  const { toast } = useToast();

  // เดิมเปิด Dialog — ตอนนี้ไปหน้าสร้างงานซ่อมเต็มหน้าแทน
  useEffect(() => {
    if (searchParams.get("openCreate") === "1") {
      navigate("/repairs/new", { replace: true });
    }
  }, [searchParams, navigate]);

  // ซิงค์ฟิลเตอร์สถานะจาก URL (?status=...) เมื่อมาจาก Sidebar — ถ้าไม่มี query หรือไม่ตรงค่าที่รองรับ ให้แสดงทั้งหมด (หน้าสถานะงานซ่อม)
  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ["all", "pending", "in-progress", "completed", "cancelled", "picked-up"].includes(status)) {
      setStatusFilter(status);
    } else {
      setStatusFilter("all");
    }
  }, [searchParams.get("status")]);

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    "in-progress": t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
    "picked-up": t("pickedUp"),
  };

  // Filter repairs for display (client-side filtering for search/filter)
  // Note: For better performance with large datasets, filtering should be done on the backend
  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.device.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || repair.status === statusFilter;
    const matchesTag =
      tagFilter === "all" || repair.tag === tagFilter;
    return matchesSearch && matchesStatus && matchesTag;
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      refreshRepairs(newPage, pagination.limit);
    }
  };

  // ซิงค์ selectedRepair กับ repairs เมื่อเปลี่ยนสถานะจาก dropdown ในตาราง (ให้ Dialog แสดงสถานะล่าสุด)
  useEffect(() => {
    if (detailOpen && selectedRepair) {
      const updated = repairs.find((r) => r.id === selectedRepair.id);
      if (updated && updated.status !== selectedRepair.status) {
        setSelectedRepair(updated);
      }
    }
  }, [detailOpen, repairs, selectedRepair?.id]);

  const handleViewDetails = (repair: RepairItem) => {
    const orderData = repairItemToBillData(repair, language === "th" ? "th" : "en");
    setSelectedRepair(repair);
    setDetailOrder(orderData);
    setDetailTag(repair.tag ?? "");
    setIsDetailEditing(false);
    setDetailOpen(true);
  };

  const handleSaveDetail = () => {
    if (!selectedRepair || !detailOrder) return;
    setRepairs((prev) =>
      prev.map((r) =>
        r.id === selectedRepair.id
          ? {
              ...r,
              customer: detailOrder.customer,
              phone: detailOrder.phone,
              device: detailOrder.model,
              issue: detailOrder.problemSymptoms,
              issueTh: detailOrder.problemSymptoms,
              estimatedCost: Number(detailOrder.estimatedPrice || r.estimatedCost),
              tag: detailTag === "" ? undefined : (detailTag as RepairTag),
            }
          : r
      )
    );
    setSelectedRepair((prev) =>
      prev
        ? {
            ...prev,
            customer: detailOrder.customer,
            phone: detailOrder.phone,
            device: detailOrder.model,
            issue: detailOrder.problemSymptoms,
            issueTh: detailOrder.problemSymptoms,
            estimatedCost: Number(detailOrder.estimatedPrice || prev.estimatedCost),
            tag: detailTag === "" ? undefined : (detailTag as RepairTag),
          }
        : null
    );
    setIsDetailEditing(false);
    toast({
      title: language === "th" ? "บันทึกสำเร็จ" : "Saved",
      description: language === "th" ? "อัปเดตรายละเอียดงานซ่อมแล้ว" : "Repair details have been updated.",
    });
  };


  const handleEditOrder = (repair: RepairItem) => {
    setEditingRepair(repair);
    setEditingStatus(
      (repair.status as
        | "pending"
        | "in-progress"
        | "completed"
        | "cancelled"
        | "picked-up") ?? "pending"
    );
    setCancelReason("");
    setEditOpen(true);
  };

  // เปลี่ยนสถานะจาก dropdown ในตาราง
  const handleQuickStatusChange = (
    repair: RepairItem,
    newStatus: "pending" | "in-progress" | "completed" | "cancelled" | "picked-up"
  ) => {
    if (repair.status === newStatus) return;
    setPendingStatusChange({ repair, newStatus });
    setCancelReason("");
    if (newStatus === "cancelled") {
      setCancelReasonOpen(true);
    } else {
      setConfirmSaveOpen(true);
    }
  };

  const applyStatusUpdate = async () => {
    // ตรวจสอบว่ามีผู้ใช้ล็อกอินอยู่
    if (!currentUser) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first",
        variant: "destructive",
      });
      setConfirmSaveOpen(false);
      return;
    }

    // ตรวจสอบรหัสผ่าน
    if (!confirmPassword) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "กรุณากรอกรหัสผ่าน" : "Please enter password",
        variant: "destructive",
      });
      return;
    }

    // ดึงข้อมูลผู้ใช้จาก localStorage เพื่อหา email
    const storedUser = localStorage.getItem('user');
    let userEmail = '';
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        userEmail = userData.email || currentUser.username;
      } catch {
        userEmail = currentUser.username;
      }
    } else {
      userEmail = currentUser.username;
    }

    // ตรวจสอบรหัสผ่านผ่าน API
    try {
      const loginResponse = await apiClient.login(userEmail, confirmPassword);
      
      if (loginResponse.status !== 'success') {
        toast({
          title: language === "th" ? "รหัสผ่านไม่ถูกต้อง" : "Invalid password",
          description: language === "th" 
            ? "รหัสผ่านที่กรอกไม่ถูกต้อง" 
            : "The password you entered is incorrect",
          variant: "destructive",
        });
        setConfirmPassword("");
        return;
      }
    } catch (error) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" 
          ? "ไม่สามารถตรวจสอบรหัสผ่านได้" 
          : "Unable to verify password",
        variant: "destructive",
      });
      setConfirmPassword("");
      return;
    }

    // อัปเดตสถานะลง database
    const repairToUpdate = editingRepair || pendingStatusChange?.repair;
    const newStatus = editingRepair ? editingStatus : pendingStatusChange?.newStatus;
    
    if (repairToUpdate && newStatus) {
      try {
        // เรียก API เพื่ออัปเดตสถานะลง database
        const updateResponse = await apiClient.updateRepair(repairToUpdate.id, {
          status: newStatus,
        });

        if (updateResponse.status === 'success') {
          // อัปเดตสถานะใน state ชั่วคราว
          setRepairs((prev) =>
            prev.map((r) =>
              r.id === repairToUpdate.id ? { ...r, status: newStatus } : r
            )
          );
          
          // Refresh ข้อมูลจาก database
          await refreshRepairs();
          
          toast({
            title: language === "th" ? "อัปเดตสำเร็จ" : "Update successful",
            description: t("statusUpdateSuccess"),
          });
        } else {
          const errorMsg = updateResponse.message || updateResponse.error || 'Failed to update status';
          console.error('Update repair API error:', updateResponse);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('Error updating repair status:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : (language === "th" 
            ? "ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง" 
            : "Failed to update status. Please try again.");
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    }
    
    setConfirmSaveOpen(false);
    setEditOpen(false);
    setEditingRepair(null);
    setPendingStatusChange(null);
    setCancelReason("");
    setConfirmPassword("");
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("status");
    else next.set("status", value);
    setSearchParams(next);
  };

  const handleTagFilterChange = (value: "all" | "endOfDay" | "leaveDevice") => {
    setTagFilter(value);
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("repairManagement")}</h1>
          <p className="page-description">{t("repairDescription")}</p>
        </div>
      </div>

      {/* ค้นหา + dropdown กรองสถานะ (มีสีตามสถานะ) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchByIdCustomerDevice")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger
            className={`w-[200px] ${
              statusFilter === "all"
                ? ""
                : `status-badge border-0 ${statusStyles[statusFilter]}`
            }`}
          >
            <Filter className="w-4 h-4 mr-2 shrink-0" />
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                {t("allStatus")}
              </span>
            </SelectItem>
            <SelectItem value="pending">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-pending))]" />
                {t("pending")}
              </span>
            </SelectItem>
            <SelectItem value="in-progress">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-in-progress))]" />
                {t("inProgress")}
              </span>
            </SelectItem>
            <SelectItem value="completed">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-completed))]" />
                {t("completed")}
              </span>
            </SelectItem>
            <SelectItem value="picked-up">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-completed))]" />
                {t("pickedUp")}
              </span>
            </SelectItem>
            <SelectItem value="cancelled">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-cancelled))]" />
                {t("cancelled")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={handleTagFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("tagLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {language === "th" ? "ทุกแท็ก" : "All tags"}
            </SelectItem>
            <SelectItem value="endOfDay">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {t("addQuickData")}
              </span>
            </SelectItem>
            <SelectItem value="leaveDevice">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {t("addRepairData")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repairs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}</p>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{language === "th" ? "ไม่มีข้อมูลงานซ่อม" : "No repairs found"}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("orderId")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("device")}</th>
                  <th>{t("issue")}</th>
                  <th>{t("estCost")}</th>
                  <th>{t("status")}</th>
                  <th>{t("tagLabel")}</th>
                  <th>{t("viewDetails")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id}>
                    <td className="font-medium text-foreground">{repair.id}</td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{repair.customer}</p>
                        <p className="text-xs text-muted-foreground">{repair.phone}</p>
                      </div>
                    </td>
                    <td>{repair.device}</td>
                    <td>{language === "th" ? repair.issueTh : repair.issue}</td>
                    <td>฿{repair.estimatedCost.toLocaleString()}</td>
                    <td>
                      <Select
                        value={repair.status}
                        onValueChange={(value) =>
                          handleQuickStatusChange(repair, value as "pending" | "in-progress" | "completed" | "cancelled" | "picked-up")
                        }
                      >
                        <SelectTrigger
                          className={`w-[140px] status-badge border-0 bg-transparent shadow-none hover:opacity-90 h-8 font-medium ${statusStyles[repair.status]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            {t("pending")}
                          </SelectItem>
                          <SelectItem value="in-progress">
                            {language === "th" ? "กำลังซ่อม" : t("inProgress")}
                          </SelectItem>
                          <SelectItem value="completed">
                            {language === "th" ? "ซ่อมเสร็จแล้ว" : t("completed")}
                          </SelectItem>
                          <SelectItem value="picked-up">
                            {language === "th" ? "รับเครื่องแล้ว" : t("pickedUp")}
                          </SelectItem>
                          <SelectItem value="cancelled">
                            {language === "th" ? "ยกเลิกงานซ่อม" : t("cancelled")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      {repair.tag ? (
                        <span
                          className={
                            repair.tag === "endOfDay"
                              ? "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          }
                        >
                          {repair.tag === "endOfDay"
                            ? t("addQuickData")
                            : t("addRepairData")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">–</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(repair)}
                        aria-label={t("viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {language === "th" 
                ? `แสดง ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalCount)} จาก ${pagination.totalCount} รายการ`
                : `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalCount)} of ${pagination.totalCount} items`}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => {
                      if (pagination.page > 1) {
                        handlePageChange(pagination.page - 1);
                      }
                    }}
                    disabled={pagination.page <= 1}
                    className="gap-1 pl-2.5"
                    aria-label={language === "th" ? "หน้าก่อนหน้า" : "Go to previous page"}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{language === "th" ? "ก่อนหน้า" : "Previous"}</span>
                  </Button>
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <Button
                          variant={pageNum === pagination.page ? "outline" : "ghost"}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-9 w-9"
                          aria-current={pageNum === pagination.page ? "page" : undefined}
                        >
                          {pageNum}
                        </Button>
                      </PaginationItem>
                    );
                  } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => {
                      if (pagination.page < pagination.totalPages) {
                        handlePageChange(pagination.page + 1);
                      }
                    }}
                    disabled={pagination.page >= pagination.totalPages}
                    className="gap-1 pr-2.5"
                    aria-label={language === "th" ? "หน้าถัดไป" : "Go to next page"}
                  >
                    <span>{language === "th" ? "ถัดไป" : "Next"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* รายละเอียดงานซ่อม — ดู / แก้ไข / ลบ ได้ */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedRepair(null);
            setDetailOrder(null);
            setIsDetailEditing(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedRepair && detailOrder && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-start justify-between gap-4 border-b border-border">
                <div className="space-y-1">
                  <DialogTitle className="text-xl">
                    {language === "th" ? "รายละเอียดงานซ่อม" : "Repair details"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "th"
                      ? "ดู หรือแก้ไขรายการงานซ่อม"
                      : "View or edit this repair order."}
                  </DialogDescription>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0">
                  {selectedRepair.id}
                </span>
              </DialogHeader>

              <div className="px-6 py-4 space-y-4">
                {/* เลขที่คำสั่ง (read-only) */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{t("orderId")}</Label>
                  <span className="text-sm text-foreground">{selectedRepair.id}</span>
                </div>

                {/* IMEI / Serial Number (read-only) */}
                {selectedRepair.serialNumber && (
                  <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                    <Label className="text-sm text-muted-foreground">
                      {language === "th" ? "IMEI / SN" : "IMEI / Serial"}
                    </Label>
                    <span className="text-sm text-foreground font-mono">{selectedRepair.serialNumber}</span>
                  </div>
                )}

                {/* ลูกค้า */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{t("customer")}</Label>
                  {isDetailEditing ? (
                    <Input
                      value={detailOrder.customer}
                      onChange={(e) => setDetailOrder((p) => (p ? { ...p, customer: e.target.value } : p))}
                      className="h-9"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{detailOrder.customer}</span>
                  )}
                </div>

                {/* เบอร์โทร */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{language === "th" ? "เบอร์โทร" : "Phone"}</Label>
                  {isDetailEditing ? (
                    <Input
                      value={detailOrder.phone}
                      onChange={(e) => setDetailOrder((p) => (p ? { ...p, phone: e.target.value } : p))}
                      className="h-9"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{detailOrder.phone}</span>
                  )}
                </div>

                {/* อุปกรณ์ */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{t("device")}</Label>
                  {isDetailEditing ? (
                    <Input
                      value={detailOrder.model}
                      onChange={(e) => setDetailOrder((p) => (p ? { ...p, model: e.target.value } : p))}
                      className="h-9"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{detailOrder.model}</span>
                  )}
                </div>

                {/* ปัญหา */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                  <Label className="text-sm text-muted-foreground pt-2">{t("issue")}</Label>
                  {isDetailEditing ? (
                    <Textarea
                      value={detailOrder.problemSymptoms}
                      onChange={(e) => setDetailOrder((p) => (p ? { ...p, problemSymptoms: e.target.value } : p))}
                      rows={2}
                      className="resize-none"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{detailOrder.problemSymptoms}</span>
                  )}
                </div>

                {/* ราคาประมาณ */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{language === "th" ? "ราคาประมาณ" : "Est. price"}</Label>
                  {isDetailEditing ? (
                    <Input
                      type="number"
                      value={detailOrder.estimatedPrice || ""}
                      onChange={(e) => setDetailOrder((p) => (p ? { ...p, estimatedPrice: e.target.value } : p))}
                      className="h-9"
                    />
                  ) : (
                    <span className="text-sm text-foreground">
                      ฿{Number(detailOrder.estimatedPrice || 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* สถานะ — แสดงอย่างเดียว แก้ไขจาก dropdown ในคอลัมน์ตาราง */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{t("status")}</Label>
                  <span className={`status-badge ${statusStyles[selectedRepair.status]}`}>
                    {selectedRepair.status === "in-progress"
                      ? (language === "th" ? "กำลังซ่อม" : t("inProgress"))
                      : selectedRepair.status === "completed"
                        ? (language === "th" ? "ซ่อมเสร็จแล้ว" : t("completed"))
                        : selectedRepair.status === "picked-up"
                          ? (language === "th" ? "รับเครื่องแล้ว" : t("pickedUp"))
                          : selectedRepair.status === "cancelled"
                            ? (language === "th" ? "ยกเลิกงานซ่อม" : t("cancelled"))
                            : t("pending")}
                  </span>
                </div>

                {/* แท็ก */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{language === "th" ? "แท็ก" : "Tag"}</Label>
                  {isDetailEditing ? (
                    <Select value={detailTag || "none"} onValueChange={(v) => setDetailTag(v === "none" ? "" : (v as RepairTag))}>
                      <SelectTrigger className="w-full max-w-[240px] h-9">
                        <SelectValue placeholder={language === "th" ? "ทุกแท็ก" : "All tags"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">–</SelectItem>
                        <SelectItem value="endOfDay">{language === "th" ? "รับซ่อมหน้าร้าน" : "Walk-in"}</SelectItem>
                        <SelectItem value="leaveDevice">{language === "th" ? "รับซ่อมฝากเครื่อง" : "Drop-off"}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-foreground">
                      {detailTag === "endOfDay"
                        ? (language === "th" ? "รับซ่อมหน้าร้าน" : "Walk-in")
                        : detailTag === "leaveDevice"
                          ? (language === "th" ? "รับซ่อมฝากเครื่อง" : "Drop-off")
                          : "–"}
                    </span>
                  )}
                </div>

                {/* วันที่ */}
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <Label className="text-sm text-muted-foreground">{t("date")}</Label>
                  <span className="text-sm text-foreground">{selectedRepair.createdAt}</span>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-border flex flex-row flex-wrap items-center justify-between gap-3">
                {isDetailEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsDetailEditing(false)} className="gap-2">
                      <X className="w-4 h-4" />
                      {language === "th" ? "ไม่บันทึก" : "Discard"}
                    </Button>
                    <Button onClick={handleSaveDetail} className="gap-2 min-w-[100px]">
                      <Pencil className="w-4 h-4" />
                      {language === "th" ? "บันทึก" : "Save"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setDetailOpen(false)} className="gap-2 text-muted-foreground">
                      {language === "th" ? "ปิด" : "Close"}
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setIsDetailEditing(true)} className="gap-2">
                        <Pencil className="w-4 h-4" />
                        {language === "th" ? "แก้ไข" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setDetailOpen(false);
                          navigate("/repairs/bill", { state: { highlightRepairId: selectedRepair.id } });
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        {language === "th" ? "ไปออกบิล" : "Issue bill"}
                      </Button>
                    </div>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* Edit repair status dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          {editingRepair && (
            <>
              <DialogHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <DialogTitle>
                    {language === "th"
                      ? "แก้ไขสถานะการซ่อม"
                      : "Edit repair status"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "th"
                      ? "ปรับปรุงสถานะงานซ่อมโดยตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก"
                      : "Update repair status after reviewing order details."}
                  </DialogDescription>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("orderId")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {editingRepair.id}
                  </p>
                </div>
              </DialogHeader>

              <div className="grid gap-4 py-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("customer")}
                  </Label>
                  <p className="font-medium text-foreground">
                    {editingRepair.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {editingRepair.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("device")}
                  </Label>
                  <p className="font-medium text-foreground">
                    {editingRepair.device}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "ราคาประมาณ" : "Estimated cost"}{" "}
                    ฿{editingRepair.estimatedCost.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("issue")}
                  </Label>
                  <p className="text-foreground">
                    {language === "th"
                      ? editingRepair.issueTh
                      : editingRepair.issue}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === "th" ? "สถานะปัจจุบัน" : t("status")}
                  </Label>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`status-badge ${
                        statusStyles[editingStatus]
                      }`}
                    >
                      {editingStatus === "in-progress"
                        ? (language === "th" ? "กำลังซ่อม" : t("inProgress"))
                        : editingStatus === "completed"
                        ? language === "th"
                          ? "ซ่อมเสร็จแล้ว"
                          : t("completed")
                        : editingStatus === "picked-up"
                        ? language === "th"
                          ? "รับเครื่องแล้ว"
                          : t("pickedUp")
                        : editingStatus === "cancelled"
                        ? language === "th"
                          ? "ยกเลิกงานซ่อม"
                          : t("cancelled")
                        : t("pending")}
                    </span>
                    <Select
                      value={editingStatus}
                      onValueChange={(value) =>
                        setEditingStatus(
                          value as
                            | "pending"
                            | "in-progress"
                            | "completed"
                            | "cancelled"
                            | "picked-up"
                        )
                      }
                    >
                      <SelectTrigger className="w-[260px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          {t("pending")}
                        </SelectItem>
                        <SelectItem value="in-progress">
                          {language === "th"
                            ? "กำลังซ่อม"
                            : t("inProgress")}
                        </SelectItem>
                        <SelectItem value="completed">
                          {language === "th"
                            ? "ซ่อมเสร็จแล้ว"
                            : t("completed")}
                        </SelectItem>
                        <SelectItem value="picked-up">
                          {language === "th"
                            ? "รับเครื่องแล้ว"
                            : t("pickedUp")}
                        </SelectItem>
                        <SelectItem value="cancelled">
                          {language === "th"
                            ? "ยกเลิกงานซ่อม"
                            : t("cancelled")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editingStatus === "cancelled" && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {t("cancelReason")}
                    </Label>
                    <Textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder={t("enterCancelReason")}
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={() => setConfirmSaveOpen(true)}
                >
                  {language === "th" ? "บันทึก" : "Save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* กรอกเหตุผลเมื่อเลือกสถานะ "ยกเลิก" จากตาราง */}
      <Dialog
        open={cancelReasonOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelReasonOpen(false);
            setPendingStatusChange(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "เหตุผลการยกเลิก (ถ้ามี)" : "Cancel reason (optional)"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "กรอกเหตุผลแล้วกดถัดไป เพื่อยืนยันการเปลี่ยนสถานะ"
                : "Enter reason then click Next to confirm status change."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("enterCancelReason")}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelReasonOpen(false);
                setPendingStatusChange(null);
                setCancelReason("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                setCancelReasonOpen(false);
                setConfirmSaveOpen(true);
              }}
            >
              {language === "th" ? "ถัดไป" : "Next"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ยืนยันรหัสผ่านก่อนบันทึกสถานะ */}
      <Dialog open={confirmSaveOpen} onOpenChange={(open) => {
        setConfirmSaveOpen(open);
        if (!open) {
          setConfirmPassword("");
          if (!editingRepair) setPendingStatusChange(null);
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{language === "th" ? "ยืนยันการอัปเดตสถานะ" : "Confirm Status Update"}</DialogTitle>
            <DialogDescription>
              {language === "th" 
                ? "กรอกรหัสผ่านเพื่อยืนยันการอัปเดตสถานะการซ่อม"
                : "Enter your password to confirm the repair status update"}
              {pendingStatusChange && (
                <span className="mt-2 block font-medium text-foreground">
                  {language === "th" ? "คำสั่งซ่อม " : "Order "}
                  {pendingStatusChange.repair.id}
                  {" → "}
                  {statusLabels[pendingStatusChange.newStatus]}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={language === "th" ? "กรอกรหัสผ่านที่ใช้เข้าสู่ระบบ" : "Enter your login password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyStatusUpdate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmSaveOpen(false);
                setConfirmPassword("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={applyStatusUpdate}
              disabled={!confirmPassword}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Repairs;
