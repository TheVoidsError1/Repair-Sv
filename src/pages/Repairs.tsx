import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { Edit, Eye, Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RepairOrderData } from "./RepairBill";

const repairs = [
  {
    id: "REP-001",
    customer: "John Doe",
    phone: "081-234-5678",
    device: "iPhone 14 Pro",
    issue: "Screen Replacement",
    issueTh: "เปลี่ยนหน้าจอ",
    status: "in-progress",
    technician: "Tom",
    createdAt: "2024-01-15",
    estimatedCost: 4500,
  },
  {
    id: "REP-002",
    customer: "Jane Smith",
    phone: "082-345-6789",
    device: "Samsung Galaxy S23",
    issue: "Battery Replacement",
    issueTh: "เปลี่ยนแบตเตอรี่",
    status: "pending",
    technician: "Unassigned",
    technicianTh: "ยังไม่มอบหมาย",
    createdAt: "2024-01-15",
    estimatedCost: 1200,
  },
  {
    id: "REP-003",
    customer: "Mike Johnson",
    phone: "083-456-7890",
    device: "Google Pixel 7",
    issue: "Water Damage Repair",
    issueTh: "ซ่อมเสียหายจากน้ำ",
    status: "completed",
    technician: "Anna",
    createdAt: "2024-01-14",
    estimatedCost: 3200,
  },
  {
    id: "REP-004",
    customer: "Sarah Williams",
    phone: "084-567-8901",
    device: "iPhone 13",
    issue: "Back Glass Repair",
    issueTh: "ซ่อมกระจกหลัง",
    status: "completed",
    technician: "Tom",
    createdAt: "2024-01-14",
    estimatedCost: 2800,
  },
  {
    id: "REP-005",
    customer: "David Brown",
    phone: "085-678-9012",
    device: "OnePlus 11",
    issue: "Charging Port Replacement",
    issueTh: "เปลี่ยนพอร์ตชาร์จ",
    status: "cancelled",
    technician: "Anna",
    createdAt: "2024-01-13",
    estimatedCost: 800,
  },
  {
    id: "REP-006",
    customer: "Emily Chen",
    phone: "086-789-0123",
    device: "iPhone 15 Pro Max",
    issue: "Speaker Not Working",
    issueTh: "ลำโพงไม่ทำงาน",
    status: "pending",
    technician: "Unassigned",
    technicianTh: "ยังไม่มอบหมาย",
    createdAt: "2024-01-15",
    estimatedCost: 1500,
  },
];

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
  "picked-up": "status-completed",
};

const initialFormData = {
  customer: "",
  phone: "",
  model: "",
  color: "",
  screenLockCode: "",
  problemSymptoms: "",
  deposit: "",
  estimatedPrice: "",
  repairSummaryPrice: "",
};

const Repairs = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] =
    useState<(typeof repairs)[number] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRepair, setEditingRepair] =
    useState<(typeof repairs)[number] | null>(null);
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrder = () => {
    const orderData: RepairOrderData = {
      ...formData,
      dateOfReport: new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
    setIsDialogOpen(false);
    setFormData(initialFormData);
    navigate("/repairs/bill", { state: orderData });
  };

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

  const handleViewDetails = (repair: (typeof repairs)[number]) => {
    setSelectedRepair(repair);
    setDetailOpen(true);
  };

  const handleEditOrder = (repair: (typeof repairs)[number]) => {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("repairManagement")}</h1>
            <p className="page-description">{t("repairDescription")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("newRepairOrder")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <DialogTitle>{t("createNewRepairOrder")}</DialogTitle>
                  <DialogDescription>{t("enterCustomerDeviceDetails")}</DialogDescription>
                </div>
                <div className=" shrink-0 text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("dateOfRepairReport")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer">{t("customerName")}</Label>
                  <Input
                    id="customer"
                    placeholder={t("enterCustomerName")}
                    value={formData.customer}
                    onChange={(e) => handleInputChange("customer", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("phoneNumber")}</Label>
                  <Input
                    id="phone"
                    placeholder={t("enterPhoneNumber")}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">{t("model")}</Label>
                  <Input
                    id="model"
                    placeholder={t("enterModel")}
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">{t("color")}</Label>
                  <Input
                    id="color"
                    placeholder={t("enterColor")}
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="screenLockCode">{t("screenLockCode")}</Label>
                  <Input
                    id="screenLockCode"
                    placeholder={t("enterScreenLockCode")}
                    value={formData.screenLockCode}
                    onChange={(e) => handleInputChange("screenLockCode", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="issue">{t("problemSymptoms")}</Label>
                  <Textarea
                    id="issue"
                    placeholder={t("enterProblemSymptoms")}
                    className="min-h-[80px]"
                    value={formData.problemSymptoms}
                    onChange={(e) => handleInputChange("problemSymptoms", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deposit">{t("deposit")}</Label>
                  <Input
                    id="deposit"
                    type="number"
                    placeholder={t("enterDeposit")}
                    value={formData.deposit}
                    onChange={(e) => handleInputChange("deposit", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedPrice">{t("estimatedPriceBaht")}</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    placeholder={t("enterEstimatedPrice")}
                    value={formData.estimatedPrice}
                    onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="repairSummaryPrice">{t("repairSummaryPrice")}</Label>
                  <Input
                    id="repairSummaryPrice"
                    type="number"
                    placeholder={t("enterRepairSummaryPrice")}
                    value={formData.repairSummaryPrice}
                    onChange={(e) => handleInputChange("repairSummaryPrice", e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleCreateOrder}>
                  {t("createOrder")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <th>{t("technician")}</th>
                <th>{t("estCost")}</th>
                <th>{t("status")}</th>
                <th>{t("actions")}</th>
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
                    <td>
                      {repair.technician === "Unassigned"
                        ? language === "th" ? "ยังไม่มอบหมาย" : repair.technician
                        : repair.technician}
                    </td>
                    <td>฿{repair.estimatedCost.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${statusStyles[repair.status]}`}>
                        {statusLabels[repair.status]}
                      </span>
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
