import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const parts = [
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
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categories = language === "th" ? categoriesTh : categoriesEn;

  const filteredParts = parts.filter((part) => {
    const searchName = language === "th" ? part.nameTh : part.name;
    const matchesSearch =
      searchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || 
      categoryFilter === "ทั้งหมด" || 
      part.category === categoryFilter ||
      part.categoryTh === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = parts.filter((p) => p.stock <= p.minStock).length;
  const totalValue = parts.reduce((sum, p) => sum + p.stock * p.cost, 0);

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("sparePartsInventory")}</h1>
            <p className="page-description">{t("inventoryDescription")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("addNewPart")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("addNewSparePart")}</DialogTitle>
                <DialogDescription>{t("enterPartDetails")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="partName">{t("partName")}</Label>
                  <Input id="partName" placeholder="e.g., iPhone 14 Screen" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">{t("category")}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">{t("initialStock")}</Label>
                    <Input id="stock" type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minStock">{t("minStockLevel")}</Label>
                    <Input id="minStock" type="number" placeholder="5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cost">{t("costPrice")} (฿)</Label>
                    <Input id="cost" type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sellPrice">{t("sellPrice")} (฿)</Label>
                    <Input id="sellPrice" type="number" placeholder="0" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>{t("addPart")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalItems")}</p>
              <p className="text-xl font-semibold text-foreground">{parts.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-pending/10">
              <AlertTriangle className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("lowStockItems")}</p>
              <p className="text-xl font-semibold text-foreground">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-completed/10">
              <Package className="w-5 h-5 text-status-completed" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("inventoryValue")}</p>
              <p className="text-xl font-semibold text-foreground">
                ฿{totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchParts")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredParts.map((part) => {
          const isLowStock = part.stock <= part.minStock;
          return (
            <div
              key={part.id}
              className={cn(
                "bg-card rounded-xl border p-4 animate-fade-in",
                isLowStock ? "border-status-cancelled/50" : "border-border"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {part.id}
                </span>
                {isLowStock && (
                  <span className="status-badge status-cancelled text-xs">
                    {t("lowStock")}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {language === "th" ? part.nameTh : part.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {language === "th" ? part.categoryTh : part.category}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">{t("stock")}</p>
                  <p
                    className={cn(
                      "font-semibold",
                      isLowStock ? "text-status-cancelled" : "text-foreground"
                    )}
                  >
                    {part.stock} {t("units")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("sellPrice")}</p>
                  <p className="font-semibold text-foreground">
                    ฿{part.sellPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Edit className="w-3 h-3" />
                  {t("edit")}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
};

export default Inventory;
