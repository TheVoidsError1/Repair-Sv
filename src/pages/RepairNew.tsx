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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Time30Select } from "@/components/ui/time-30-select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs } from "@/contexts/RepairsContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getPartStockStatus, type Part } from "@/lib/partsData";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/types/repairOrder";
import { AlertTriangle, ArrowLeft, Calendar as CalendarIcon, History, Package, Phone, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/** อ่าน type จาก URL: in-store → walk_in, leave-device → drop_off */
function getServiceTypeFromSearchParams(searchParams: URLSearchParams): ServiceType {
  const type = searchParams.get("type");
  if (type === "leave-device") return "drop_off";
  return "walk_in"; // in-store หรือไม่มี = รับหน้าร้าน
}

function getTodayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/** ปัดเวลา HH:mm ให้เหลือเฉพาะนาที 00 หรือ 30 */
function roundTimeTo30Min(timeStr: string): string {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "09:00";
  let h = parseInt(m[1], 10);
  let min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return "09:00";
  if (min < 15) min = 0;
  else if (min < 45) min = 30;
  else {
    h += 1;
    min = 0;
    if (h >= 24) {
      h = 23;
      min = 30;
    }
  }
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

/** IMEI/Serial: รับอักษรและตัวเลขได้ และต้องไม่เกิน 15 หลัก (ไม่บังคับกรอก) */
function validateSerialNumber(value: string): { valid: boolean; message?: string } {
  const trimmed = value.trim();
  // ถ้าไม่กรอกก็ไม่ต้อง validate (ไม่บังคับ)
  if (!trimmed) return { valid: true };
  // ถ้ากรอกแล้ว ต้องไม่เกิน 15 หลัก
  if (trimmed.length > 15) {
    return { valid: false, message: "หมายเลข IMEI / Serial Number ต้องไม่เกิน 15 หลัก" };
  }
  return { valid: true };
}

// Interface for Part from API
interface PartFromAPI {
  id: string;
  name: string;
  nameTh?: string;
  partNumber?: string;
  costPrice: number | string;
  price: number | string;
  stockQuantity: number;
  minStockLevel: number;
  category?: string;
  categoryTh?: string;
}

// Convert API part to frontend Part format
function convertPartFromAPI(part: PartFromAPI): Part {
  return {
    id: part.id,
    name: part.name,
    nameTh: part.nameTh || part.name,
    category: part.category || "Others",
    categoryTh: part.categoryTh || "อื่นๆ",
    stock: part.stockQuantity,
    minStock: part.minStockLevel,
    cost: Number(part.costPrice),
    sellPrice: Number(part.price),
  };
}

const initialFormData = {
  serialNumber: "",
  customer: "",
  phone: "",
  phoneBackup: "",
  lineId: "",
  model: "",
  color: "",
  screenLockCode: "",
  problemSymptoms: "",
  deposit: "",
  estimatedPrice: "",
  dateOfReport: "",
  timeOfReport: "",
  scheduledPickupTime: "",
  warrantyDays: "90",
};

const RepairNew = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { repairs, refreshRepairs } = useRepairs();
  const [formData, setFormData] = useState(initialFormData);
  const [serialError, setSerialError] = useState("");
  const [duplicateSnWarning, setDuplicateSnWarning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partsList, setPartsList] = useState<Part[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const { toast } = useToast();

  // Customer search states
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isRepairHistoryDialogOpen, setIsRepairHistoryDialogOpen] = useState(false);
  const [customerRepairHistory, setCustomerRepairHistory] = useState<any[]>([]);

  // Part selection dialog states
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /** รูปแบบการรับบริการ จาก URL (?type=in-store | type=leave-device) */
  const serviceType: ServiceType = getServiceTypeFromSearchParams(searchParams);

  /** เวลารับเครื่อง (HH:mm) ใช้ทั้ง walk_in และ drop_off — นาทีเฉพาะ 00 หรือ 30 */
  const [receiveTime, setReceiveTime] = useState(() =>
    roundTimeTo30Min(
      `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`
    )
  );
  /** วันมารับเครื่อง (YYYY-MM-DD) ใช้เฉพาะ drop_off */
  const [receiveDate, setReceiveDate] = useState(() => getTodayIsoDate());

  const WARRANTY_OPTIONS: Array<{ value: "90" | "180" | "365"; labelTh: string; labelEn: string }> = [
    { value: "90", labelTh: "3 เดือน", labelEn: "3 months" },
    { value: "180", labelTh: "6 เดือน", labelEn: "6 months" },
    { value: "365", labelTh: "1 ปี", labelEn: "1 year" },
  ];

  const warrantyLabel =
    WARRANTY_OPTIONS.find((o) => o.value === formData.warrantyDays)?.[language === "th" ? "labelTh" : "labelEn"] ??
    (language === "th" ? "3 เดือน" : "3 months");

  const receiveDateAsDate = receiveDate
    ? (() => {
        const [y, m, d] = receiveDate.split("-").map((n) => parseInt(n, 10));
        if (!y || !m || !d) return undefined;
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? undefined : dt;
      })()
    : undefined;

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /** ตั้งวันที่และเวลาแจ้งซ่อม = ช่วงที่กดเข้ามาสร้างใบแจ้งซ่อม (โหลดหน้านี้) — เรียกครั้งเดียวตอนเปิดหน้า */
  const setReportDateTimeOnOpen = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      dateOfReport: now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      timeOfReport: roundTimeTo30Min(timeStr),
    }));
  };

  useEffect(() => {
    setReportDateTimeOnOpen();
  }, []);

  // Load parts from API
  const loadParts = async () => {
    setIsLoadingParts(true);
    try {
      const response = await apiClient.getParts();
      if (response.status === 'success' && response.data) {
        const convertedParts = (response.data as PartFromAPI[]).map(convertPartFromAPI);
        setPartsList(convertedParts);
      } else {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (language === "th" ? "ไม่สามารถโหลดข้อมูลอะไหล่ได้" : "Failed to load parts"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading parts:', error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "ไม่สามารถโหลดข้อมูลอะไหล่ได้" : "Failed to load parts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingParts(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [language, toast]);

  // Validate and show confirmation dialog
  const handleCreateOrder = async () => {
    setSerialError("");
    setDuplicateSnWarning(false);
    setFieldErrors({});
    
    const errors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.customer.trim()) {
      errors.customer = language === "th" ? "กรุณากรอกชื่อลูกค้า" : "Please enter customer name";
    }

    if (!formData.phone.trim()) {
      errors.phone = language === "th" ? "กรุณากรอกเบอร์โทรศัพท์" : "Please enter phone number";
    }

    const sn = formData.serialNumber.trim();
    // Validate serial number only if it's provided (not required)
    if (sn) {
      const validation = validateSerialNumber(formData.serialNumber);
      if (!validation.valid) {
        errors.serialNumber = language === "th" ? (validation.message ?? "หมายเลข IMEI / Serial Number ไม่ถูกต้อง") : (validation.message ?? "Invalid IMEI / Serial Number");
        setSerialError(errors.serialNumber);
      }
    }

    if (!formData.problemSymptoms.trim()) {
      errors.problemSymptoms = language === "th" ? "กรุณากรอกอาการเสีย" : "Please enter problem symptoms";
    }

    // Validate warrantyDays (must be one of the allowed options)
    if (!WARRANTY_OPTIONS.some((o) => o.value === formData.warrantyDays)) {
      errors.warrantyDays = language === "th" ? "กรุณาเลือกระยะเวลารับประกัน (3 เดือน / 6 เดือน / 1 ปี)" : "Please select warranty period (3/6/12 months)";
    }

    // If there are errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: language === "th" ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "Please fill in all required fields",
        description: language === "th" 
          ? "กรุณาตรวจสอบข้อมูลที่กรอกแล้วลองอีกครั้ง"
          : "Please check the entered information and try again",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicate serial number in database (only if serial number is provided)
    if (sn) {
      try {
        const existingRepairs = await apiClient.getRepairs();
        if (existingRepairs.status === 'success' && existingRepairs.data) {
          const isDuplicate = existingRepairs.data.some(
            (r: any) => r.serialNumber && r.serialNumber.trim().toLowerCase() === sn.toLowerCase()
          );
          if (isDuplicate) {
            setDuplicateSnWarning(true);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking duplicate serial number:', error);
      }
    }

    doSubmitOrder();
  };

  const doSubmitOrder = async () => {
    setIsSubmitting(true);

    try {
      const sn = formData.serialNumber.trim();
      const now = new Date();
      const defaultDate = now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const todayIso = getTodayIsoDate();
      const dateForPickup = serviceType === "walk_in" ? todayIso : receiveDate;
      const timePart = /^\d{1,2}:\d{2}$/.test(receiveTime.trim())
        ? `${receiveTime.trim().split(":").map((x) => x.padStart(2, "0")).join(":")}`.slice(0, 5)
        : "09:00";
      const scheduledPickupTimeIso = dateForPickup && receiveTime ? `${dateForPickup}T${timePart}:00` : undefined;

      // สรุปราคาซ่อม (ซ่อนไม่ให้กรอกเอง): ใช้ "ประเมินราคา" เป็นหลัก, fallback เป็นผลรวมราคาอะไหล่
      const partsTotal = selectedParts.reduce((sum, part) => sum + (Number(part.sellPrice) || 0), 0);
      const summaryPriceStr = (formData.estimatedPrice || (partsTotal > 0 ? String(partsTotal) : "")).trim();

      // Prepare data for API
      const repairData = {
        customer: formData.customer.trim(),
        phone: formData.phone.trim(),
        phoneBackup: formData.phoneBackup.trim() || undefined,
        lineId: formData.lineId.trim() || undefined,
        serialNumber: sn || undefined,
        model: formData.model.trim(),
        color: formData.color.trim(),
        screenLockCode: formData.screenLockCode.trim(),
        problemSymptoms: formData.problemSymptoms.trim(),
        deposit: formData.deposit || undefined,
        estimatedPrice: formData.estimatedPrice || undefined,
        repairSummaryPrice: summaryPriceStr || undefined,
        dateOfReport: formData.dateOfReport || defaultDate,
        timeOfReport: formData.timeOfReport || undefined,
        scheduledPickupTime: scheduledPickupTimeIso,
        service_type: serviceType,
        receive_date: dateForPickup,
        receive_time: receiveTime,
        warrantyDays: Number(formData.warrantyDays),
        selectedPartIds: selectedPartIds.length > 0 ? selectedPartIds : undefined,
      };

      const response = await apiClient.createRepair(repairData);

      if (response.status === 'success' && response.data) {
        toast({
          title: language === "th" ? "บันทึกข้อมูลสำเร็จ" : "Repair order created successfully",
          description: language === "th" 
            ? `เลขที่ใบแจ้งซ่อม: ${response.data.repairNumber}`
            : `Repair Number: ${response.data.repairNumber}`,
        });

        // Refresh repairs list
        await refreshRepairs();

        // Refresh parts list to update stock quantities
        await loadParts();

        // Reset form
        setFormData(initialFormData);
        setSelectedPartIds([]);
        setIsEstimatedPriceManuallyEdited(false);
        setReceiveTime(roundTimeTo30Min(
          `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`
        ));
        setReceiveDate(getTodayIsoDate());
        setReportDateTimeOnOpen();

        // ไปแสดงหน้าใบแจ้งซ่อม (ใบรับซ่อม) ของงานซ่อมที่สร้างใหม่
        const newRepairId = response.data.id ?? response.data.repairNumber;
        if (newRepairId) {
          navigate("/repairs/bill/order", { state: { repairId: newRepairId } });
        } else {
          navigate("/repairs");
        }
      } else {
        throw new Error(response.message || 'Failed to create repair');
      }
    } catch (error) {
      console.error('Error creating repair:', error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: error instanceof Error ? error.message : (language === "th" ? "ไม่สามารถบันทึกข้อมูลได้" : "Failed to create repair"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out already selected parts from dropdown
  const availableParts = partsList.filter((part) => !selectedPartIds.includes(part.id));
  
  // Get selected parts data
  const selectedParts = selectedPartIds
    .map((id) => partsList.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);
  
  const hasOutOfStockPart = selectedParts.some((part) => part.stock === 0);
  const canCreateOrder = !hasOutOfStockPart;

  // Track if user has manually edited estimatedPrice
  const [isEstimatedPriceManuallyEdited, setIsEstimatedPriceManuallyEdited] = useState(false);

  // Calculate total price of selected parts and update estimatedPrice automatically
  useEffect(() => {
    if (selectedParts.length > 0) {
      const totalPrice = selectedParts.reduce((sum, part) => sum + part.sellPrice, 0);
      // Only auto-update if user hasn't manually edited the field
      if (!isEstimatedPriceManuallyEdited) {
        setFormData((prev) => ({
          ...prev,
          estimatedPrice: totalPrice.toString(),
        }));
      }
    } else if (selectedParts.length === 0) {
      // If all parts are removed, clear estimatedPrice only if it was auto-calculated
      if (!isEstimatedPriceManuallyEdited) {
        setFormData((prev) => ({
          ...prev,
          estimatedPrice: "",
        }));
      }
    }
  }, [selectedPartIds, partsList, isEstimatedPriceManuallyEdited]); // Recalculate when selected parts or parts list changes

  // Handle manual edit of estimatedPrice
  const handleEstimatedPriceChange = (value: string) => {
    setIsEstimatedPriceManuallyEdited(true);
    handleInputChange("estimatedPrice", value);
  };

  const handleAddPart = (partId: string) => {
    if (partId && !selectedPartIds.includes(partId)) {
      setSelectedPartIds([...selectedPartIds, partId]);
      setIsPartDialogOpen(false);
      setPartSearchQuery("");
      setSelectedCategory(null);
    }
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setPartSearchQuery("");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setPartSearchQuery("");
  };

  const handleOpenPartDialog = () => {
    setIsPartDialogOpen(true);
    setPartSearchQuery("");
    setSelectedCategory(null);
  };

  // Get unique categories from available parts
  const getUniqueCategories = () => {
    const categories = new Map<string, { name: string; nameTh: string; count: number }>();
    availableParts.forEach((part) => {
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
    return availableParts.filter((part) => {
      const partCategory = part.category || "Others";
      return partCategory === category;
    });
  };

  // Filter parts based on search query and selected category
  const filteredAvailableParts = (() => {
    let parts = selectedCategory 
      ? getPartsByCategory(selectedCategory)
      : availableParts;
    
    if (partSearchQuery.trim()) {
      const query = partSearchQuery.toLowerCase();
      parts = parts.filter((part) => {
        const nameMatch = part.name.toLowerCase().includes(query);
        const nameThMatch = part.nameTh.toLowerCase().includes(query);
        const categoryMatch = part.category?.toLowerCase().includes(query);
        const categoryThMatch = part.categoryTh?.toLowerCase().includes(query);
        return nameMatch || nameThMatch || categoryMatch || categoryThMatch;
      });
    }
    
    return parts;
  })();

  const handleRemovePart = (partId: string) => {
    setSelectedPartIds(selectedPartIds.filter((id) => id !== partId));
  };

  // Customer search functions
  const handleSearchCustomers = async (query: string) => {
    setIsSearching(true);
    try {
      // If query is empty or less than 2 characters, still search (will return all customers)
      const searchQuery = query.trim();
      const response = await apiClient.searchCustomers(searchQuery);
      if (response.status === 'success' && response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    setIsSearchDialogOpen(false);
    setSearchQuery("");

    // Load customer data with repair history to get complete information
    let customerData = customer;
    let latestSerialNumber = "";
    let repairs: any[] = [];
    
    try {
      const response = await apiClient.getCustomerWithRepairs(customer.id);
      if (response.status === 'success' && response.data) {
        // Use the complete customer data from API (includes lineId, lineIdRes)
        customerData = response.data;
        repairs = response.data.repairs || [];
        setCustomerRepairHistory(repairs);
        
        // Get serial number from the latest repair (first item since sorted by newest)
        if (repairs.length > 0) {
          const latestRepair = repairs[0];
          latestSerialNumber = latestRepair.serialNumber || "";
        }
        
        if (repairs.length > 0) {
          toast({
            title: language === "th" ? "พบประวัติการซ่อม" : "Repair history found",
            description: language === "th" 
              ? `พบประวัติการซ่อม ${repairs.length} รายการ${latestSerialNumber ? ` - Serial Number ล่าสุด: ${latestSerialNumber}` : ''}`
              : `Found ${repairs.length} repair history${latestSerialNumber ? ` - Latest Serial: ${latestSerialNumber}` : ''}`,
          });
        }
      }
    } catch (error) {
      console.error('Error loading customer repair history:', error);
    }

    // Load customer data into form (use customerData which has complete info)
    const customerName = customerData.fullName || `${customerData.firstName} ${customerData.lastName || ''}`.trim();
    
    // Update form with customer data including Line ID and latest serial number
    setFormData((prev) => ({
      ...prev,
      customer: customerName,
      phone: customerData.phone || "",
      phoneBackup: customerData.phoneBackup || "", // เบอร์สำรอง
      lineId: customerData.lineId || "", // Line ID หลัก
      serialNumber: latestSerialNumber, // Serial Number จากประวัติการซ่อมล่าสุด
    }));
  };

  const handleOpenSearchDialog = async () => {
    setIsSearchDialogOpen(true);
    setSearchQuery("");
    // Load all customers when dialog opens
    setIsSearching(true);
    try {
      const response = await apiClient.searchCustomers("");
      if (response.status === 'success' && response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewRepairHistory = () => {
    if (selectedCustomer && customerRepairHistory.length > 0) {
      setIsRepairHistoryDialogOpen(true);
    } else {
      toast({
        title: language === "th" ? "ไม่มีประวัติการซ่อม" : "No repair history",
        description: language === "th" 
          ? "ลูกค้ารายนี้ยังไม่มีประวัติการซ่อม"
          : "This customer has no repair history",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">{t("createNewRepairOrder")}</h1>
          <p className="page-description">{t("enterCustomerDeviceDetails")}</p>
        </div>

        <Card className="w-full">
          <CardHeader className="border-b border-border/60 py-5 px-6">
            <div className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-lg">{t("createNewRepairOrder")}</CardTitle>
                <CardDescription>{t("enterCustomerDeviceDetails")}</CardDescription>
              </div>
              <div className="flex flex-col items-end rounded-lg bg-muted/50 px-3 py-2 border border-border/50 shrink-0">
                <span className="text-xs text-muted-foreground">{t("dateOfRepairReport")}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formData.dateOfReport ||
                    new Date().toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  {" · "}
                  {formData.timeOfReport ||
                    `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customer">{t("customerName")}</Label>
                  <div className="flex gap-2">
                    {selectedCustomer && customerRepairHistory.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleViewRepairHistory}
                        className="h-7 text-xs"
                      >
                        <History className="h-3 w-3 mr-1" />
                        {language === "th" ? "ประวัติ" : "History"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenSearchDialog}
                      className="h-7 text-xs"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      {language === "th" ? "ค้นหา" : "Search"}
                    </Button>
                  </div>
                </div>
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
                <Label htmlFor="phoneBackup">
                  {language === "th" ? "เบอร์สำรอง" : "Backup Phone"}
                </Label>
                <Input
                  id="phoneBackup"
                  placeholder={language === "th" ? "กรอกเบอร์สำรอง (ถ้ามี)" : "Enter backup phone (optional)"}
                  value={formData.phoneBackup}
                  onChange={(e) => handleInputChange("phoneBackup", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lineId">
                  {language === "th" ? "Line ID (หลัก)" : "Line ID (Primary)"}
                </Label>
                <Input
                  id="lineId"
                  placeholder={language === "th" ? "กรอก Line ID หลัก" : "Enter primary Line ID"}
                  value={formData.lineId}
                  onChange={(e) => handleInputChange("lineId", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="serialNumber">
                  {language === "th" ? "หมายเลข IMEI / Serial Number" : "IMEI / Serial Number"}
                </Label>
                <Input
                  id="serialNumber"
                  placeholder={language === "th" ? "กรอก IMEI / Serial Number (ไม่เกิน 15 หลัก)" : "Enter IMEI / Serial Number (max 15 characters)"}
                  value={formData.serialNumber}
                  maxLength={15}
                  onChange={(e) => {
                    // อนุญาตทั้งตัวเลขและอักษร
                    const value = e.target.value;
                    handleInputChange("serialNumber", value);
                    setSerialError("");
                  }}
                  className={serialError ? "border-destructive" : ""}
                />
                {serialError && (
                  <p className="text-sm text-destructive">{serialError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warrantyDays">{language === "th" ? "ระยะเวลารับประกัน" : "Warranty period"}</Label>
                <Select
                  value={formData.warrantyDays}
                  onValueChange={(v) => {
                    handleInputChange("warrantyDays", v);
                    if (fieldErrors.warrantyDays) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.warrantyDays;
                        return next;
                      });
                    }
                  }}
                >
                  <SelectTrigger id="warrantyDays" className="h-10">
                    <SelectValue placeholder={language === "th" ? "เลือก 3 เดือน / 6 เดือน / 1 ปี" : "Select 3/6/12 months"} />
                  </SelectTrigger>
                  <SelectContent>
                    {WARRANTY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {language === "th" ? o.labelTh : o.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.warrantyDays && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {fieldErrors.warrantyDays}
                  </p>
                )}
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
              <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2">
                {language === "th"
                  ? "เริ่มนับประกันเมื่อสถานะงานซ่อมเป็น “รับเครื่องแล้ว”"
                  : "Warranty starts when repair status becomes “picked-up”."}
              </p>
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
                <Label htmlFor="issue">
                  {t("problemSymptoms")}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="issue"
                  placeholder={t("enterProblemSymptoms")}
                  className={cn("min-h-[100px] resize-y max-h-[200px]", fieldErrors.problemSymptoms ? "border-destructive" : "")}
                  value={formData.problemSymptoms}
                  onChange={(e) => {
                    handleInputChange("problemSymptoms", e.target.value);
                    if (fieldErrors.problemSymptoms) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.problemSymptoms;
                        return newErrors;
                      });
                    }
                  }}
                />
                {fieldErrors.problemSymptoms && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {fieldErrors.problemSymptoms}
                  </p>
                )}
              </div>

              {/* ส่วนเลือกอะไหล่ — ต่อจากอาการเสีย */}
              <div className="grid gap-2 sm:col-span-2 space-y-2">
                <Label htmlFor="part-select">{t("selectPart")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenPartDialog}
                  disabled={isLoadingParts || availableParts.length === 0}
                  className="w-full justify-start text-left font-normal"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isLoadingParts 
                    ? (language === "th" ? "กำลังโหลด..." : "Loading...") 
                    : availableParts.length === 0 
                    ? (language === "th" ? "ไม่มีอะไหล่เหลือ" : "No parts available")
                    : t("selectPartPlaceholder")}
                </Button>
                
                {/* แสดงรายการอะไหล่ที่เลือกแล้ว */}
                {selectedParts.length > 0 && (
                  <div className="space-y-2">
                    {selectedParts.map((part) => {
                      const stockStatus = getPartStockStatus(part.stock);
                      return (
                        <div
                          key={part.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-foreground flex-1">
                            {language === "th" ? part.nameTh : part.name}
                          </span>
                          <span className="text-muted-foreground">
                            {t("partStock")}: {part.stock.toLocaleString()}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              stockStatus === "high" &&
                                "border-green-500/60 bg-green-500/15 text-green-700 dark:text-green-400",
                              stockStatus === "low" &&
                                "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-400",
                              stockStatus === "out" &&
                                "border-destructive/60 bg-destructive/15 text-destructive"
                            )}
                          >
                            {stockStatus === "high" && t("stockStatusHigh")}
                            {stockStatus === "low" && t("stockStatusLow")}
                            {stockStatus === "out" && t("outOfStock")}
                          </Badge>
                          <span className="text-muted-foreground">
                            {t("sellPrice")}: {part.sellPrice.toLocaleString()} {t("baht")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemovePart(part.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {hasOutOfStockPart && (
                  <p className="text-sm text-destructive">{t("outOfStockCannotCreate")}</p>
                )}
              </div>

              {/* รูปแบบการรับบริการ: รับหน้าร้าน = เลือกเฉพาะเวลา, ทิ้งเครื่องไว้ = เลือกวัน+เวลา */}
              {serviceType === "walk_in" && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="receive_time">{t("receiveTimeLabel")}</Label>
                  <Time30Select
                    id="receive_time"
                    value={receiveTime}
                    onChange={(v) => setReceiveTime(roundTimeTo30Min(v))}
                    className="max-w-[140px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "วันที่ใช้วันปัจจุบันอัตโนมัติ (รับซ่อมหน้าร้าน)" : "Date is set to today (walk-in)."}
                  </p>
                </div>
              )}
              {serviceType === "drop_off" && (
                <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
                  <div className="grid gap-2">
                    <Label>{t("pickupDateLabel")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {receiveDateAsDate
                            ? receiveDateAsDate.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : t("pickUpDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={receiveDateAsDate}
                          onSelect={(d) => {
                            if (d) setReceiveDate(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pickup_time">{t("pickupTimeLabel")}</Label>
                    <Time30Select
                      id="pickup_time"
                      value={receiveTime}
                      onChange={(v) => setReceiveTime(roundTimeTo30Min(v))}
                      className="w-full max-w-[140px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    {language === "th" ? "ห้ามเลือกวันย้อนหลัง" : "Past dates are not allowed."}
                  </p>
                </div>
              )}
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
                  onChange={(e) => handleEstimatedPriceChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                {/* ลบช่อง "สรุปราคาซ่อม" ออกจากฟอร์ม: ระบบจะสรุปจาก "ประเมินราคา/อะไหล่" อัตโนมัติ */}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 border-t border-border/60 bg-muted/20 py-5 px-6">
            <Button variant="outline" onClick={() => navigate("/repairs")} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreateOrder} disabled={!canCreateOrder || isSubmitting}>
              {isSubmitting ? (language === "th" ? "กำลังบันทึก..." : "Saving...") : t("createOrder")}
            </Button>
          </CardFooter>
        </Card>

        <AlertDialog open={duplicateSnWarning} onOpenChange={(open) => !open && setDuplicateSnWarning(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "th" ? "หมายเลข IMEI / SN ซ้ำ" : "Duplicate Serial Number"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "th"
                  ? "หมายเลขนี้มีในประวัติงานซ่อมแล้ว การสร้างซ้ำอาจส่งผลต่อการรับประกัน ต้องการดำเนินการต่อหรือไม่?"
                  : "This serial number already exists in repair history. Creating again may affect warranty. Continue anyway?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={doSubmitOrder}>
                {language === "th" ? "ดำเนินการต่อ" : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Customer Search Dialog */}
        <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === "th" ? "ค้นหาลูกค้า" : "Search Customer"}</DialogTitle>
              <DialogDescription>
                {language === "th" 
                  ? "ค้นหาด้วยชื่อหรือเบอร์โทรศัพท์" 
                  : "Search by name or phone number"}
              </DialogDescription>
            </DialogHeader>
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder={language === "th" ? "พิมพ์ชื่อหรือเบอร์โทร..." : "Type name or phone..."}
                value={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value);
                  handleSearchCustomers(value);
                }}
              />
              <CommandList>
                <CommandEmpty>
                  {isSearching 
                    ? (language === "th" ? "กำลังค้นหา..." : "Searching...")
                    : (language === "th" ? "ไม่พบผลลัพธ์" : "No results found")}
                </CommandEmpty>
                <CommandGroup heading={language === "th" ? "ผลการค้นหา" : "Search Results"}>
                  {searchResults.map((customer) => {
                    const customerName = customer.fullName || `${customer.firstName} ${customer.lastName || ''}`.trim();
                    const repairCount = customer.repairs?.length || 0;
                    return (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleSelectCustomer(customer)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{customerName}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {customer.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </span>
                              )}
                              {repairCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <History className="h-3 w-3" />
                                  {language === "th" 
                                    ? `${repairCount} รายการ` 
                                    : `${repairCount} repairs`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        {/* Part Selection Dialog */}
        <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {selectedCategory && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToCategories}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex-1">
                  <DialogTitle>
                    {selectedCategory
                      ? language === "th"
                        ? `อะไหล่ - ${getUniqueCategories().find(c => c.name === selectedCategory)?.nameTh || selectedCategory}`
                        : `Parts - ${selectedCategory}`
                      : language === "th"
                      ? "เลือกหมวดหมู่"
                      : "Select Category"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedCategory
                      ? language === "th"
                        ? "เลือกอะไหล่ที่ต้องการ หรือค้นหาด้วยชื่อ"
                        : "Select the part you want, or search by name"
                      : language === "th"
                      ? "เลือกหมวดหมู่เพื่อดูรายการอะไหล่"
                      : "Select a category to view parts"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
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
                        return (
                          cat.name.toLowerCase().includes(query) ||
                          cat.nameTh.toLowerCase().includes(query)
                        );
                      })
                      .map((category) => (
                        <CommandItem
                          key={category.name}
                          value={category.name}
                          onSelect={() => handleSelectCategory(category.name)}
                          className="flex items-center justify-between cursor-pointer py-3 data-[selected=true]:bg-blue-50 data-[selected=true]:dark:bg-blue-950/30 data-[selected=true]:text-blue-700 data-[selected=true]:dark:text-blue-300 data-[selected=true]:border-blue-300 data-[selected=true]:dark:border-blue-700 data-[selected=true]:border-2 data-[selected=true]:rounded-md data-[selected=true]:shadow-sm data-[selected=true]:font-semibold"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Package className="h-5 w-5 text-muted-foreground data-[selected=true]:text-blue-600 data-[selected=true]:dark:text-blue-400" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {language === "th" ? category.nameTh : category.name}
                              </span>
                              <span className="text-sm text-muted-foreground data-[selected=true]:text-blue-600/80 data-[selected=true]:dark:text-blue-400/80">
                                {language === "th"
                                  ? `${category.count} รายการ`
                                  : `${category.count} item${category.count !== 1 ? "s" : ""}`}
                              </span>
                            </div>
                          </div>
                          <ArrowLeft className="h-4 w-4 text-muted-foreground data-[selected=true]:text-blue-600 data-[selected=true]:dark:text-blue-400" />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            ) : (
              // Step 2: Show parts in selected category
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
                    {filteredAvailableParts.map((part) => {
                      const stockStatus = getPartStockStatus(part.stock);
                      return (
                        <CommandItem
                          key={part.id}
                          value={part.id}
                          onSelect={() => handleAddPart(part.id)}
                          className="flex items-center justify-between cursor-pointer py-3 data-[selected=true]:bg-blue-50 data-[selected=true]:dark:bg-blue-950/30 data-[selected=true]:text-blue-700 data-[selected=true]:dark:text-blue-300 data-[selected=true]:border-blue-300 data-[selected=true]:dark:border-blue-700 data-[selected=true]:border-2 data-[selected=true]:rounded-md data-[selected=true]:shadow-sm data-[selected=true]:font-semibold"
                        >
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="font-medium">
                              {language === "th" ? part.nameTh : part.name}
                            </span>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground data-[selected=true]:text-blue-600/80 data-[selected=true]:dark:text-blue-400/80">
                              <span>
                                {language === "th" ? "สต็อก" : "Stock"}: {part.stock.toLocaleString()}
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
                                {stockStatus === "high" && t("stockStatusHigh")}
                                {stockStatus === "low" && t("stockStatusLow")}
                                {stockStatus === "out" && t("outOfStock")}
                              </Badge>
                            </div>
                          </div>
                          <span className="font-semibold text-primary ml-4 data-[selected=true]:text-blue-600 data-[selected=true]:dark:text-blue-400 data-[selected=true]:font-bold">
                            ฿{part.sellPrice.toLocaleString()}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </DialogContent>
        </Dialog>

        {/* Repair History Dialog */}
        <Dialog open={isRepairHistoryDialogOpen} onOpenChange={setIsRepairHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === "th" 
                  ? `ประวัติการซ่อม - ${selectedCustomer ? (selectedCustomer.fullName || `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`.trim()) : ''}`
                  : `Repair History - ${selectedCustomer ? (selectedCustomer.fullName || `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`.trim()) : ''}`}
              </DialogTitle>
              <DialogDescription>
                {language === "th" 
                  ? `พบ ${customerRepairHistory.length} รายการ`
                  : `Found ${customerRepairHistory.length} repair(s)`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {customerRepairHistory.map((repair) => (
                <Card key={repair.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{repair.repairNumber}</CardTitle>
                      <Badge variant="outline">
                        {repair.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(repair.createdAt).toLocaleDateString(
                        language === "th" ? "th-TH" : "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {repair.deviceModel && (
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-muted-foreground">{language === "th" ? "รุ่น" : "Model"}:</span>
                        <span>{repair.deviceModel}</span>
                      </div>
                    )}
                    {repair.deviceColor && (
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-muted-foreground">{language === "th" ? "สี" : "Color"}:</span>
                        <span>{repair.deviceColor}</span>
                      </div>
                    )}
                    {repair.serialNumber && (
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-muted-foreground">{language === "th" ? "IMEI/SN" : "IMEI/SN"}:</span>
                        <span className="font-mono">{repair.serialNumber}</span>
                      </div>
                    )}
                    {repair.problemSymptoms && (
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-muted-foreground">{language === "th" ? "อาการเสีย" : "Symptoms"}:</span>
                        <span>{repair.problemSymptoms}</span>
                      </div>
                    )}
                    {repair.totalCost > 0 && (
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-muted-foreground">{language === "th" ? "ราคารวม" : "Total Cost"}:</span>
                        <span className="font-semibold">{repair.totalCost.toLocaleString()} {language === "th" ? "บาท" : "THB"}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default RepairNew;
