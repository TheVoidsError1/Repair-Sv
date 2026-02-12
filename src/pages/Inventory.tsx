import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Filter,
  Package,
  PlusCircle,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

const initialParts = [
  {
    id: "PART-001",
    name: "iPhone 14 Pro Screen",
    nameTh: "หน้าจอ iPhone 14 Pro",
    category: "Screens",
    categoryTh: "หน้าจอ",
    stock: 2,
    minStock: 5,
    cost: 3500,
    sellPrice: 4500,
  },
  {
    id: "PART-002",
    name: "iPhone 14 Battery",
    nameTh: "แบตเตอรี่ iPhone 14",
    category: "Batteries",
    categoryTh: "แบตเตอรี่",
    stock: 15,
    minStock: 10,
    cost: 800,
    sellPrice: 1200,
  },
  {
    id: "PART-003",
    name: "Samsung S23 Screen",
    nameTh: "หน้าจอ Samsung S23",
    category: "Screens",
    categoryTh: "หน้าจอ",
    stock: 5,
    minStock: 5,
    cost: 4200,
    sellPrice: 5500,
  },
  {
    id: "PART-004",
    name: "Samsung S23 Battery",
    nameTh: "แบตเตอรี่ Samsung S23",
    category: "Batteries",
    categoryTh: "แบตเตอรี่",
    stock: 3,
    minStock: 5,
    cost: 700,
    sellPrice: 1100,
  },
  {
    id: "PART-005",
    name: "USB-C Charging Port",
    nameTh: "พอร์ตชาร์จ USB-C",
    category: "Ports",
    categoryTh: "พอร์ต",
    stock: 8,
    minStock: 10,
    cost: 150,
    sellPrice: 350,
  },
  {
    id: "PART-006",
    name: "iPhone 13 Back Glass",
    nameTh: "กระจกหลัง iPhone 13",
    category: "Glass",
    categoryTh: "กระจก",
    stock: 12,
    minStock: 8,
    cost: 600,
    sellPrice: 950,
  },
  {
    id: "PART-007",
    name: "Pixel 7 Screen",
    nameTh: "หน้าจอ Pixel 7",
    category: "Screens",
    categoryTh: "หน้าจอ",
    stock: 6,
    minStock: 5,
    cost: 3200,
    sellPrice: 4200,
  },
  {
    id: "PART-008",
    name: "Lightning Charging Port",
    nameTh: "พอร์ตชาร์จ Lightning",
    category: "Ports",
    categoryTh: "พอร์ต",
    stock: 20,
    minStock: 15,
    cost: 180,
    sellPrice: 400,
  },
];

const categoriesEn = ["All", "Screens", "Batteries", "Ports", "Glass"];
const categoriesTh = ["ทั้งหมด", "หน้าจอ", "แบตเตอรี่", "พอร์ต", "กระจก"];

const Inventory = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [parts, setParts] = useState(initialParts);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "screen" | "battery" | "others">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  /** รหัสอะไหล่ที่กำลังแก้ไข (null = โหมดเพิ่มใหม่) */
  const [editingPartId, setEditingPartId] = useState<string | null>(null);

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

  const filteredParts = parts.filter((part) => {
    const search = searchQuery.toLowerCase();
    const searchName = (language === "th" ? part.nameTh : part.name).toLowerCase();
    const searchCategory = (language === "th" ? part.categoryTh : part.category).toLowerCase();
    const matchesSearch =
      !search ||
      searchName.includes(search) ||
      part.id.toLowerCase().includes(search) ||
      searchCategory.includes(search);

    const partType = getPartType(part.category);
    const matchesType = typeFilter === "all" || typeFilter === partType;

    return matchesSearch && matchesType;
  });

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setEditingPartId(null);
      setIsAddDialogOpen(true);
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
    }
  }, [searchParams]);

  const openEditDialog = (part: (typeof parts)[0]) => {
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

  const handleSavePart = () => {
    if (!newPart.name.trim() || !newPart.nameTh.trim()) {
      toast({
        title: language === "th" ? "กรุณากรอกชื่อสินค้า" : "Please enter part name",
      });
      return;
    }

    const stock = Number(newPart.stock) || 0;
    const minStock = Number(newPart.minStock) || 0;
    const cost = Number(newPart.cost) || 0;
    const sellPrice = Number(newPart.sellPrice) || 0;
    const categoryValue = newPart.category || "Others";
    const categoryThValue = newPart.categoryTh || "อื่นๆ";

    if (editingPartId) {
      setParts((prev) =>
        prev.map((p) =>
          p.id === editingPartId
            ? {
                ...p,
                name: newPart.name.trim(),
                nameTh: newPart.nameTh.trim(),
                category: categoryValue,
                categoryTh: categoryThValue,
                stock,
                minStock,
                cost,
                sellPrice,
              }
            : p
        )
      );
      toast({
        title: language === "th" ? "แก้ไขสินค้าเรียบร้อย" : "Part updated",
        description:
          language === "th"
            ? "บันทึกการแก้ไขอะไหล่แล้ว"
            : "Part has been updated.",
      });
    } else {
      const nextIndex = parts.length + 1;
      const id = `PART-${nextIndex.toString().padStart(3, "0")}`;
      const created = {
        id,
        name: newPart.name.trim(),
        nameTh: newPart.nameTh.trim(),
        category: categoryValue,
        categoryTh: categoryThValue,
        stock,
        minStock,
        cost,
        sellPrice,
      };
      setParts((prev) => [created, ...prev]);
      toast({
        title: language === "th" ? "เพิ่มสินค้าเรียบร้อย" : "Part added",
        description:
          language === "th"
            ? "บันทึกสินค้าใหม่ลงในคลังแล้ว"
            : "New part has been added to inventory.",
      });
    }

    closeFormDialog();
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
    setIsAddDialogOpen(true);
    navigate("/inventory", { replace: true });
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
          <Button className="gap-2 shrink-0" onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4" />
            {language === "th" ? "เพิ่มสินค้า" : t("addPart")}
          </Button>
        </div>
      </div>

      {/* การ์ดสรุปแจ้งเตือนสถานะสต็อก */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      {/* ค้นหา + กรองประเภท */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={language === "th" ? "Enter เพื่อค้นหาสินค้า" : "Enter to search parts"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2 shrink-0" />
            <SelectValue placeholder={language === "th" ? "ประเภท" : t("category")} />
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
            <SelectItem value="others">
              {language === "th" ? "อะไหล่อื่นๆ" : "Other parts"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {/* ตารางรายการอะไหล่ (รูปแบบเดียวกับหน้างานซ่อม) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="w-12 text-center">{t("edit")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => {
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="font-medium text-foreground tabular-nums">{part.id}</td>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t("edit")}
                        onClick={() => openEditDialog(part)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredParts.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {language === "th" ? "ไม่พบรายการอะไหล่" : "No parts found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Inventory;
