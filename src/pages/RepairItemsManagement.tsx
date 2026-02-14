import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Edit, Trash2, Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  "waiting_parts": "status-pending",
  completed: "status-completed",
  cancelled: "status-cancelled",
  "picked-up": "status-completed",
};

const statusLabels: Record<string, { th: string; en: string }> = {
  pending: { th: "รอดำเนินการ", en: "Pending" },
  "in-progress": { th: "กำลังซ่อม", en: "In Progress" },
  "waiting_parts": { th: "รออะไหล่", en: "Waiting Parts" },
  completed: { th: "เสร็จสิ้น", en: "Completed" },
  cancelled: { th: "ยกเลิก", en: "Cancelled" },
  "picked-up": { th: "รับเครื่องแล้ว", en: "Picked Up" },
};

interface RepairItem {
  id: string;
  repairNumber: string;
  customer?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceSerialNumber?: string;
  serialNumber?: string;
  deviceColor?: string;
  screenLockCode?: string;
  problemDescription?: string;
  problemSymptoms?: string;
  diagnosis?: string;
  repairNotes?: string;
  status: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  deposit?: number;
  estimatedPrice?: number;
  repairSummaryPrice?: number;
  serviceType?: string;
  receiveDate?: string;
  receiveTime?: string;
  scheduledPickupTime?: string;
  dateOfReport?: string;
  timeOfReport?: string;
  createdAt: string;
  updatedAt: string;
}

const RepairItemsManagement = () => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isTh = language === "th";

  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<RepairItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRepair, setDeletingRepair] = useState<RepairItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multiple selection state
  const [selectedRepairs, setSelectedRepairs] = useState<Set<string>>(new Set());
  const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  useEffect(() => {
    loadRepairs();
  }, [pagination.page]);

  const loadRepairs = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRepairs(pagination.page, pagination.limit);
      if (response.status === "success" && response.data) {
        setRepairs(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            totalCount: response.pagination.totalCount || 0,
            totalPages: response.pagination.totalPages || 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading repairs:", error);
      toast({
        title: isTh ? "เกิดข้อผิดพลาด" : "Error",
        description: isTh ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (repair: RepairItem) => {
    setEditingRepair(repair);
    setEditFormData({
      deviceType: repair.deviceType || "",
      deviceBrand: repair.deviceBrand || "",
      deviceModel: repair.deviceModel || "",
      deviceSerialNumber: repair.deviceSerialNumber || "",
      serialNumber: repair.serialNumber || "",
      deviceColor: repair.deviceColor || "",
      screenLockCode: repair.screenLockCode || "",
      problemDescription: repair.problemDescription || "",
      problemSymptoms: repair.problemSymptoms || "",
      diagnosis: repair.diagnosis || "",
      repairNotes: repair.repairNotes || "",
      status: repair.status || "pending",
      laborCost: repair.laborCost || 0,
      partsCost: repair.partsCost || 0,
      totalCost: repair.totalCost || 0,
      deposit: repair.deposit || 0,
      estimatedPrice: repair.estimatedPrice || 0,
      repairSummaryPrice: repair.repairSummaryPrice || 0,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRepair) return;

    setIsSaving(true);
    try {
      const response = await apiClient.updateRepair(editingRepair.id, editFormData);
      if (response.status === "success") {
        toast({
          title: isTh ? "บันทึกสำเร็จ" : "Saved successfully",
          description: isTh ? "อัพเดทรายการซ่อมเรียบร้อยแล้ว" : "Repair item updated successfully",
        });
        setEditDialogOpen(false);
        setEditingRepair(null);
        loadRepairs();
      } else {
        toast({
          title: isTh ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (isTh ? "ไม่สามารถบันทึกได้" : "Failed to save"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: isTh ? "เกิดข้อผิดพลาด" : "Error",
        description: error instanceof Error ? error.message : (isTh ? "เกิดข้อผิดพลาด" : "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (repair: RepairItem) => {
    setDeletingRepair(repair);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRepair) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.deleteRepair(deletingRepair.id);
      if (response.status === "success") {
        toast({
          title: isTh ? "ลบสำเร็จ" : "Deleted successfully",
          description: isTh ? "ลบรายการซ่อมเรียบร้อยแล้ว" : "Repair item deleted successfully",
        });
        setDeleteDialogOpen(false);
        setDeletingRepair(null);
        loadRepairs();
      } else {
        toast({
          title: isTh ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (isTh ? "ไม่สามารถลบได้" : "Failed to delete"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: isTh ? "เกิดข้อผิดพลาด" : "Error",
        description: error instanceof Error ? error.message : (isTh ? "เกิดข้อผิดพลาด" : "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRepairs = repairs.filter((repair) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const customerName = repair.customer?.fullName || 
      `${repair.customer?.firstName || ""} ${repair.customer?.lastName || ""}`.trim();
    return (
      repair.repairNumber?.toLowerCase().includes(query) ||
      customerName.toLowerCase().includes(query) ||
      repair.customer?.phone?.includes(query) ||
      repair.deviceModel?.toLowerCase().includes(query) ||
      repair.serialNumber?.includes(query)
    );
  });

  const getCustomerName = (repair: RepairItem) => {
    if (repair.customer?.fullName) return repair.customer.fullName;
    if (repair.customer?.firstName) {
      return `${repair.customer.firstName} ${repair.customer.lastName || ""}`.trim();
    }
    return "—";
  };

  // Multiple selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRepairs(new Set(filteredRepairs.map((r) => r.id)));
    } else {
      setSelectedRepairs(new Set());
    }
  };

  const handleSelectRepair = (repairId: string, checked: boolean) => {
    const newSelected = new Set(selectedRepairs);
    if (checked) {
      newSelected.add(repairId);
    } else {
      newSelected.delete(repairId);
    }
    setSelectedRepairs(newSelected);
  };

  const handleDeleteMultiple = async () => {
    if (selectedRepairs.size === 0) return;

    setIsDeletingMultiple(true);
    try {
      const repairIds = Array.from(selectedRepairs);
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // ลบทีละรายการ
      for (const id of repairIds) {
        try {
          const response = await apiClient.deleteRepair(id);
          if (response.status === "success") {
            successCount++;
          } else {
            failCount++;
            errors.push(response.message || id);
          }
        } catch (error) {
          failCount++;
          errors.push(error instanceof Error ? error.message : id);
        }
      }

      // แสดงผลลัพธ์
      if (successCount > 0) {
        toast({
          title: isTh ? "ลบสำเร็จ" : "Deleted successfully",
          description: isTh
            ? `ลบ ${successCount} รายการสำเร็จ${failCount > 0 ? `, ลบไม่สำเร็จ ${failCount} รายการ` : ""}`
            : `Deleted ${successCount} item(s)${failCount > 0 ? `, failed to delete ${failCount} item(s)` : ""}`,
        });
      }

      if (failCount > 0) {
        toast({
          title: isTh ? "เกิดข้อผิดพลาด" : "Error",
          description: isTh
            ? `ไม่สามารถลบ ${failCount} รายการได้`
            : `Failed to delete ${failCount} item(s)`,
          variant: "destructive",
        });
      }

      setDeleteMultipleDialogOpen(false);
      setSelectedRepairs(new Set());
      loadRepairs();
    } catch (error) {
      toast({
        title: isTh ? "เกิดข้อผิดพลาด" : "Error",
        description: error instanceof Error ? error.message : (isTh ? "เกิดข้อผิดพลาด" : "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const isAllSelected = filteredRepairs.length > 0 && selectedRepairs.size === filteredRepairs.length;
  const isIndeterminate = selectedRepairs.size > 0 && selectedRepairs.size < filteredRepairs.length;

  return (
    <MainLayout>
      <div className="page-header mb-6">
        <div className="flex items-center gap-4">
          <Link to="/system">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="page-title">
              {isTh ? "จัดการรายการซ่อม" : "Repair Items Management"}
            </h1>
            <p className="page-description">
              {isTh
                ? "จัดการ แก้ไข และลบรายการซ่อม"
                : "Manage, edit, and delete repair items"}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={isTh ? "ค้นหารายการซ่อม..." : "Search repairs..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedRepairs.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setDeleteMultipleDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isTh ? `ลบที่เลือก (${selectedRepairs.size})` : `Delete Selected (${selectedRepairs.size})`}
          </Button>
        )}
      </div>

      {/* Repairs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {isTh ? "กำลังโหลดข้อมูล..." : "Loading..."}
              </p>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {isTh ? "ไม่มีข้อมูลรายการซ่อม" : "No repair items found"}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <div className="relative">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className={isIndeterminate ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                      {isIndeterminate && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-2 h-0.5 bg-primary-foreground rounded" />
                        </div>
                      )}
                    </div>
                  </th>
                  <th>{isTh ? "รหัสซ่อม" : "Repair ID"}</th>
                  <th>{isTh ? "ลูกค้า" : "Customer"}</th>
                  <th>{isTh ? "อุปกรณ์" : "Device"}</th>
                  <th>{isTh ? "ปัญหา" : "Issue"}</th>
                  <th>{isTh ? "สถานะ" : "Status"}</th>
                  <th>{isTh ? "ราคารวม" : "Total Cost"}</th>
                  <th>{isTh ? "การดำเนินการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id}>
                    <td>
                      <Checkbox
                        checked={selectedRepairs.has(repair.id)}
                        onCheckedChange={(checked) => handleSelectRepair(repair.id, checked as boolean)}
                      />
                    </td>
                    <td className="font-medium text-foreground font-mono">
                      {repair.repairNumber || repair.id}
                    </td>
                    <td>
                      <div>{getCustomerName(repair)}</div>
                      {repair.customer?.phone && (
                        <div className="text-xs text-muted-foreground">
                          {repair.customer.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      {repair.deviceModel || repair.deviceType || "—"}
                      {repair.deviceBrand && (
                        <div className="text-xs text-muted-foreground">
                          {repair.deviceBrand}
                        </div>
                      )}
                    </td>
                    <td className="max-w-xs truncate">
                      {repair.problemDescription || repair.problemSymptoms || "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          statusStyles[repair.status] || "status-pending"
                        }`}
                      >
                        {statusLabels[repair.status]
                          ? isTh
                            ? statusLabels[repair.status].th
                            : statusLabels[repair.status].en
                          : repair.status}
                      </span>
                    </td>
                    <td className="text-right">
                      ฿{repair.totalCost?.toLocaleString() || "0"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(repair)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(repair)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-border p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (pagination.page > 1) {
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                      }
                    }}
                    className={
                      pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setPagination((prev) => ({ ...prev, page }))}
                      isActive={pagination.page === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (pagination.page < pagination.totalPages) {
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
                      }
                    }}
                    className={
                      pagination.page === pagination.totalPages
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isTh ? "แก้ไขรายการซ่อม" : "Edit Repair Item"}
            </DialogTitle>
            <DialogDescription>
              {isTh
                ? "แก้ไขข้อมูลรายการซ่อม"
                : "Edit repair item information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isTh ? "ประเภทอุปกรณ์" : "Device Type"}</Label>
                <Input
                  value={editFormData.deviceType || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, deviceType: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "ยี่ห้อ" : "Brand"}</Label>
                <Input
                  value={editFormData.deviceBrand || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, deviceBrand: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isTh ? "รุ่น" : "Model"}</Label>
                <Input
                  value={editFormData.deviceModel || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, deviceModel: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "สี" : "Color"}</Label>
                <Input
                  value={editFormData.deviceColor || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, deviceColor: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isTh ? "Serial Number" : "Serial Number"}</Label>
                <Input
                  value={editFormData.serialNumber || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, serialNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "รหัสล็อคหน้าจอ" : "Screen Lock Code"}</Label>
                <Input
                  value={editFormData.screenLockCode || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, screenLockCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isTh ? "รายละเอียดปัญหา" : "Problem Description"}</Label>
              <Textarea
                value={editFormData.problemDescription || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, problemDescription: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{isTh ? "อาการเสีย" : "Symptoms"}</Label>
              <Textarea
                value={editFormData.problemSymptoms || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, problemSymptoms: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{isTh ? "การวินิจฉัย" : "Diagnosis"}</Label>
              <Textarea
                value={editFormData.diagnosis || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, diagnosis: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{isTh ? "หมายเหตุการซ่อม" : "Repair Notes"}</Label>
              <Textarea
                value={editFormData.repairNotes || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, repairNotes: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isTh ? "สถานะ" : "Status"}</Label>
                <Select
                  value={editFormData.status || "pending"}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {isTh ? label.th : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isTh ? "ค่าแรง" : "Labor Cost"}</Label>
                <Input
                  type="number"
                  value={editFormData.laborCost || 0}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      laborCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "ค่าอะไหล่" : "Parts Cost"}</Label>
                <Input
                  type="number"
                  value={editFormData.partsCost || 0}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      partsCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "ราคารวม" : "Total Cost"}</Label>
                <Input
                  type="number"
                  value={editFormData.totalCost || 0}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      totalCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isTh ? "เงินมัดจำ" : "Deposit"}</Label>
                <Input
                  type="number"
                  value={editFormData.deposit || 0}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      deposit: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "ราคาประมาณการ" : "Estimated Price"}</Label>
                <Input
                  type="number"
                  value={editFormData.estimatedPrice || 0}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      estimatedPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isTh ? "ราคารวมการซ่อม" : "Repair Summary Price"}</Label>
                <Input
                  type="number"
                  value={editFormData.repairSummaryPrice || 0}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      repairSummaryPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving
                ? isTh
                  ? "กำลังบันทึก..."
                  : "Saving..."
                : isTh
                ? "บันทึก"
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isTh ? "ยืนยันการลบ" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isTh
                ? `คุณแน่ใจหรือไม่ว่าต้องการลบรายการซ่อม ${deletingRepair?.repairNumber || deletingRepair?.id}? การกระทำนี้ไม่สามารถยกเลิกได้`
                : `Are you sure you want to delete repair item ${deletingRepair?.repairNumber || deletingRepair?.id}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? isTh
                  ? "กำลังลบ..."
                  : "Deleting..."
                : isTh
                ? "ลบ"
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Confirmation Dialog */}
      <AlertDialog open={deleteMultipleDialogOpen} onOpenChange={setDeleteMultipleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isTh ? "ยืนยันการลบหลายรายการ" : "Confirm Delete Multiple"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isTh
                ? `คุณแน่ใจหรือไม่ว่าต้องการลบ ${selectedRepairs.size} รายการ? การกระทำนี้ไม่สามารถยกเลิกได้ และบิลที่เชื่อมกับรายการซ่อมเหล่านี้จะถูกลบไปด้วย`
                : `Are you sure you want to delete ${selectedRepairs.size} item(s)? This action cannot be undone, and any bills connected to these repair items will also be deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMultiple}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMultiple}
              disabled={isDeletingMultiple}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingMultiple
                ? isTh
                  ? "กำลังลบ..."
                  : "Deleting..."
                : isTh
                ? "ลบ"
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default RepairItemsManagement;
