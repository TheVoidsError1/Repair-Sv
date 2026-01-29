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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Eye, Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

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
};

const Repairs = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    "in-progress": t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("createNewRepairOrder")}</DialogTitle>
                <DialogDescription>{t("enterCustomerDeviceDetails")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer">{t("customerName")}</Label>
                  <Input id="customer" placeholder={t("enterCustomerName")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("phoneNumber")}</Label>
                  <Input id="phone" placeholder={t("enterPhoneNumber")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="device">{t("device")}</Label>
                  <Input id="device" placeholder="e.g., iPhone 14 Pro" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issue">{t("issueDescription")}</Label>
                  <Textarea id="issue" placeholder={t("describeRepairIssue")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="technician">{t("assignTechnician")}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectTechnician")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tom">Tom</SelectItem>
                      <SelectItem value="anna">Anna</SelectItem>
                      <SelectItem value="unassigned">{t("leaveUnassigned")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
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
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          {t("viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
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
    </MainLayout>
  );
};

export default Repairs;
