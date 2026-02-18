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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/contexts/SocketContext";
import { apiClient } from "@/lib/api";
import { Edit, Eye, MessageSquare, Minus, Phone, Plus, Receipt, Search, Send, Trash2, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  lineId?: string;
  lineIdRes?: string;
  device?: string;
  createdAt: string;
  updatedAt: string;
}

const Customers = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    lineId: "",
    device: "",
  });

  // State สำหรับ Send Receipt Dialog
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<Customer | null>(null);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2>(1); // Step 1: เลือกใบแจ้งซ่อม, Step 2: รีวิวและส่ง
  const [customerRepairs, setCustomerRepairs] = useState<any[]>([]);
  const [isLoadingRepairs, setIsLoadingRepairs] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any | null>(null);
  const [isLoadingRepairDetail, setIsLoadingRepairDetail] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    receiptNo: "",
    date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
    note: "",
  });
  const [receiptItems, setReceiptItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const ITEMS_PER_PAGE = 8;

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCustomers();
      if (response.status === "success" && response.data) {
        setCustomers(response.data);
      } else {
        toast.error(
          response.message ||
            (language === "th"
              ? "ไม่สามารถโหลดข้อมูลลูกค้าได้"
              : "Failed to load customers")
        );
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า"
          : "Error loading customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("customer:created", loadCustomers);
    socket.on("customer:updated", loadCustomers);
    socket.on("customer:deleted", loadCustomers);

    return () => {
      socket.off("customer:created", loadCustomers);
      socket.off("customer:updated", loadCustomers);
      socket.off("customer:deleted", loadCustomers);
    };
  }, [socket, isConnected]);

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName =
      customer.fullName ||
      `${customer.firstName} ${customer.lastName || ""}`.trim();
    return (
      customer.firstName?.toLowerCase().includes(term) ||
      customer.lastName?.toLowerCase().includes(term) ||
      fullName.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      lineId: "",
      device: "",
    });
    setEditingCustomer(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      phone: customer.phone || "",
      lineId: customer.lineId || customer.lineIdRes || "",
      device: customer.device || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!form.firstName.trim()) {
      toast.error(
        language === "th" ? "กรุณากรอกชื่อ" : "Please enter first name"
      );
      return;
    }

    if (!form.lastName.trim()) {
      toast.error(
        language === "th"
          ? "กรุณากรอกนามสกุล"
          : "Please enter last name"
      );
      return;
    }

    try {
      if (editingCustomer) {
        const response = await apiClient.updateCustomer(editingCustomer.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          lineId: form.lineId.trim() || null,
          device: form.device.trim() || null,
        });

        if (response.status === "success") {
          toast.success(
            language === "th"
              ? "แก้ไขข้อมูลลูกค้าสำเร็จ"
              : "Customer updated successfully"
          );
          setIsDialogOpen(false);
          resetForm();
          loadCustomers();
        } else {
          toast.error(
            response.message ||
              (language === "th"
                ? "ไม่สามารถแก้ไขข้อมูลลูกค้าได้"
                : "Failed to update customer")
          );
        }
      } else {
        const response = await apiClient.createCustomer({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          lineId: form.lineId.trim() || null,
          device: form.device.trim() || null,
        });

        if (response.status === "success") {
          toast.success(
            language === "th"
              ? "เพิ่มลูกค้าสำเร็จ"
              : "Customer created successfully"
          );
          setIsDialogOpen(false);
          resetForm();
          loadCustomers();
        } else {
          toast.error(
            response.message ||
              (language === "th"
                ? "ไม่สามารถเพิ่มลูกค้าได้"
                : "Failed to create customer")
          );
        }
      }
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast.error(
        error?.response?.data?.message ||
          (language === "th"
            ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
            : "Error saving customer")
      );
    }
  };

  const openDeleteDialog = (customer: Customer) => {
    setDeleteTarget(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;

    try {
      const response = await apiClient.deleteCustomer(deleteTarget.id);

      if (response.status === "success") {
        toast.success(
          language === "th"
            ? "ลบลูกค้าสำเร็จ"
            : "Customer deleted successfully"
        );
        setIsDeleteDialogOpen(false);
        setDeleteTarget(null);
        loadCustomers();
      } else {
        toast.error(
          response.message ||
            (language === "th"
              ? "ไม่สามารถลบลูกค้าได้"
              : "Failed to delete customer")
        );
      }
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(
        error?.response?.data?.message ||
          (language === "th"
            ? "เกิดข้อผิดพลาดในการลบข้อมูล"
            : "Error deleting customer")
      );
    }
  };

  // ฟังก์ชันสำหรับ Receipt Dialog
  const openReceiptDialog = async (customer: Customer) => {
    setReceiptTarget(customer);
    setDialogStep(1);
    setSelectedRepair(null);
    setCustomerRepairs([]);
    setReceiptItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setIsReceiptDialogOpen(true);

    // โหลดใบแจ้งซ่อมของลูกค้า
    setIsLoadingRepairs(true);
    try {
      const response = await apiClient.getCustomerWithRepairs(customer.id);
      if (response.status === "success" && response.data?.repairs) {
        // เรียงจากใหม่ไปเก่า
        const sorted = [...response.data.repairs].sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setCustomerRepairs(sorted);
      }
    } catch (err) {
      console.error("Error loading repairs:", err);
      toast.error(language === "th" ? "ไม่สามารถโหลดใบแจ้งซ่อมได้" : "Failed to load repairs");
    } finally {
      setIsLoadingRepairs(false);
    }
  };

  // เลือกใบแจ้งซ่อม → โหลดข้อมูลรายการ → ไปขั้นตอน 2
  const handleSelectRepair = async (repair: any) => {
    setSelectedRepair(repair);
    setIsLoadingRepairDetail(true);
    try {
      // ดึงข้อมูลเต็มของ repair (รวม selectedPart relation)
      const res = await apiClient.getRepairById(repair.id);
      const full = (res.status === "success" && res.data) ? res.data : repair;

      const items: Array<{ description: string; quantity: number; unitPrice: number }> = [];

      // 1) selectedParts (array — API คืนค่ามาแล้ว resolve จาก selectedPartIds)
      if (Array.isArray(full.selectedParts) && full.selectedParts.length > 0) {
        // นับจำนวนแต่ละชิ้น (กรณีเลือกซ้ำหลายชิ้น)
        const countMap: Record<string, number> = {};
        full.selectedParts.forEach((p: any) => {
          countMap[p.id] = (countMap[p.id] || 0) + 1;
        });
        const seen = new Set<string>();
        full.selectedParts.forEach((p: any) => {
          if (seen.has(p.id)) return;
          seen.add(p.id);
          items.push({
            description: p.nameTh || p.name || "อะไหล่",
            quantity: countMap[p.id] || 1,
            unitPrice: parseFloat(String(p.price)) || 0,
          });
        });
      } else if (full.selectedPart) {
        // fallback: selectedPart เดี่ยว (backward compat)
        const p = full.selectedPart;
        items.push({
          description: p.nameTh || p.name || "อะไหล่",
          quantity: 1,
          unitPrice: parseFloat(String(p.price)) || 0,
        });
      }

      // 2) additionalParts (array หรือ JSON string)
      const addPartsRaw = full.additionalParts;
      if (addPartsRaw) {
        try {
          const addParts = typeof addPartsRaw === "string"
            ? JSON.parse(addPartsRaw)
            : addPartsRaw;
          if (Array.isArray(addParts)) {
            addParts.forEach((p: any) => {
              items.push({
                description: p.nameTh || p.name || "อะไหล่เพิ่มเติม",
                quantity: 1,
                unitPrice: parseFloat(String(p.price)) || 0,
              });
            });
          }
        } catch {/* ignore parse error */}
      }

      // 3) ค่าแรงซ่อม (ถ้ามี)
      const laborCost = parseFloat(String(full.laborCost)) || 0;
      if (laborCost > 0) {
        items.push({ description: "ค่าแรงซ่อม", quantity: 1, unitPrice: laborCost });
      }

      // 4) fallback ถ้ายังไม่มีรายการเลย → ใช้ราคารวม + อาการเสีย
      if (items.length === 0) {
        const price =
          parseFloat(String(full.totalCost)) ||
          parseFloat(String(full.repairSummaryPrice)) ||
          parseFloat(String(full.estimatedPrice)) || 0;
        const desc =
          full.problemSymptoms ||
          full.problemDescription ||
          `ซ่อม ${full.deviceType || ""} ${full.deviceModel || ""}`.trim() ||
          "รายการซ่อม";
        items.push({ description: desc, quantity: 1, unitPrice: price });
      }

      setReceiptItems(items);
      setReceiptForm({
        receiptNo: full.repairNumber || repair.repairNumber || `R-${Date.now()}`.slice(-8),
        date: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
        note: "",
      });
      setDialogStep(2);
    } catch (err) {
      console.error("Error loading repair detail:", err);
      toast.error(language === "th" ? "ไม่สามารถโหลดรายละเอียดได้" : "Failed to load repair details");
    } finally {
      setIsLoadingRepairDetail(false);
    }
  };

  const addReceiptItem = () => {
    setReceiptItems([...receiptItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeReceiptItem = (index: number) => {
    if (receiptItems.length === 1) return;
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const updateReceiptItem = (index: number, field: string, value: string | number) => {
    const updated = receiptItems.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    });
    setReceiptItems(updated);
  };

  const totalReceiptAmount = receiptItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSendReceipt = async () => {
    if (!receiptTarget) return;

    const invalidItems = receiptItems.filter(item => !item.description.trim());
    if (invalidItems.length > 0) {
      toast.error(language === "th" ? "กรุณากรอกชื่อรายการทุกช่อง" : "Please fill in all item descriptions");
      return;
    }

    if (!receiptTarget.lineIdRes) {
      toast.error(language === "th" ? "ลูกค้ายังไม่ได้เชื่อมต่อ LINE" : "Customer has no LINE connection");
      return;
    }

    setIsSendingReceipt(true);
    try {
      const response = await apiClient.sendReceiptViaLine(receiptTarget.id, {
        receiptNo: receiptForm.receiptNo,
        date: receiptForm.date,
        items: receiptItems,
        note: receiptForm.note || undefined,
      });

      if (response.status === "success") {
        const customerName = receiptTarget.fullName || `${receiptTarget.firstName} ${receiptTarget.lastName || ""}`.trim();
        toast.success(
          language === "th"
            ? `ส่งใบเสร็จให้ ${customerName} ผ่าน LINE สำเร็จ`
            : `Receipt sent to ${customerName} via LINE`
        );
        setIsReceiptDialogOpen(false);
      } else {
        toast.error(response.message || (language === "th" ? "ไม่สามารถส่งใบเสร็จได้" : "Failed to send receipt"));
      }
    } catch (error: any) {
      console.error("Error sending receipt:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการส่งใบเสร็จ" : "Error sending receipt");
    } finally {
      setIsSendingReceipt(false);
    }
  };

  // Status label helper
  const getRepairStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending:       { label: "รอดำเนินการ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      "in-progress": { label: "กำลังซ่อม",   className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      completed:     { label: "เสร็จสิ้น",    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      cancelled:     { label: "ยกเลิก",       className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      waiting_parts: { label: "รออะไหล่",     className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
      "picked-up":   { label: "รับเครื่องแล้ว", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    };
    const info = map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.className}`}>{info.label}</span>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Users className="w-8 h-8" />
                {language === "th" ? "จัดการลูกค้า" : "Customer Management"}
              </h1>
              <p className="page-description">
                {language === "th"
                  ? "ดูและจัดการข้อมูลลูกค้าทั้งหมด"
                  : "View and manage all customer information"}
              </p>
            </div>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              {language === "th" ? "เพิ่มลูกค้า" : "Add Customer"}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                language === "th"
                  ? "ค้นหาด้วยชื่อหรือเบอร์โทรศัพท์..."
                  : "Search by name or phone..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Customer Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "ลูกค้าทั้งหมด" : "Total Customers"}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {customers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "มีเบอร์โทร" : "With Phone"}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {customers.filter((c) => c.phone).length}
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "มี LINE" : "With LINE"}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {customers.filter((c) => c.lineId || c.lineIdRes).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer List - Desktop & Mobile */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              {language === "th" ? "กำลังโหลด..." : "Loading..."}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {language === "th"
                  ? "ไม่พบข้อมูลลูกค้า"
                  : "No customers found"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {language === "th" ? "ชื่อ-นามสกุล" : "Name"}
                      </TableHead>
                      <TableHead>
                        {language === "th" ? "เบอร์โทรศัพท์" : "Phone"}
                      </TableHead>
                      <TableHead>{language === "th" ? "LINE ID" : "LINE ID"}</TableHead>
                      <TableHead>{language === "th" ? "UserLineID" : "UserLineID"}</TableHead>
                      <TableHead>{language === "th" ? "เครื่อง" : "Device"}</TableHead>
                      <TableHead>
                        {language === "th" ? "วันที่สร้าง" : "Created At"}
                      </TableHead>
                      <TableHead className="text-right">
                        {language === "th" ? "จัดการ" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => {
                      const fullName =
                        customer.fullName ||
                        `${customer.firstName} ${customer.lastName || ""}`.trim();
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {fullName || customer.firstName}
                          </TableCell>
                          <TableCell>
                            {customer.phone || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.lineId ? (
                              <span className="text-blue-600 dark:text-blue-400">
                                {customer.lineId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.lineIdRes ? (
                              <span className="text-green-600 dark:text-green-400">
                                {customer.lineIdRes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.device || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(customer.createdAt).toLocaleDateString(
                              language === "th" ? "th-TH" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigate(`/customers/${customer.id}`)
                                }
                                className="h-8 w-8"
                                title={
                                  language === "th"
                                    ? "ดูรายละเอียด"
                                    : "View Details"
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(customer.lineIdRes) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openReceiptDialog(customer)}
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                  title={language === "th" ? "ส่งบิลใบเสร็จผ่าน LINE" : "Send Receipt via LINE"}
                                >
                                  <Receipt className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(customer)}
                                className="h-8 w-8"
                                title={
                                  language === "th" ? "แก้ไข" : "Edit"
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(customer)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title={language === "th" ? "ลบ" : "Delete"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {paginatedCustomers.map((customer) => {
                  const fullName =
                    customer.fullName ||
                    `${customer.firstName} ${customer.lastName || ""}`.trim();
                  return (
                    <div key={customer.id} className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{fullName || customer.firstName}</p>
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 text-sm">
                        {customer.lineId && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[80px]">LINE ID:</span>
                            <span className="text-blue-600 dark:text-blue-400 break-all">{customer.lineId}</span>
                          </div>
                        )}
                        {customer.lineIdRes && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[80px]">UserLineID:</span>
                            <span className="text-green-600 dark:text-green-400 break-all">{customer.lineIdRes}</span>
                          </div>
                        )}
                        {customer.device && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[80px]">{language === "th" ? "เครื่อง" : "Device"}:</span>
                            <span className="text-foreground">{customer.device}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <span className="text-muted-foreground min-w-[80px]">{language === "th" ? "วันที่สร้าง" : "Created"}:</span>
                          <span className="text-foreground">
                            {new Date(customer.createdAt).toLocaleDateString(
                              language === "th" ? "th-TH" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="flex-1 gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {language === "th" ? "ดู" : "View"}
                        </Button>
                        {customer.lineIdRes && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReceiptDialog(customer)}
                            className="flex-1 gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          >
                            <Receipt className="w-4 h-4" />
                            {language === "th" ? "ส่งบิล" : "Send Bill"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                          className="flex-1 gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          {language === "th" ? "แก้ไข" : "Edit"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(customer)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-border p-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  {language === "th"
                    ? `พบทั้งหมด ${filteredCustomers.length} รายการ (หน้า ${currentPage} จาก ${totalPages})`
                    : `Total ${filteredCustomers.length} customers (Page ${currentPage} of ${totalPages})`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Add/Edit Customer Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetForm();
            }
            setIsDialogOpen(open);
          }}
        >
          <DialogContent className="w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer
                  ? language === "th"
                    ? "แก้ไขข้อมูลลูกค้า"
                    : "Edit Customer"
                  : language === "th"
                  ? "เพิ่มลูกค้าใหม่"
                  : "Add New Customer"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingCustomer
                  ? language === "th"
                    ? "แก้ไขข้อมูลลูกค้า"
                    : "Edit customer information"
                  : language === "th"
                  ? "กรอกข้อมูลลูกค้าใหม่"
                  : "Enter new customer information"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName" className="text-sm">
                  {language === "th" ? "ชื่อ" : "First Name"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder={
                    language === "th" ? "กรอกชื่อ" : "Enter first name"
                  }
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName" className="text-sm">
                  {language === "th" ? "นามสกุล" : "Last Name"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder={
                    language === "th" ? "กรอกนามสกุล" : "Enter last name"
                  }
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-sm">
                  {language === "th" ? "เบอร์โทรศัพท์" : "Phone"}
                </Label>
                <Input
                  id="phone"
                  placeholder={
                    language === "th"
                      ? "กรอกเบอร์โทรศัพท์ (9-10 หลัก)"
                      : "Enter phone (9-10 digits)"
                  }
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lineId" className="text-sm">{language === "th" ? "UserLineID" : "UserLineID"}</Label>
                <Input
                  id="lineId"
                  placeholder={
                    language === "th" ? "กรอก UserLineID" : "Enter UserLineID"
                  }
                  value={form.lineId}
                  onChange={(e) => setForm({ ...form, lineId: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device" className="text-sm">
                  {language === "th" ? "เครื่อง (ยี่ห้อ/รุ่น)" : "Device (Brand/Model)"}
                </Label>
                <Input
                  id="device"
                  placeholder={
                    language === "th" ? "เช่น iPhone 15, Samsung S24" : "e.g. iPhone 15, Samsung S24"
                  }
                  value={form.device}
                  onChange={(e) => setForm({ ...form, device: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="w-full sm:w-auto"
              >
                {language === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button onClick={handleSaveCustomer} className="w-full sm:w-auto">
                {editingCustomer
                  ? language === "th"
                    ? "บันทึก"
                    : "Save"
                  : language === "th"
                  ? "เพิ่ม"
                  : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Receipt via LINE Dialog — 2 Steps */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={(open) => { if (!open) setIsReceiptDialogOpen(false); }}>
          <DialogContent className="w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Receipt className="w-5 h-5" />
                {dialogStep === 1
                  ? (language === "th" ? "เลือกใบแจ้งซ่อม" : "Select Repair Order")
                  : (language === "th" ? "ส่งบิลใบเสร็จผ่าน LINE" : "Send Receipt via LINE")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {receiptTarget && (
                  <span className="flex items-center flex-wrap gap-2 mt-1">
                    <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    {language === "th" ? "ส่งให้" : "To:"}{" "}
                    <Badge variant="secondary" className="text-xs">
                      {receiptTarget.fullName || `${receiptTarget.firstName} ${receiptTarget.lastName || ""}`.trim()}
                    </Badge>
                    <span className="text-green-600 text-xs font-mono">
                      LINE: {receiptTarget.lineIdRes?.slice(0, 14)}...
                    </span>
                    {/* Step indicator */}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {language === "th" ? `ขั้นตอน ${dialogStep}/2` : `Step ${dialogStep}/2`}
                    </span>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* ─── STEP 1: เลือกใบแจ้งซ่อม ─── */}
            {dialogStep === 1 && (
              <div className="space-y-3 py-2">
                {isLoadingRepairs ? (
                  <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    {language === "th" ? "กำลังโหลดใบแจ้งซ่อม..." : "Loading repairs..."}
                  </div>
                ) : customerRepairs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {language === "th" ? "ลูกค้ารายนี้ยังไม่มีใบแจ้งซ่อม" : "No repair orders found for this customer"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {language === "th"
                        ? `พบ ${customerRepairs.length} ใบแจ้งซ่อม — คลิกเพื่อเลือก`
                        : `Found ${customerRepairs.length} repair(s) — click to select`}
                    </p>
                    {customerRepairs.map((repair: any) => {
                      const cost =
                        parseFloat(String(repair.totalCost)) ||
                        parseFloat(String(repair.repairSummaryPrice)) ||
                        parseFloat(String(repair.estimatedPrice)) || 0;
                      const deviceLabel = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceType || "-";
                      const issueLabel = repair.problemSymptoms || repair.problemDescription || "-";
                      return (
                        <button
                          key={repair.id}
                          onClick={() => handleSelectRepair(repair)}
                          disabled={isLoadingRepairDetail}
                          className="w-full text-left rounded-lg border border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors p-3 space-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {repair.repairNumber}
                            </span>
                            {getRepairStatusBadge(repair.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{deviceLabel}</span>
                            <span>—</span>
                            <span className="truncate max-w-[200px]">{issueLabel}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {repair.createdAt
                                ? new Date(repair.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
                                : "-"}
                            </span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              ฿{cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isLoadingRepairDetail && (
                  <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground text-sm">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    {language === "th" ? "กำลังโหลดรายละเอียด..." : "Loading details..."}
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 2: รีวิวรายการ + ส่ง ─── */}
            {dialogStep === 2 && (
              <div className="space-y-4 py-2">
                {/* ใบแจ้งซ่อมที่เลือก */}
                {selectedRepair && (
                  <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 text-sm">
                    <Receipt className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono font-semibold">{selectedRepair.repairNumber}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground truncate">
                      {[selectedRepair.deviceBrand, selectedRepair.deviceModel].filter(Boolean).join(" ") || selectedRepair.deviceType}
                    </span>
                    {getRepairStatusBadge(selectedRepair.status)}
                  </div>
                )}

                {/* Receipt Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-sm">{language === "th" ? "เลขที่ใบเสร็จ" : "Receipt No."}</Label>
                    <Input
                      placeholder="R-XXXXXXXX"
                      value={receiptForm.receiptNo}
                      onChange={(e) => setReceiptForm({ ...receiptForm, receiptNo: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-sm">{language === "th" ? "วันที่" : "Date"}</Label>
                    <Input
                      value={receiptForm.date}
                      onChange={(e) => setReceiptForm({ ...receiptForm, date: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{language === "th" ? "รายการสินค้า/บริการ" : "Items"}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addReceiptItem}
                      className="gap-1 h-7 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {language === "th" ? "เพิ่มรายการ" : "Add Item"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 text-xs text-muted-foreground px-1">
                    <span>{language === "th" ? "รายการ" : "Description"}</span>
                    <span className="text-center">{language === "th" ? "จำนวน" : "Qty"}</span>
                    <span className="text-right">{language === "th" ? "ราคา/หน่วย" : "Unit Price"}</span>
                    <span></span>
                  </div>

                  {receiptItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center">
                      <Input
                        placeholder={language === "th" ? "ชื่อรายการ/บริการ" : "Item description"}
                        value={item.description}
                        onChange={(e) => updateReceiptItem(index, "description", e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => updateReceiptItem(index, "quantity", parseFloat(e.target.value) || 1)}
                        className="h-9 text-sm text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => updateReceiptItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm text-right"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReceiptItem(index)}
                        disabled={receiptItems.length === 1}
                        className="h-9 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
                  <span className="font-semibold text-sm">{language === "th" ? "💰 รวมทั้งสิ้น" : "💰 Total Amount"}</span>
                  <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                    {totalReceiptAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {language === "th" ? "บาท" : "THB"}
                  </span>
                </div>

                {/* Note */}
                <div className="grid gap-1.5">
                  <Label className="text-sm">{language === "th" ? "หมายเหตุ (ไม่บังคับ)" : "Note (Optional)"}</Label>
                  <Textarea
                    placeholder={language === "th" ? "เพิ่มหมายเหตุ เช่น รับประกัน 30 วัน..." : "Add note, e.g. 30-day warranty..."}
                    value={receiptForm.note}
                    onChange={(e) => setReceiptForm({ ...receiptForm, note: e.target.value })}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {dialogStep === 2 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setDialogStep(1)}
                    className="w-full sm:w-auto gap-1"
                  >
                    ← {language === "th" ? "เปลี่ยนใบแจ้งซ่อม" : "Change Repair"}
                  </Button>
                  <Button
                    onClick={handleSendReceipt}
                    disabled={isSendingReceipt}
                    className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSendingReceipt ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {language === "th" ? "กำลังส่ง..." : "Sending..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {language === "th" ? "ส่งผ่าน LINE" : "Send via LINE"}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsReceiptDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  {language === "th" ? "ยกเลิก" : "Cancel"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent className="w-[95vw] sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                {language === "th" ? (
                  <>
                    คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้า{" "}
                    <strong>
                      {deleteTarget
                        ? deleteTarget.fullName ||
                          `${deleteTarget.firstName} ${deleteTarget.lastName || ""}`.trim()
                        : ""}
                    </strong>
                    ? การกระทำนี้ไม่สามารถยกเลิกได้
                  </>
                ) : (
                  <>
                    Are you sure you want to delete customer{" "}
                    <strong>
                      {deleteTarget
                        ? deleteTarget.fullName ||
                          `${deleteTarget.firstName} ${deleteTarget.lastName || ""}`.trim()
                        : ""}
                    </strong>
                    ? This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">
                {language === "th" ? "ยกเลิก" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              >
                {language === "th" ? "ลบ" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Customers;
