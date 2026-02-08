import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs, type RepairItem } from "@/contexts/RepairsContext";
import { useToast } from "@/hooks/use-toast";
import { Edit, Eye, Filter, MoreHorizontal, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
  "picked-up": "status-completed",
};

const Repairs = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { repairs, setRepairs } = useRepairs();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [editingStatus, setEditingStatus] = useState<
    "pending" | "in-progress" | "completed" | "cancelled" | "picked-up"
  >("pending");
  const [cancelReason, setCancelReason] = useState("");
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const managementUsers = [
    { id: "admin", name: "Admin", nameTh: "ผู้ดูแลระบบ" },
    { id: "tom", name: "Tom", nameTh: "ทอม" },
    { id: "anna", name: "Anna", nameTh: "แอนนา" },
  ];

  // เดิมเปิด Dialog — ตอนนี้ไปหน้าสร้างงานซ่อมเต็มหน้าแทน
  useEffect(() => {
    if (searchParams.get("openCreate") === "1") {
      navigate("/repairs/new", { replace: true });
    }
  }, [searchParams, navigate]);

  // ซิงค์ฟิลเตอร์สถานะจาก URL (?status=...) เมื่อมาจาก Sidebar คลังข้อมูล
  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ["all", "pending", "in-progress", "completed", "cancelled", "picked-up"].includes(status)) {
      setStatusFilter(status);
    }
  }, [searchParams.get("status")]);

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    "in-progress": t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
    "picked-up": t("pickedUp"),
  };

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.device.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (repair: RepairItem) => {
    setSelectedRepair(repair);
    setDetailOpen(true);
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

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("repairManagement")}</h1>
          <p className="page-description">{t("repairDescription")}</p>
        </div>
      </div>

      {/* Filters */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="in-progress">{t("inProgress")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
            <SelectItem value="picked-up">{t("pickedUp")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repairs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
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
                <th>{t("report")}</th>
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
                      <span className={`status-badge ${statusStyles[repair.status]}`}>
                        {statusLabels[repair.status]}
                      </span>
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
                            ? t("endOfDay")
                            : t("leaveDevice")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">–</span>
                      )}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleViewDetails(repair)}
                          >
                            <Eye className="w-4 h-4" />
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleEditOrder(repair)}
                          >
                            <Edit className="w-4 h-4" />
                            {t("editOrder")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repair detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          {selectedRepair && (
            <>
              <DialogHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <DialogTitle>
                    {language === "th"
                      ? "รายละเอียดคำสั่งซ่อม"
                      : "Repair details"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "th"
                      ? "ดูรายละเอียดคำสั่งซ่อมและสถานะการดำเนินการ"
                      : "View repair order information and status."}
                  </DialogDescription>
                </div>
                <div className=" shrink-0 text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("orderId")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedRepair.id}
                  </p>
                </div>
              </DialogHeader>

              <div className="grid gap-4 py-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("customer")}
                  </Label>
                  <p className="font-medium text-foreground">
                    {selectedRepair.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRepair.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("device")}
                  </Label>
                  <p className="font-medium text-foreground">
                    {selectedRepair.device}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "วันที่รับงาน" : "Created at"}
                    {": "}
                    {selectedRepair.createdAt}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("status")}
                  </Label>
                  <div>
                    <span
                      className={`status-badge ${
                        statusStyles[selectedRepair.status]
                      }`}
                    >
                      {statusLabels[selectedRepair.status]}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("technician")}
                  </Label>
                  <p className="font-medium text-foreground">
                    {selectedRepair.technician === "Unassigned"
                      ? language === "th"
                        ? selectedRepair.technicianTh ?? "ยังไม่มอบหมาย"
                        : "Unassigned"
                      : selectedRepair.technician}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("estCost")}
                  </Label>
                  <p className="font-medium text-foreground">
                    ฿{selectedRepair.estimatedCost.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("issue")}
                  </Label>
                  <p className="text-foreground">
                    {language === "th"
                      ? selectedRepair.issueTh
                      : selectedRepair.issue}
                  </p>
                </div>
                {selectedRepair.tag && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {t("tagLabel")}
                    </Label>
                    <span
                      className={
                        selectedRepair.tag === "endOfDay"
                          ? "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      }
                    >
                      {selectedRepair.tag === "endOfDay"
                        ? t("endOfDay")
                        : t("leaveDevice")}
                    </span>
                  </div>
                )}
              </div>
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

      {/* เลือกผู้ใช้และรหัสผ่านก่อนบันทึกสถานะ */}
      <Dialog open={confirmSaveOpen} onOpenChange={(open) => {
        setConfirmSaveOpen(open);
        if (!open) {
          setSelectedUserId("");
          setConfirmPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("confirmAccessTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmAccessDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("selectUserForManagement")}</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectUserForManagement")} />
                </SelectTrigger>
                <SelectContent>
                  {managementUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {language === "th" ? user.nameTh : user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={t("enterPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmSaveOpen(false);
                setSelectedUserId("");
                setConfirmPassword("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                if (editingRepair) {
                  setRepairs((prev) =>
                    prev.map((r) =>
                      r.id === editingRepair.id
                        ? { ...r, status: editingStatus }
                        : r
                    )
                  );
                }
                setConfirmSaveOpen(false);
                setEditOpen(false);
                setSelectedUserId("");
                setConfirmPassword("");
                toast({
                  title: language === "th" ? "แจ้งเตือน" : "Notice",
                  description: t("statusUpdateSuccess"),
                });
              }}
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
