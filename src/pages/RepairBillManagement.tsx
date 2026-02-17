/**
 * หน้าจัดการใบแจ้งซ่อม
 * ให้พนักงานสามารถดู แก้ไข และพิมพ์ใบแจ้งซ่อมได้
 */
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs, type RepairItem } from "@/contexts/RepairsContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { repairItemToBillData } from "@/types/repairOrder";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Eye, Printer, Search, Edit, Plus, Trash2, X, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RepairBillManagement = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { repairs, refreshRepairs } = useRepairs();
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 10;

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRepair, setIsLoadingRepair] = useState(false);

  // Part selection dialog state
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [partsList, setPartsList] = useState<any[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  
  // Filter repairs by search query
  const filteredRepairs = repairs.filter((repair) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      repair.id.toLowerCase().includes(query) ||
      repair.customer.toLowerCase().includes(query) ||
      repair.phone.toLowerCase().includes(query) ||
      repair.device.toLowerCase().includes(query) ||
      (repair.issueTh && repair.issueTh.toLowerCase().includes(query)) ||
      (repair.issue && repair.issue.toLowerCase().includes(query))
    );
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredRepairs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRepairs = filteredRepairs.slice(startIndex, endIndex);

  const handleViewBill = (item: RepairItem) => {
    const orderData = repairItemToBillData(item, language);
    navigate("/repairs/bill/order", { 
      state: { 
        ...orderData, 
        repairId: item.id,
        selectedPart: item.selectedPart,
        selectedParts: item.selectedParts || (item.selectedPart ? [item.selectedPart] : undefined),
        additionalParts: item.additionalParts || undefined,
        returnTo: "/repairs/bill/management", // กลับไปที่จัดการใบแจ้งซ่อม
      } 
    });
  };

  const handleViewReceipt = (item: RepairItem) => {
    const orderData = repairItemToBillData(item, language);
    navigate("/repairs/bill/receipt", { 
      state: { 
        ...orderData, 
        repairId: item.id,
        selectedPart: item.selectedPart,
        selectedParts: item.selectedParts || (item.selectedPart ? [item.selectedPart] : undefined),
        additionalParts: item.additionalParts || undefined,
        returnTo: "/repairs/bill/management", // กลับไปที่จัดการใบแจ้งซ่อม
      } 
    });
  };

  const handleEditBill = async (item: RepairItem) => {
    setIsLoadingRepair(true);
    setEditingRepair(item);
    try {
      // Load full repair data from API
      const response = await apiClient.getRepairById(item.id);
      if (response.status === 'success' && response.data) {
        const repair = response.data;
        setEditFormData({
          deviceColor: repair.deviceColor || "",
          screenLockCode: repair.screenLockCode || "",
          problemSymptoms: repair.problemSymptoms || repair.problemDescription || "",
          estimatedPrice: repair.estimatedPrice || 0,
          repairSummaryPrice: repair.repairSummaryPrice || repair.totalCost || 0,
          selectedParts: repair.selectedParts || [],
          additionalParts: repair.additionalParts || [],
        });
        setEditDialogOpen(true);
      } else {
        // Fallback to item data
        setEditFormData({
          deviceColor: "",
          screenLockCode: "",
          problemSymptoms: language === "th" ? item.issueTh : item.issue,
          estimatedPrice: item.estimatedCost,
          repairSummaryPrice: item.estimatedCost,
          selectedParts: item.selectedParts || [],
          additionalParts: item.additionalParts || [],
        });
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading repair data:', error);
      // Fallback to item data
      setEditFormData({
        deviceColor: "",
        screenLockCode: "",
        problemSymptoms: language === "th" ? item.issueTh : item.issue,
        estimatedPrice: item.estimatedCost,
        repairSummaryPrice: item.estimatedCost,
        selectedParts: item.selectedParts || [],
        additionalParts: item.additionalParts || [],
      });
      setEditDialogOpen(true);
    } finally {
      setIsLoadingRepair(false);
    }
  };

  // Calculate total price from parts
  const calculateTotalPrice = () => {
    let total = 0;
    if (editFormData.selectedParts && Array.isArray(editFormData.selectedParts)) {
      total += editFormData.selectedParts.reduce((sum: number, part: any) => {
        return sum + (parseFloat(String(part.price || 0)) || 0);
      }, 0);
    }
    if (editFormData.additionalParts && Array.isArray(editFormData.additionalParts)) {
      total += editFormData.additionalParts.reduce((sum: number, part: any) => {
        return sum + (parseFloat(String(part.price || 0)) || 0);
      }, 0);
    }
    return total;
  };

  // Load parts from API
  const loadParts = async () => {
    setIsLoadingParts(true);
    try {
      const response = await apiClient.getParts();
      if (response.status === 'success' && response.data) {
        setPartsList(response.data);
      }
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setIsLoadingParts(false);
    }
  };

  // Load parts when part dialog opens
  useEffect(() => {
    if (isPartDialogOpen) {
      loadParts();
    }
  }, [isPartDialogOpen]);

  // Update price when parts change
  useEffect(() => {
    if (editDialogOpen && editFormData) {
      const totalPrice = calculateTotalPrice();
      if (totalPrice > 0) {
        setEditFormData((prev: any) => ({
          ...prev,
          estimatedPrice: totalPrice,
          repairSummaryPrice: totalPrice,
        }));
      }
    }
  }, [editFormData?.selectedParts, editFormData?.additionalParts, editDialogOpen]);

  // Get unique categories from parts
  const getUniqueCategories = () => {
    const categories = new Map<string, { name: string; nameTh: string; count: number }>();
    partsList.forEach((part: any) => {
      const categoryKey = part.category || "Others";
      const categoryTh = part.categoryTh || "อื่นๆ";
      if (!categories.has(categoryKey)) {
        categories.set(categoryKey, {
          name: categoryKey,
          nameTh: categoryTh,
          count: 0,
        });
      }
      const cat = categories.get(categoryKey)!;
      cat.count += 1;
    });
    return Array.from(categories.values()).sort((a, b) => 
      language === "th" ? a.nameTh.localeCompare(b.nameTh) : a.name.localeCompare(b.name)
    );
  };

  // Get parts filtered by selected category
  const getPartsByCategory = (category: string | null) => {
    if (!category) return [];
    return partsList.filter((part: any) => {
      const partCategory = part.category || "Others";
      return partCategory === category;
    });
  };

  // Filter parts based on search query and selected category
  const filteredAvailableParts = (() => {
    let parts = selectedCategory 
      ? getPartsByCategory(selectedCategory)
      : partsList;
    
    if (partSearchQuery.trim()) {
      const query = partSearchQuery.toLowerCase();
      parts = parts.filter((part: any) => {
        const nameMatch = part.name?.toLowerCase().includes(query);
        const nameThMatch = part.nameTh?.toLowerCase().includes(query);
        const categoryMatch = part.category?.toLowerCase().includes(query);
        return nameMatch || nameThMatch || categoryMatch;
      });
    }
    
    return parts;
  })();

  // Get stock status
  const getPartStockStatus = (stock: number) => {
    if (stock === 0) return "out";
    if (stock <= 5) return "low";
    return "high";
  };

  const handleAddPartFromInventory = (partId: string) => {
    const part = partsList.find((p: any) => p.id === partId);
    if (part) {
      const newSelectedParts = [...(editFormData.selectedParts || [])];
      // Check if part already exists
      if (!newSelectedParts.find((p: any) => p.id === partId)) {
        newSelectedParts.push({
          id: part.id,
          partNumber: part.partNumber,
          name: part.name,
          nameTh: part.nameTh || part.name,
          price: part.price,
        });
        setEditFormData({ ...editFormData, selectedParts: newSelectedParts });
      }
      setIsPartDialogOpen(false);
      setPartSearchQuery("");
      setSelectedCategory(null);
    }
  };

  const handleRemovePartFromInventory = (partId: string) => {
    const newSelectedParts = (editFormData.selectedParts || []).filter((p: any) => p.id !== partId);
    setEditFormData({ ...editFormData, selectedParts: newSelectedParts });
  };

  const handleSaveEdit = async () => {
    if (!editingRepair) return;

    setIsSaving(true);
    try {
      // Calculate total from parts
      const totalPrice = calculateTotalPrice();
      const taxRate = 0.07;
      const subtotal = totalPrice;
      const totalCost = subtotal * (1 + taxRate);

      const updateData: any = {
        deviceColor: editFormData.deviceColor || undefined,
        screenLockCode: editFormData.screenLockCode || undefined,
        problemSymptoms: editFormData.problemSymptoms || undefined,
        estimatedPrice: totalPrice > 0 ? totalPrice : editFormData.estimatedPrice,
        repairSummaryPrice: totalPrice > 0 ? totalPrice : editFormData.repairSummaryPrice,
        totalCost: totalPrice > 0 ? totalCost : undefined,
        partsCost: totalPrice > 0 ? subtotal : undefined,
        additionalParts: editFormData.additionalParts && editFormData.additionalParts.length > 0 
          ? editFormData.additionalParts 
          : undefined,
      };

      // Update selectedPartIds if selectedParts changed
      if (editFormData.selectedParts && Array.isArray(editFormData.selectedParts) && editFormData.selectedParts.length > 0) {
        const partIds = editFormData.selectedParts
          .map((part: any) => part.id)
          .filter((id: any) => id);
        if (partIds.length > 0) {
          updateData.selectedPartIds = partIds;
        }
      }

      const response = await apiClient.updateRepair(editingRepair.id, updateData);
      if (response.status === "success") {
        toast({
          title: language === "th" ? "บันทึกสำเร็จ" : "Saved successfully",
          description: language === "th" 
            ? "อัพเดทใบแจ้งซ่อมเรียบร้อยแล้ว กำลังแสดงบิลที่อัพเดทล่าสุด..." 
            : "Repair bill updated successfully. Showing latest bill...",
        });
        setEditDialogOpen(false);
        setEditingRepair(null);
        await refreshRepairs();
        
        // Load updated repair data and navigate to bill view
        try {
          const updatedRepairResponse = await apiClient.getRepairById(editingRepair.id);
          if (updatedRepairResponse.status === 'success' && updatedRepairResponse.data) {
            const updatedRepair = updatedRepairResponse.data;
            const updatedItem = repairs.find(r => r.id === editingRepair.id);
            if (updatedItem) {
              const orderData = repairItemToBillData(updatedItem, language);
              navigate("/repairs/bill/order", { 
                state: { 
                  ...orderData, 
                  repairId: updatedItem.id,
                  selectedParts: updatedRepair.selectedParts || [],
                  additionalParts: updatedRepair.additionalParts || [],
                  returnTo: "/repairs/bill/management", // กลับไปที่จัดการใบแจ้งซ่อม
                } 
              });
            }
          }
        } catch (error) {
          console.error('Error loading updated repair:', error);
        }
      } else {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: error instanceof Error 
          ? error.message 
          : (language === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">
              {language === "th" ? "จัดการใบแจ้งซ่อม" : "Repair Bill Management"}
            </h1>
            <p className="page-description">
              {language === "th"
                ? "ดู แก้ไข และพิมพ์ใบแจ้งซ่อมทั้งหมด"
                : "View, edit, and print all repair bills."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/repairs")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {language === "th" ? "กลับ" : "Back"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  {language === "th" ? "รายการใบแจ้งซ่อม" : "Repair Bills List"}
                </CardTitle>
                <CardDescription>
                  {language === "th"
                    ? "คลิกดูรายละเอียดเพื่อดูหรือพิมพ์ใบแจ้งซ่อม"
                    : "Click view details to view or print repair bills."}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === "th" ? "ค้นหา..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRepairs.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {searchQuery
                  ? (language === "th" ? "ไม่พบผลการค้นหา" : "No search results found.")
                  : (language === "th" ? "ยังไม่มีใบแจ้งซ่อมในระบบ" : "No repair bills in the system.")}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-3 font-medium">{t("orderId")}</th>
                        <th className="text-left p-3 font-medium">{t("customer")}</th>
                        <th className="text-left p-3 font-medium">{t("device")}</th>
                        <th className="text-left p-3 font-medium">{t("issue")}</th>
                        <th className="text-right p-3 font-medium">{t("estCost")}</th>
                        <th className="text-center p-3 font-medium">
                          {language === "th" ? "สถานะ" : "Status"}
                        </th>
                        <th className="text-center p-3 font-medium w-48">
                          {language === "th" ? "จัดการ" : "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRepairs.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30"
                        >
                          <td className="p-3 font-mono text-muted-foreground">{item.id}</td>
                          <td className="p-3">
                            <div className="font-medium">{item.customer}</div>
                            {item.phone && (
                              <div className="text-xs mt-0.5 text-muted-foreground">{item.phone}</div>
                            )}
                          </td>
                          <td className="p-3">{item.device}</td>
                          <td className="p-3">
                            <div className="max-w-xs truncate">
                              {language === "th" ? item.issueTh : item.issue}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            ฿{item.estimatedCost.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                item.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : item.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : item.status === "pending"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              )}
                            >
                              {item.status === "completed"
                                ? language === "th" ? "เสร็จสิ้น" : "Completed"
                                : item.status === "in-progress"
                                ? language === "th" ? "กำลังซ่อม" : "In Progress"
                                : item.status === "pending"
                                ? language === "th" ? "รอดำเนินการ" : "Pending"
                                : item.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleViewBill(item)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {language === "th" ? "ดูบิล" : "View Bill"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleViewReceipt(item)}
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                {language === "th" ? "ดูใบเสร็จ" : "View Receipt"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleEditBill(item)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                                {language === "th" ? "แก้ไข" : "Edit"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {filteredRepairs.length > 0 && totalPages > 1 && (
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
                <div className="text-sm text-muted-foreground text-center mt-4">
                  {language === "th"
                    ? `แสดง ${startIndex + 1}-${Math.min(endIndex, filteredRepairs.length)} จาก ${filteredRepairs.length} รายการ`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredRepairs.length)} of ${filteredRepairs.length} items`}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Bill Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            {editingRepair && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {language === "th" ? "แก้ไขใบแจ้งซ่อม" : "Edit Repair Bill"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "th"
                      ? `แก้ไขข้อมูลใบแจ้งซ่อม ${editingRepair.id}`
                      : `Edit repair bill ${editingRepair.id}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "th" ? "สี" : "Color"}</Label>
                      <Input
                        value={editFormData.deviceColor || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, deviceColor: e.target.value })
                        }
                        placeholder={language === "th" ? "เช่น สีดำ" : "e.g., Black"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "th" ? "รหัสล็อคหน้าจอ" : "Screen Lock Code"}</Label>
                      <Input
                        value={editFormData.screenLockCode || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, screenLockCode: e.target.value })
                        }
                        placeholder={language === "th" ? "เช่น 1234" : "e.g., 1234"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "อาการเสีย" : "Problem Symptoms"}</Label>
                    <Textarea
                      value={editFormData.problemSymptoms || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, problemSymptoms: e.target.value })
                      }
                      rows={3}
                      placeholder={language === "th" ? "อธิบายอาการเสีย..." : "Describe the problem..."}
                    />
                  </div>

                  {/* Selected Parts (from inventory) */}
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ชิ้นส่วนที่มีในคลังสินค้า" : "Parts from Inventory"}</Label>
                    <div className="space-y-2 border rounded-lg p-3">
                      {editFormData.selectedParts && editFormData.selectedParts.length > 0 ? (
                        editFormData.selectedParts.map((part: any, index: number) => (
                          <div key={part.id || index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex-1">
                              <p className="font-medium">{part.nameTh || part.name}</p>
                              {part.partNumber && (
                                <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">฿{parseFloat(String(part.price || 0)).toLocaleString()}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemovePartFromInventory(part.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          {language === "th" ? "ไม่มีชิ้นส่วน" : "No parts selected"}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPartDialogOpen(true)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "th" ? "เพิ่มชิ้นส่วนจากคลังสินค้า" : "Add Parts from Inventory"}
                      </Button>
                    </div>
                  </div>

                  {/* Additional Parts (not in inventory) */}
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ชิ้นส่วนเพิ่มเติม (ไม่มีในคลังสินค้า)" : "Additional Parts (Not in Inventory)"}</Label>
                    <div className="space-y-2 border rounded-lg p-3">
                      {((editFormData.additionalParts as any[]) || []).map((part, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">{language === "th" ? "ชื่อชิ้นส่วน" : "Part Name"}</Label>
                            <Input
                              value={part.name || ""}
                              onChange={(e) => {
                                const newParts = [...((editFormData.additionalParts as any[]) || [])];
                                newParts[index] = { ...newParts[index], name: e.target.value };
                                setEditFormData({ ...editFormData, additionalParts: newParts });
                              }}
                              placeholder={language === "th" ? "เช่น ปุ่มเสีย" : "e.g., Broken button"}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">{language === "th" ? "ชื่อภาษาไทย" : "Name (Thai)"}</Label>
                            <Input
                              value={part.nameTh || ""}
                              onChange={(e) => {
                                const newParts = [...((editFormData.additionalParts as any[]) || [])];
                                newParts[index] = { ...newParts[index], nameTh: e.target.value };
                                setEditFormData({ ...editFormData, additionalParts: newParts });
                              }}
                              placeholder={language === "th" ? "เช่น ปุ่มเสีย" : "e.g., ปุ่มเสีย"}
                            />
                          </div>
                          <div className="w-32">
                            <Label className="text-xs">{language === "th" ? "ราคา" : "Price"}</Label>
                            <Input
                              type="number"
                              value={part.price || 0}
                              onChange={(e) => {
                                const newParts = [...((editFormData.additionalParts as any[]) || [])];
                                newParts[index] = { ...newParts[index], price: parseFloat(e.target.value) || 0 };
                                setEditFormData({ ...editFormData, additionalParts: newParts });
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newParts = [...((editFormData.additionalParts as any[]) || [])];
                              newParts.splice(index, 1);
                              setEditFormData({ ...editFormData, additionalParts: newParts });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newParts = [...((editFormData.additionalParts as any[]) || [])];
                          newParts.push({ name: "", nameTh: "", price: 0 });
                          setEditFormData({ ...editFormData, additionalParts: newParts });
                        }}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "th" ? "เพิ่มชิ้นส่วน" : "Add Part"}
                      </Button>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{language === "th" ? "รวมราคาชิ้นส่วน" : "Total Parts Price"}</span>
                      <span className="font-semibold text-lg">
                        ฿{calculateTotalPrice().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{language === "th" ? "ประเมินราคา" : "Estimated Price"}</span>
                      <span>฿{parseFloat(String(editFormData.estimatedPrice || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{language === "th" ? "รวมทั้งสิ้น" : "Total"}</span>
                      <span>฿{calculateTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setEditingRepair(null);
                    }}
                    disabled={isSaving}
                  >
                    {language === "th" ? "ยกเลิก" : "Cancel"}
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={isSaving || isLoadingRepair}>
                    {isSaving
                      ? (language === "th" ? "กำลังบันทึก..." : "Saving...")
                      : (language === "th" ? "บันทึก" : "Save")}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Part Selection Dialog */}
        <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === "th" ? "เลือกชิ้นส่วนจากคลังสินค้า" : "Select Parts from Inventory"}
              </DialogTitle>
              <DialogDescription>
                {language === "th"
                  ? "เลือกชิ้นส่วนที่ต้องการเพิ่มในใบแจ้งซ่อม"
                  : "Select parts to add to the repair bill"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!selectedCategory ? (
                // Step 1: Show categories
                <Command className="rounded-lg border shadow-md">
                  <CommandInput
                    placeholder={language === "th" ? "ค้นหาหมวดหมู่..." : "Search categories..."}
                    value={partSearchQuery}
                    onValueChange={setPartSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {language === "th" ? "ไม่พบหมวดหมู่" : "No categories found"}
                    </CommandEmpty>
                    <CommandGroup heading={language === "th" ? "หมวดหมู่" : "Categories"}>
                      {getUniqueCategories()
                        .filter((cat) => {
                          if (!partSearchQuery.trim()) return true;
                          const query = partSearchQuery.toLowerCase();
                          return cat.name.toLowerCase().includes(query) || 
                                 cat.nameTh.toLowerCase().includes(query);
                        })
                        .map((category) => (
                          <CommandItem
                            key={category.name}
                            value={category.name}
                            onSelect={() => setSelectedCategory(category.name)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <span className="font-medium">
                                {language === "th" ? category.nameTh : category.name}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({category.count} {language === "th" ? "รายการ" : "items"})
                              </span>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              ) : (
                // Step 2: Show parts in selected category
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setPartSearchQuery("");
                    }}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {language === "th" ? "กลับไปหมวดหมู่" : "Back to Categories"}
                  </Button>
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput
                      placeholder={language === "th" ? "พิมพ์ชื่ออะไหล่..." : "Type part name..."}
                      value={partSearchQuery}
                      onValueChange={setPartSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {language === "th" ? "ไม่พบอะไหล่" : "No parts found"}
                      </CommandEmpty>
                      <CommandGroup heading={language === "th" ? "อะไหล่ที่เลือกได้" : "Available Parts"}>
                        {filteredAvailableParts.map((part: any) => {
                          const stockStatus = getPartStockStatus(part.stockQuantity || 0);
                          const isAlreadySelected = editFormData.selectedParts?.some((p: any) => p.id === part.id);
                          return (
                            <CommandItem
                              key={part.id}
                              value={part.id}
                              onSelect={() => !isAlreadySelected && handleAddPartFromInventory(part.id)}
                              disabled={isAlreadySelected}
                              className={cn(
                                "flex items-center justify-between cursor-pointer",
                                isAlreadySelected && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex flex-col gap-1 flex-1">
                                <span className="font-medium">
                                  {language === "th" ? part.nameTh || part.name : part.name || part.nameTh}
                                </span>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>
                                    {language === "th" ? "สต็อก" : "Stock"}: {part.stockQuantity || 0}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      stockStatus === "high" &&
                                        "border-green-500/60 bg-green-500/15 text-green-700 dark:text-green-400",
                                      stockStatus === "low" &&
                                        "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-400",
                                      stockStatus === "out" &&
                                        "border-destructive/60 bg-destructive/15 text-destructive"
                                    )}
                                  >
                                    {stockStatus === "high" && (language === "th" ? "พอใช้" : "In Stock")}
                                    {stockStatus === "low" && (language === "th" ? "น้อย" : "Low")}
                                    {stockStatus === "out" && (language === "th" ? "หมด" : "Out")}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary">
                                  ฿{Number(part.price || 0).toLocaleString()}
                                </span>
                                {isAlreadySelected && (
                                  <Badge variant="outline" className="text-xs">
                                    {language === "th" ? "เลือกแล้ว" : "Selected"}
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPartDialogOpen(false)}>
                {language === "th" ? "ปิด" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default RepairBillManagement;
