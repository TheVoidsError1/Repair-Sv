import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Battery,
  CheckCircle,
  ChevronsUpDown,
  Edit,
  Filter,
  Grid3x3,
  Image as ImageIcon,
  LayoutList,
  Layers,
  Package,
  Plus,
  PlusCircle,
  Search,
  Smartphone,
  Trash2,
  Upload,
  Usb,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/runtimeConfig";

// Component for displaying part image in table cell
const PartImageCell = ({ imageUrl, alt }: { imageUrl?: string; alt: string }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const API_BASE_URL = getApiBaseUrl();
  
  // Build image URL
  let imageSrc: string | null = null;
  if (imageUrl) {
    // Ensure imageUrl starts with /
    const normalizedUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    imageSrc = `${API_BASE_URL}${normalizedUrl}`;
  }

  // Show default icon if no image URL or if image failed to load
  if (!imageUrl || imageError) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden border border-border bg-muted">
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      )}
      <img
        src={imageSrc || ''}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        onLoad={() => {
          setImageLoading(false);
          setImageError(false);
        }}
      />
    </div>
  );
};

/** สถานะตามสต็อก: หมด = 0, ใกล้หมด = 1..minStock, พร้อมขาย = > minStock */
function getPartStatus(stock: number, minStock: number): "out" | "low" | "ready" {
  if (stock === 0) return "out";
  if (stock <= minStock) return "low";
  return "ready";
}

/** แมป category ดิบ → กลุ่มหลัก: จอ / แบตเตอรี่ / อื่นๆ */
function getPartType(category: string): "screen" | "battery" | "others" {
  const cat = category.toLowerCase();
  if (cat.includes("screen")) return "screen";
  if (cat.includes("batter")) return "battery";
  return "others";
}

const categoriesEn = ["All", "Screens", "Batteries", "Ports", "Glass", "Others"];
const categoriesTh = ["ทั้งหมด", "หน้าจอ", "แบตเตอรี่", "พอร์ต", "กระจก", "อื่นๆ"];

// Type for Part from API (backend format)
interface PartFromAPI {
  id: string; // UUID from backend
  name: string;
  nameTh?: string;
  partNumber?: string;
  costPrice: number;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  category?: string;
  categoryTh?: string;
  imageUrl?: string;
  [key: string]: any;
}

// Type for Part in frontend (frontend format)
interface PartFrontend {
  id: string; // UUID from backend (for API calls)
  displayId: string; // partNumber or id for display
  name: string;
  nameTh: string;
  category: string;
  categoryTh: string;
  stock: number;
  minStock: number;
  cost: number;
  sellPrice: number;
  imageUrl?: string;
}

// Helper function to convert API format to frontend format
function convertPartFromAPI(part: PartFromAPI): PartFrontend {
  return {
    id: part.id, // Keep UUID for API calls
    displayId: part.partNumber || part.id, // Use partNumber for display
    name: part.name,
    nameTh: part.nameTh || part.name,
    category: part.category || "Others",
    categoryTh: part.categoryTh || "อื่นๆ",
    stock: part.stockQuantity,
    minStock: part.minStockLevel,
    cost: Number(part.costPrice),
    sellPrice: Number(part.price),
    imageUrl: part.imageUrl,
  };
}

// Helper function to convert frontend format to API format
function convertPartToAPI(part: {
  name: string;
  nameTh: string;
  category: string;
  categoryTh: string;
  stock: string | number;
  minStock: string | number;
  cost: string | number;
  sellPrice: string | number;
}): any {
  return {
    name: part.name.trim(),
    nameTh: part.nameTh.trim(),
    category: part.category || "Others",
    categoryTh: part.categoryTh || "อื่นๆ",
    stockQuantity: Number(part.stock) || 0,
    minStockLevel: Number(part.minStock) || 10,
    costPrice: Number(part.cost) || 0,
    price: Number(part.sellPrice) || 0,
  };
}

const Inventory = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [parts, setParts] = useState<PartFrontend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "screen" | "battery" | "port" | "glass" | "others">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Get category from URL parameter
  const categoryParam = searchParams.get("category");
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [selectedPartForStock, setSelectedPartForStock] = useState<string>("");
  const [stockToAdd, setStockToAdd] = useState<string>("");
  const [partSearchOpen, setPartSearchOpen] = useState(false);
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [selectedCategoryForStock, setSelectedCategoryForStock] = useState<"all" | "screen" | "battery" | "port" | "glass" | "others">("all");
  const stockInputRef = useRef<HTMLInputElement>(null);
  /** รหัสอะไหล่ที่กำลังแก้ไข (null = โหมดเพิ่มใหม่) */
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  /** Transaction ที่สร้างขึ้นเมื่อเพิ่มสต็อก */
  const [createdTransaction, setCreatedTransaction] = useState<any | null>(null);

  const [newPart, setNewPart] = useState({
    name: "",
    nameTh: "",
    category: "",
    categoryTh: "",
    stock: "",
    minStock: "",
    cost: "",
    sellPrice: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  // Load parts from API
  const loadParts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getParts();
      if (response.status === "success" && response.data) {
        const convertedParts = (response.data as PartFromAPI[]).map(convertPartFromAPI);
        setParts(convertedParts);
      } else {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (language === "th" ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load parts"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading parts:", error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load parts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [language, toast]);

  // Update filter when category parameter changes
  useEffect(() => {
    if (categoryParam) {
      setTypeFilter(categoryParam as typeof typeFilter);
    } else {
      setTypeFilter("all");
    }
  }, [categoryParam]);

  // Refresh parts when page becomes visible (user returns to this page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadParts();
      }
    };

    const handleFocus = () => {
      loadParts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredParts = parts.filter((part) => {
    const search = searchQuery.toLowerCase();
    const searchName = (language === "th" ? part.nameTh : part.name).toLowerCase();
    const searchCategory = (language === "th" ? part.categoryTh : part.category).toLowerCase();
    const matchesSearch =
      !search ||
      searchName.includes(search) ||
      part.displayId.toLowerCase().includes(search) ||
      searchCategory.includes(search);

    // Handle category filtering
    if (typeFilter === "all") {
      return matchesSearch;
    }
    
    if (typeFilter === "port") {
      const cat = (part.category || "").toLowerCase();
      const catTh = (part.categoryTh || "").toLowerCase();
      return matchesSearch && (cat.includes("port") || catTh.includes("พอร์ต"));
    }
    
    if (typeFilter === "glass") {
      const cat = (part.category || "").toLowerCase();
      const catTh = (part.categoryTh || "").toLowerCase();
      return matchesSearch && (cat.includes("glass") || catTh.includes("กระจก"));
    }
    
    if (typeFilter === "others") {
      // Others: ไม่ใช่ screen, battery, port, หรือ glass
      const partType = getPartType(part.category);
      const cat = (part.category || "").toLowerCase();
      const catTh = (part.categoryTh || "").toLowerCase();
      const isPort = cat.includes("port") || catTh.includes("พอร์ต");
      const isGlass = cat.includes("glass") || catTh.includes("กระจก");
      const isScreen = partType === "screen";
      const isBattery = partType === "battery";
      
      return matchesSearch && !isScreen && !isBattery && !isPort && !isGlass;
    }
    
    const partType = getPartType(part.category);
    const matchesType = typeFilter === partType;

    return matchesSearch && matchesType;
  });

  // Count parts by category for grid view
  const getCategoryCount = (categoryType: "screen" | "battery" | "port" | "glass" | "others") => {
    return parts.filter((part) => {
      if (categoryType === "port") {
        // Check if category contains "port" or "พอร์ต"
        const cat = (part.category || "").toLowerCase();
        const catTh = (part.categoryTh || "").toLowerCase();
        return cat.includes("port") || catTh.includes("พอร์ต");
      }
      if (categoryType === "glass") {
        // Check if category contains "glass" or "กระจก"
        const cat = (part.category || "").toLowerCase();
        const catTh = (part.categoryTh || "").toLowerCase();
        return cat.includes("glass") || catTh.includes("กระจก");
      }
      const partType = getPartType(part.category);
      if (categoryType === "others") {
        // Others: ไม่ใช่ screen, battery, port, หรือ glass
        const cat = (part.category || "").toLowerCase();
        const catTh = (part.categoryTh || "").toLowerCase();
        const isPort = cat.includes("port") || catTh.includes("พอร์ต");
        const isGlass = cat.includes("glass") || catTh.includes("กระจก");
        const isScreen = partType === "screen";
        const isBattery = partType === "battery";
        
        return !isScreen && !isBattery && !isPort && !isGlass;
      }
      return partType === categoryType;
    }).length;
  };

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setEditingPartId(null);
      setIsAddDialogOpen(true);
      setSelectedImage(null);
      setImagePreview(null);
      setExistingImageUrl(null);
      setImageRemoved(false);
      const catParam = searchParams.get("cat");
      if (catParam) {
        const idxEn = categoriesEn.indexOf(catParam);
        const idxTh = categoriesTh.indexOf(catParam);
        const idx = idxEn !== -1 ? idxEn : idxTh;
        if (idx > 0) {
          const catEn = categoriesEn[idx];
          const catTh = categoriesTh[idx];
          setNewPart((prev) => ({
            ...prev,
            category: catEn,
            categoryTh: catTh,
          }));
        }
      }
    } else {
      setIsAddDialogOpen(false);
      setEditingPartId(null);
      setSelectedImage(null);
      setImagePreview(null);
      setExistingImageUrl(null);
      setImageRemoved(false);
    }
  }, [searchParams]);

  const openEditDialog = (part: PartFrontend) => {
    setEditingPartId(part.id);
    setNewPart({
      name: part.name,
      nameTh: part.nameTh,
      category: part.category,
      categoryTh: part.categoryTh,
      stock: String(part.stock),
      minStock: String(part.minStock),
      cost: String(part.cost),
      sellPrice: String(part.sellPrice),
    });
    setSelectedImage(null);
    setImagePreview(null);
    setExistingImageUrl(part.imageUrl || null);
    setImageRemoved(false);
    setIsAddDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsAddDialogOpen(false);
    setEditingPartId(null);
    setNewPart({
      name: "",
      nameTh: "",
      category: "",
      categoryTh: "",
      stock: "",
      minStock: "",
      cost: "",
      sellPrice: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setImageRemoved(false);
    navigate("/inventory", { replace: true });
  };

  const handleNewPartChange = (field: keyof typeof newPart, value: string) => {
    setNewPart((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (value: string) => {
    const idxEn = categoriesEn.indexOf(value);
    const idxTh = categoriesTh.indexOf(value);
    let idx = idxEn !== -1 ? idxEn : idxTh;
    if (idx <= 0) {
      handleNewPartChange("category", "");
      handleNewPartChange("categoryTh", "");
      return;
    }
    const catEn = categoriesEn[idx];
    const catTh = categoriesTh[idx];
    handleNewPartChange("category", catEn);
    handleNewPartChange("categoryTh", catTh);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: language === "th" ? "ไฟล์ใหญ่เกินไป" : "File too large",
          description: language === "th" ? "ขนาดไฟล์ต้องไม่เกิน 5MB" : "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setExistingImageUrl(null);
      setImageRemoved(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (existingImageUrl) {
      setImageRemoved(true);
    }
    setExistingImageUrl(null);
  };

  const handleSavePart = async () => {
    if (!newPart.name.trim() || !newPart.nameTh.trim()) {
      toast({
        title: language === "th" ? "กรุณากรอกชื่อสินค้า" : "Please enter part name",
      });
      return;
    }

    const partData = convertPartToAPI(newPart);

    try {
      if (editingPartId) {
        // Find the original part to get the backend ID (UUID)
        const originalPart = parts.find((p) => p.id === editingPartId);
        if (!originalPart) {
          toast({
            title: language === "th" ? "ไม่พบข้อมูล" : "Not found",
            description: language === "th" ? "ไม่พบข้อมูลอะไหล่ที่ต้องการแก้ไข" : "Part not found",
            variant: "destructive",
          });
          return;
        }

        // Use the UUID from backend
        const backendId = originalPart.id;
        
        // If there's a new image or image was removed, use FormData
        if (selectedImage || imageRemoved) {
          const formData = new FormData();
          if (selectedImage) {
            formData.append('image', selectedImage);
          } else if (imageRemoved) {
            // Send empty string to delete the image
            formData.append('imageUrl', '');
          }
          Object.keys(partData).forEach(key => {
            formData.append(key, String(partData[key]));
          });
          
          const token = localStorage.getItem('authToken');
          const API_BASE_URL = getApiBaseUrl();
          const response = await fetch(`${API_BASE_URL}/api/parts/${backendId}`, {
            method: 'PUT',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
          });
          
          const result = await response.json();
          
          if (result.status === "success" && result.data) {
            const updatedPart = convertPartFromAPI(result.data as PartFromAPI);
            setParts((prev) =>
              prev.map((p) => (p.id === editingPartId ? updatedPart : p))
            );
            toast({
              title: language === "th" ? "แก้ไขสินค้าเรียบร้อย" : "Part updated",
              description:
                language === "th"
                  ? "บันทึกการแก้ไขอะไหล่แล้ว"
                  : "Part has been updated.",
            });
            closeFormDialog();
          } else {
            toast({
              title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
              description: result.message || (language === "th" ? "ไม่สามารถแก้ไขข้อมูลได้" : "Failed to update part"),
              variant: "destructive",
            });
          }
        } else {
          // No new image and no removal, update normally
          const response = await apiClient.updatePart(backendId, partData);

          if (response.status === "success" && response.data) {
            const updatedPart = convertPartFromAPI(response.data as PartFromAPI);
            setParts((prev) =>
              prev.map((p) => (p.id === editingPartId ? updatedPart : p))
            );
            toast({
              title: language === "th" ? "แก้ไขสินค้าเรียบร้อย" : "Part updated",
              description:
                language === "th"
                  ? "บันทึกการแก้ไขอะไหล่แล้ว"
                  : "Part has been updated.",
            });
            closeFormDialog();
          } else {
            toast({
              title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
              description: response.message || (language === "th" ? "ไม่สามารถแก้ไขข้อมูลได้" : "Failed to update part"),
              variant: "destructive",
            });
          }
        }
      } else {
        // Generate partNumber if not provided
        if (!partData.partNumber) {
          const count = parts.length + 1;
          partData.partNumber = `PART-${count.toString().padStart(3, "0")}`;
        }

        // If there's an image, upload it using FormData
        if (selectedImage) {
          const formData = new FormData();
          formData.append('image', selectedImage);
          Object.keys(partData).forEach(key => {
            formData.append(key, String(partData[key]));
          });
          
          const token = localStorage.getItem('authToken');
          const API_BASE_URL = getApiBaseUrl();
          const response = await fetch(`${API_BASE_URL}/api/parts`, {
            method: 'POST',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
          });
          
          const result = await response.json();
          
          if (result.status === "success" && result.data) {
            const newPartConverted = convertPartFromAPI(result.data as PartFromAPI);
            setParts((prev) => [newPartConverted, ...prev]);
            toast({
              title: language === "th" ? "เพิ่มสินค้าเรียบร้อย" : "Part added",
              description:
                language === "th"
                  ? "บันทึกสินค้าใหม่ลงในคลังแล้ว"
                  : "New part has been added to inventory.",
            });
            closeFormDialog();
          } else {
            toast({
              title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
              description: result.message || (language === "th" ? "ไม่สามารถเพิ่มข้อมูลได้" : "Failed to create part"),
              variant: "destructive",
            });
          }
        } else {
          // No image, create normally
          const response = await apiClient.createPart(partData);

          if (response.status === "success" && response.data) {
            const newPartConverted = convertPartFromAPI(response.data as PartFromAPI);
            setParts((prev) => [newPartConverted, ...prev]);
            toast({
              title: language === "th" ? "เพิ่มสินค้าเรียบร้อย" : "Part added",
              description:
                language === "th"
                  ? "บันทึกสินค้าใหม่ลงในคลังแล้ว"
                  : "New part has been added to inventory.",
            });
            closeFormDialog();
          } else {
            toast({
              title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
              description: response.message || (language === "th" ? "ไม่สามารถเพิ่มข้อมูลได้" : "Failed to create part"),
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving part:", error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "ไม่สามารถบันทึกข้อมูลได้" : "Failed to save part",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditingPartId(null);
    setNewPart({
      name: "",
      nameTh: "",
      category: "",
      categoryTh: "",
      stock: "",
      minStock: "",
      cost: "",
      sellPrice: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setImageRemoved(false);
    setIsAddDialogOpen(true);
    navigate("/inventory", { replace: true });
  };

  const handleAddStock = async () => {
    if (!selectedPartForStock) {
      toast({
        title: language === "th" ? "กรุณาเลือกอะไหล่" : "Please select a part",
        variant: "destructive",
      });
      return;
    }

    const stockAmount = Number(stockToAdd);
    if (isNaN(stockAmount) || stockAmount <= 0) {
      toast({
        title: language === "th" ? "กรุณากรอกจำนวนที่ถูกต้อง" : "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const part = parts.find((p) => p.id === selectedPartForStock);
      if (!part) {
        toast({
          title: language === "th" ? "ไม่พบข้อมูลอะไหล่" : "Part not found",
          variant: "destructive",
        });
        return;
      }

      // ใช้ API ใหม่ที่บันทึกธุรกรรม
      const response = await apiClient.addPartStock(part.id, stockAmount);

      if (response.status === "success" && response.data) {
        const updatedPart = convertPartFromAPI(response.data.part as PartFromAPI);
        const transaction = response.data.transaction;
        
        setParts((prev) =>
          prev.map((p) => (p.id === selectedPartForStock ? updatedPart : p))
        );
        
        // เก็บ Transaction เพื่อแสดงใน Dialog
        setCreatedTransaction(transaction);
        
        const totalCost = Number(transaction.totalCost).toLocaleString();
        const partName = language === "th" ? part.nameTh : part.name;
        
        toast({
          title: language === "th" ? "เพิ่มจำนวนสต็อกเรียบร้อย" : "Stock updated",
          description:
            language === "th"
              ? `${partName}\nเพิ่ม ${stockAmount} ชิ้น (${part.stock} → ${updatedPart.stock})\nจำนวนเงิน: ฿${totalCost}\nเลขที่: ${transaction.transactionNumber}`
              : `${partName}\nAdded ${stockAmount} items (${part.stock} → ${updatedPart.stock})\nAmount: ฿${totalCost}\nRef: ${transaction.transactionNumber}`,
        });
        
        // ไม่ปิด Dialog ทันที แต่แสดง Transaction ให้ผู้ใช้เห็น
        // setIsAddStockDialogOpen(false);
        setSelectedPartForStock("");
        setStockToAdd("");
        setSelectedCategoryForStock("all");
      } else {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (language === "th" ? "ไม่สามารถอัปเดตสต็อกได้" : "Failed to update stock"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "ไม่สามารถเพิ่มจำนวนสต็อกได้" : "Failed to add stock",
        variant: "destructive",
      });
    }
  };

  const outCount = parts.filter((p) => getPartStatus(p.stock, p.minStock) === "out").length;
  const lowCount = parts.filter((p) => getPartStatus(p.stock, p.minStock) === "low").length;
  const readyCount = parts.filter((p) => getPartStatus(p.stock, p.minStock) === "ready").length;

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("sparePartsInventory")}</h1>
            <p className="page-description">
              {language === "th"
                ? "บริการสินค้าในคลังของคุณให้พร้อมขายอยู่เสมอ"
                : "Manage your inventory to be always ready for sale."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={() => setIsAddStockDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              {language === "th" ? "เพิ่มจำนวนอะไหล่" : "Add Stock"}
            </Button>
            <Button className="gap-2" onClick={openAddDialog}>
              <PlusCircle className="w-4 h-4" />
              {language === "th" ? "เพิ่มสินค้า" : t("addPart")}
            </Button>
          </div>
        </div>
      </div>

      {/* การ์ดสรุปแจ้งเตือนสถานะสต็อก - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-cancelled/10">
              <XCircle className="w-5 h-5 text-status-cancelled" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("outOfStock")}</p>
              <p className="text-xl font-semibold text-foreground">{outCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-pending/10">
              <AlertTriangle className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("runningLow")}</p>
              <p className="text-xl font-semibold text-foreground">{lowCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-completed/10">
              <CheckCircle className="w-5 h-5 text-status-completed" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("readyToSell")}</p>
              <p className="text-xl font-semibold text-foreground">{readyCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ค้นหา + กรองประเภท (แสดงเฉพาะเมื่ออยู่ในหน้าประเภทสินค้า) */}
      {categoryParam && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            variant="outline"
            className="gap-2 w-fit"
            onClick={() => navigate("/inventory")}
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "th" ? "กลับหมวดหมู่" : "Back to Categories"}
          </Button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === "th" ? "Enter เพื่อค้นหาสินค้า" : "Enter to search parts"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {editingPartId
                ? (language === "th" ? "แก้ไขสินค้า" : "Edit part")
                : (language === "th" ? "เพิ่มสินค้าใหม่" : t("addNewSparePart"))}
            </DialogTitle>
            <DialogDescription>
              {editingPartId
                ? (language === "th"
                    ? "แก้ไขรายละเอียดอะไหล่แล้วกดบันทึก"
                    : "Edit part details and save.")
                : (language === "th"
                    ? "กรอกรายละเอียดสินค้าเพื่อเพิ่มเข้าคลังอะไหล่"
                    : t("enterPartDetails"))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nameTh">
                  {language === "th" ? "ชื่อสินค้า (ไทย)" : "Part name (TH)"}
                </Label>
                <Input
                  id="nameTh"
                  placeholder={
                    language === "th"
                      ? "เช่น หน้าจอ iPhone 14 Pro"
                      : "e.g., iPhone 14 Pro screen (TH)"
                  }
                  value={newPart.nameTh}
                  onChange={(e) => handleNewPartChange("nameTh", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">
                  {language === "th" ? "ชื่อสินค้า (อังกฤษ)" : "Part name (EN)"}
                </Label>
                <Input
                  id="nameEn"
                  placeholder={
                    language === "th"
                      ? "เช่น iPhone 14 Pro screen"
                      : "Part name in English"
                  }
                  value={newPart.name}
                  onChange={(e) => handleNewPartChange("name", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{t("category")}</Label>
                <Select
                  value={newPart.category || newPart.categoryTh}
                  onValueChange={handleCategorySelect}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesEn.slice(1).map((catEn, index) => {
                      const idx = index + 1;
                      const catTh = categoriesTh[idx] || catEn;
                      const label = language === "th" ? catTh : catEn;
                      return (
                        <SelectItem key={catEn} value={catEn}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">{t("initialStock")}</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    value={newPart.stock}
                    onChange={(e) => handleNewPartChange("stock", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">{t("minStockLevel")}</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min={0}
                    value={newPart.minStock}
                    onChange={(e) => handleNewPartChange("minStock", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">{t("costPrice")}</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min={0}
                  value={newPart.cost}
                  onChange={(e) => handleNewPartChange("cost", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">{t("sellPrice")}</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  min={0}
                  value={newPart.sellPrice}
                  onChange={(e) => handleNewPartChange("sellPrice", e.target.value)}
                />
              </div>
            </div>
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="partImage">
                {language === "th" ? "รูปภาพสินค้า" : "Product Image"}
              </Label>
              <div className="space-y-3">
                {/* Image Preview */}
                {(imagePreview || existingImageUrl) && (
                  <div className="relative w-full max-w-xs">
                    <div className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                      <img
                        src={imagePreview || (existingImageUrl ? `${getApiBaseUrl()}${existingImageUrl}` : '')}
                        alt={language === "th" ? "รูปภาพสินค้า" : "Part image"}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <Input
                    id="partImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="partImage"
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {imagePreview || existingImageUrl
                        ? (language === "th" ? "เปลี่ยนรูปภาพ" : "Change Image")
                        : (language === "th" ? "อัปโหลดรูปภาพ" : "Upload Image")}
                    </span>
                  </Label>
                  {!imagePreview && !existingImageUrl && (
                    <p className="text-xs text-muted-foreground">
                      {language === "th" ? "(ถ้าไม่ใส่จะแสดงรูป default)" : "(Leave empty to show default image)"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeFormDialog}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSavePart}>
              {editingPartId
                ? (language === "th" ? "บันทึก" : "Save")
                : (language === "th" ? "เพิ่มสินค้า" : t("addPart"))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับเพิ่มจำนวนอะไหล่ */}
      <Dialog open={isAddStockDialogOpen} onOpenChange={(open) => {
        setIsAddStockDialogOpen(open);
        if (!open) {
          setSelectedPartForStock("");
          setStockToAdd("");
          setPartSearchQuery("");
          setPartSearchOpen(false);
          setSelectedCategoryForStock("all");
          setCreatedTransaction(null);
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "เพิ่มจำนวนอะไหล่" : "Add Stock"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "เลือกอะไหล่และระบุจำนวนที่ต้องการเพิ่ม"
                : "Select a part and enter the amount to add"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* เลือกหมวดหมู่ */}
            <div className="space-y-2">
              <Label htmlFor="selectCategory">
                {language === "th" ? "เลือกหมวดหมู่" : "Select Category"}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={selectedCategoryForStock}
                onValueChange={(value) => {
                  setSelectedCategoryForStock(value as typeof selectedCategoryForStock);
                  setSelectedPartForStock(""); // Reset selected part when category changes
                  setPartSearchQuery("");
                }}
              >
                <SelectTrigger id="selectCategory" className="w-full">
                  <SelectValue placeholder={language === "th" ? "เลือกหมวดหมู่" : "Select Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "th" ? "ทั้งหมด" : "All"}
                  </SelectItem>
                  <SelectItem value="screen">
                    {language === "th" ? "หน้าจอ" : "Screens"}
                  </SelectItem>
                  <SelectItem value="battery">
                    {language === "th" ? "แบตเตอรี่" : "Batteries"}
                  </SelectItem>
                  <SelectItem value="port">
                    {language === "th" ? "พอร์ต" : "Ports"}
                  </SelectItem>
                  <SelectItem value="glass">
                    {language === "th" ? "กระจก" : "Glass"}
                  </SelectItem>
                  <SelectItem value="others">
                    {language === "th" ? "อื่นๆ" : "Others"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* เลือกอะไหล่ */}
            <div className="space-y-2">
              <Label htmlFor="selectPart">
                {language === "th" ? "เลือกอะไหล่" : "Select Part"}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Popover open={partSearchOpen} onOpenChange={setPartSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={partSearchOpen}
                    className="w-full justify-between h-auto py-2"
                    disabled={!selectedCategoryForStock}
                  >
                    {selectedPartForStock ? (
                      (() => {
                        const selectedPart = parts.find((p) => p.id === selectedPartForStock);
                        if (!selectedPart) return language === "th" ? "เลือกอะไหล่" : "Select a part";
                        const status = getPartStatus(selectedPart.stock, selectedPart.minStock);
                        const statusIcon = status === "out" ? <XCircle className="w-4 h-4 text-red-500" /> :
                                          status === "low" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                                          <CheckCircle className="w-4 h-4 text-emerald-500" />;
                        return (
                          <div className="flex items-center gap-2 flex-1 text-left">
                            {statusIcon}
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium truncate">
                                {language === "th" ? selectedPart.nameTh : selectedPart.name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {selectedPart.displayId} · {language === "th" ? "สต็อก" : "Stock"}: {selectedPart.stock}
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground">
                        {!selectedCategoryForStock 
                          ? (language === "th" ? "กรุณาเลือกหมวดหมู่ก่อน" : "Please select category first")
                          : (language === "th" ? "🔍 ค้นหาหรือเลือกอะไหล่..." : "🔍 Search or select a part...")
                        }
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={language === "th" ? "ค้นหาอะไหล่..." : "Search parts..."}
                      value={partSearchQuery}
                      onValueChange={setPartSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {language === "th" ? "ไม่พบอะไหล่" : "No parts found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {(() => {
                          // Filter parts by selected category
                          let filteredPartsByCategory = parts;
                          
                          if (selectedCategoryForStock !== "all") {
                            if (selectedCategoryForStock === "port") {
                              filteredPartsByCategory = parts.filter((part) => {
                                const cat = (part.category || "").toLowerCase();
                                const catTh = (part.categoryTh || "").toLowerCase();
                                return cat.includes("port") || catTh.includes("พอร์ต");
                              });
                            } else if (selectedCategoryForStock === "glass") {
                              filteredPartsByCategory = parts.filter((part) => {
                                const cat = (part.category || "").toLowerCase();
                                const catTh = (part.categoryTh || "").toLowerCase();
                                return cat.includes("glass") || catTh.includes("กระจก");
                              });
                            } else if (selectedCategoryForStock === "others") {
                              filteredPartsByCategory = parts.filter((part) => {
                                const partType = getPartType(part.category);
                                const cat = (part.category || "").toLowerCase();
                                const catTh = (part.categoryTh || "").toLowerCase();
                                const isPort = cat.includes("port") || catTh.includes("พอร์ต");
                                const isGlass = cat.includes("glass") || catTh.includes("กระจก");
                                const isScreen = partType === "screen";
                                const isBattery = partType === "battery";
                                return !isScreen && !isBattery && !isPort && !isGlass;
                              });
                            } else {
                              const partType = getPartType(selectedCategoryForStock);
                              filteredPartsByCategory = parts.filter((part) => {
                                const type = getPartType(part.category);
                                return type === partType;
                              });
                            }
                          }

                          // Apply search filter
                          return filteredPartsByCategory
                            .filter((part) => {
                              if (!partSearchQuery) return true;
                              const query = partSearchQuery.toLowerCase();
                              return (
                                part.name.toLowerCase().includes(query) ||
                                part.nameTh.toLowerCase().includes(query) ||
                                part.displayId.toLowerCase().includes(query) ||
                                part.category.toLowerCase().includes(query) ||
                                part.categoryTh.toLowerCase().includes(query)
                              );
                            })
                            .map((part) => {
                              const status = getPartStatus(part.stock, part.minStock);
                              const statusIcon = status === "out" ? <XCircle className="w-4 h-4 text-red-500" /> :
                                                status === "low" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />;
                              const statusLabel = status === "out"
                                ? (language === "th" ? "หมด" : "Out")
                                : status === "low"
                                  ? (language === "th" ? "ใกล้หมด" : "Low")
                                  : (language === "th" ? "พร้อมขาย" : "Ready");
                              const isSelected = selectedPartForStock === part.id;
                              return (
                                <CommandItem
                                  key={part.id}
                                  value={`${part.name} ${part.nameTh} ${part.displayId}`}
                                  onSelect={() => {
                                    setSelectedPartForStock(part.id);
                                    setPartSearchOpen(false);
                                    setPartSearchQuery("");
                                    // Auto-focus on stock input after selection
                                    setTimeout(() => {
                                      stockInputRef.current?.focus();
                                    }, 100);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {statusIcon}
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">
                                          {language === "th" ? part.nameTh : part.name}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono">{part.displayId}</span>
                                        <span>·</span>
                                        <span>{language === "th" ? "สต็อก" : "Stock"}: {part.stock}</span>
                                        <span>·</span>
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded text-xs font-medium",
                                          status === "out" ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                                          status === "low" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                                          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        )}>
                                          {statusLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            });
                        })()}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockAmount">
                {language === "th" ? "จำนวนที่ต้องการเพิ่ม" : "Amount to Add"}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="stockAmount"
                ref={stockInputRef}
                type="number"
                min={1}
                placeholder={language === "th" ? "กรอกจำนวน" : "Enter amount"}
                value={stockToAdd}
                onChange={(e) => setStockToAdd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedPartForStock && stockToAdd && !isNaN(Number(stockToAdd)) && Number(stockToAdd) > 0) {
                    handleAddStock();
                  }
                }}
              />
              {selectedPartForStock && stockToAdd && !isNaN(Number(stockToAdd)) && Number(stockToAdd) > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      {language === "th" ? "สต็อกหลังเพิ่ม" : "Stock after adding"}:{" "}
                    </span>
                    <span className="font-semibold text-foreground">
                      {(parts.find((p) => p.id === selectedPartForStock)?.stock || 0) + Number(stockToAdd)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {language === "th" ? "ชิ้น" : "items"}
                    </span>
                  </p>
                </div>
              )}
              {stockToAdd && (isNaN(Number(stockToAdd)) || Number(stockToAdd) <= 0) && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {language === "th" ? "กรุณากรอกจำนวนที่มากกว่า 0" : "Please enter a number greater than 0"}
                </p>
              )}
            </div>
            
            {/* แสดง Transaction ที่สร้างขึ้น */}
            {createdTransaction && (
              <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-foreground">
                        {language === "th" ? "ธุรกรรมที่สร้างขึ้น" : "Transaction Created"}
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {language === "th" ? "เลขที่ธุรกรรม" : "Transaction ID"}:
                        </span>
                        <span className="font-medium text-foreground">
                          {createdTransaction.transactionNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {language === "th" ? "รายละเอียด" : "Description"}:
                        </span>
                        <span className="font-medium text-foreground">
                          {language === "th" ? createdTransaction.descriptionTh : createdTransaction.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {language === "th" ? "จำนวนเงิน" : "Amount"}:
                        </span>
                        <span className="font-semibold text-primary">
                          ฿{Number(createdTransaction.totalCost).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {language === "th" ? "วันที่" : "Date"}:
                        </span>
                        <span className="font-medium text-foreground">
                          {new Date(createdTransaction.createdAt).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      try {
                        const response = await apiClient.deleteTransaction(createdTransaction.id);
                        if (response.status === "success") {
                          toast({
                            title: language === "th" ? "ลบธุรกรรมเรียบร้อย" : "Transaction deleted",
                            description: language === "th" 
                              ? "ธุรกรรมถูกลบออกจากระบบแล้ว"
                              : "Transaction has been removed from the system",
                          });
                          setCreatedTransaction(null);
                          setIsAddStockDialogOpen(false);
                          // Reload parts to update stock
                          await loadParts();
                        } else {
                          throw new Error(response.message || "Failed to delete transaction");
                        }
                      } catch (error) {
                        console.error("Error deleting transaction:", error);
                        toast({
                          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
                          description: error instanceof Error ? error.message : (language === "th" ? "ไม่สามารถลบธุรกรรมได้" : "Failed to delete transaction"),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {language === "th" ? "ลบ" : "Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddStockDialogOpen(false);
                setSelectedPartForStock("");
                setStockToAdd("");
                setPartSearchQuery("");
                setPartSearchOpen(false);
                setCreatedTransaction(null);
              }}
            >
              {t("cancel")}
            </Button>
            {!createdTransaction && (
              <Button 
                onClick={handleAddStock}
                disabled={!selectedCategoryForStock || !selectedPartForStock || !stockToAdd || isNaN(Number(stockToAdd)) || Number(stockToAdd) <= 0}
              >
                {language === "th" ? "เพิ่มจำนวน" : "Add Stock"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* แสดงการ์ดหมวดหมู่ หรือ ตารางอะไหล่ */}
      {!categoryParam ? (
        <>
          {/* แสดงการ์ดหมวดหมู่เมื่อไม่มี category parameter - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              {language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
            </div>
          ) : (
            <>
              {/* อะไหล่ทั้งหมด (All) */}
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate("/inventory?category=all")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <Layers className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {language === "th" ? "ทั้งหมด" : "All Parts"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {parts.length} {language === "th" ? "รายการ" : "items"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* หน้าจอ (Screens) */}
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate("/inventory?category=screen")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Smartphone className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {language === "th" ? "หน้าจอ" : "Screens"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCategoryCount("screen")} {language === "th" ? "รายการ" : "items"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* แบตเตอรี่ (Batteries) */}
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate("/inventory?category=battery")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                    <Battery className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {language === "th" ? "แบตเตอรี่" : "Batteries"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCategoryCount("battery")} {language === "th" ? "รายการ" : "items"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* พอร์ต (Ports) */}
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate("/inventory?category=port")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Usb className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {language === "th" ? "พอร์ต" : "Ports"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCategoryCount("port")} {language === "th" ? "รายการ" : "items"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* กระจก (Glass) */}
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate("/inventory?category=glass")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <Package className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {language === "th" ? "กระจก" : "Glass"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCategoryCount("glass")} {language === "th" ? "รายการ" : "items"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* อื่นๆ (Others) */}
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate("/inventory?category=others")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-xl bg-gray-500/10 group-hover:bg-gray-500/20 transition-colors">
                    <Package className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {language === "th" ? "อื่นๆ" : "Others"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCategoryCount("others")} {language === "th" ? "รายการ" : "items"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        </>
      ) : (
        <>
          {/* แสดงตารางอะไหล่เมื่อมี category parameter - Desktop & Mobile */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[56px]">{language === "th" ? "รูป" : "Image"}</th>
                  <th>{language === "th" ? "รหัส" : "SKU"}</th>
                  <th>{language === "th" ? "สินค้า" : "Product"}</th>
                  <th className="text-right">{language === "th" ? "ราคาทุน" : "Cost"}</th>
                  <th className="text-right">{t("sellPrice")}</th>
                  <th className="text-right">{t("stock")}</th>
                  <th className="text-right">{language === "th" ? "ขั้นต่ำ" : "Min"}</th>
                  <th>{language === "th" ? "สถานะ" : "Status"}</th>
                  <th className="w-24 text-center">{language === "th" ? "การดำเนินการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 opacity-50" />
                        <p>{language === "th" ? "ไม่พบรายการอะไหล่" : "No parts found."}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => {
                    const status = getPartStatus(part.stock, part.minStock);
                    const statusLabel =
                      status === "out"
                        ? language === "th"
                          ? "หมด"
                          : "Out of stock"
                        : status === "low"
                          ? language === "th"
                            ? "ใกล้หมด"
                            : "Low stock"
                          : language === "th"
                            ? "พร้อมขาย"
                            : "Ready";
                    const statusClass =
                      status === "out"
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : status === "low"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
                    return (
                      <tr key={part.id}>
                        <td className="w-[56px] py-3">
                          <PartImageCell 
                            imageUrl={part.imageUrl}
                            alt={language === "th" ? part.nameTh : part.name}
                          />
                        </td>
                        <td className="font-medium text-foreground tabular-nums">{part.displayId}</td>
                        <td>
                          <div>
                            <p className="font-medium text-foreground">
                              {language === "th" ? part.nameTh : part.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {language === "th" ? part.categoryTh : part.category}
                            </p>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">฿{part.cost.toLocaleString()}</td>
                        <td className="text-right tabular-nums">
                          ฿{part.sellPrice.toLocaleString()}
                        </td>
                        <td className="text-right">
                          <span className="font-medium tabular-nums text-primary">
                            {part.stock.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right tabular-nums text-muted-foreground">
                          {part.minStock.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusClass
                            )}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={language === "th" ? "เพิ่มจำนวน" : "Add stock"}
                              onClick={() => {
                                setSelectedPartForStock(part.id);
                                setStockToAdd("");
                                setPartSearchQuery("");
                                setIsAddStockDialogOpen(true);
                                setTimeout(() => {
                                  stockInputRef.current?.focus();
                                }, 100);
                              }}
                              title={language === "th" ? "เพิ่มจำนวนสต็อก" : "Add stock"}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t("edit")}
                              onClick={() => openEditDialog(part)}
                              title={t("edit")}
                            >
                              <Edit className="h-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
              </div>
            ) : filteredParts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Package className="w-12 h-12 opacity-50" />
                  <p>{language === "th" ? "ไม่พบรายการอะไหล่" : "No parts found."}</p>
                </div>
              </div>
            ) : (
              filteredParts.map((part) => {
                const status = getPartStatus(part.stock, part.minStock);
                const statusLabel =
                  status === "out"
                    ? language === "th" ? "หมด" : "Out of stock"
                    : status === "low"
                      ? language === "th" ? "ใกล้หมด" : "Low stock"
                      : language === "th" ? "พร้อมขาย" : "Ready";
                const statusClass =
                  status === "out"
                    ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : status === "low"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
                return (
                  <div key={part.id} className="p-4 space-y-3">
                    {/* Header with Image and Info */}
                    <div className="flex items-start gap-3">
                      <PartImageCell 
                        imageUrl={part.imageUrl}
                        alt={language === "th" ? part.nameTh : part.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {language === "th" ? part.nameTh : part.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === "th" ? "รหัส" : "SKU"}: {part.displayId}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                            statusClass
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{language === "th" ? "ราคาทุน" : "Cost"}:</span>
                        <p className="font-medium">฿{part.cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("sellPrice")}:</span>
                        <p className="font-medium">฿{part.sellPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("stock")}:</span>
                        <p className="font-semibold text-primary">{part.stock.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === "th" ? "ขั้นต่ำ" : "Min"}:</span>
                        <p className="text-muted-foreground">{part.minStock.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => {
                          setSelectedPartForStock(part.id);
                          setStockToAdd("");
                          setPartSearchQuery("");
                          setIsAddStockDialogOpen(true);
                          setTimeout(() => {
                            stockInputRef.current?.focus();
                          }, 100);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        {language === "th" ? "เพิ่ม" : "Add"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => openEditDialog(part)}
                      >
                        <Edit className="h-4 w-4" />
                        {t("edit")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </>
      )}
    </MainLayout>
  );
};

export default Inventory;
