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
import {
  Plus,
  Search,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const claims = [
  {
    id: "WRN-001",
    repairId: "REP-001",
    customer: "John Doe",
    device: "iPhone 14 Pro",
    originalRepair: "Screen Replacement",
    originalRepairTh: "เปลี่ยนหน้าจอ",
    claimReason: "Screen flickering after 2 weeks",
    claimReasonTh: "หน้าจอกระพริบหลังจาก 2 สัปดาห์",
    status: "pending",
    claimDate: "2024-01-15",
    warrantyEnd: "2024-04-15",
  },
  {
    id: "WRN-002",
    repairId: "REP-003",
    customer: "Mike Johnson",
    device: "Google Pixel 7",
    originalRepair: "Water Damage Repair",
    originalRepairTh: "ซ่อมเสียหายจากน้ำ",
    claimReason: "Device not charging properly",
    claimReasonTh: "อุปกรณ์ชาร์จไม่เข้า",
    status: "approved",
    claimDate: "2024-01-14",
    warrantyEnd: "2024-04-14",
  },
  {
    id: "WRN-003",
    repairId: "REP-010",
    customer: "Lisa Anderson",
    device: "Samsung Galaxy S22",
    originalRepair: "Battery Replacement",
    originalRepairTh: "เปลี่ยนแบตเตอรี่",
    claimReason: "Battery drains too fast",
    claimReasonTh: "แบตเตอรี่หมดเร็วเกินไป",
    status: "in-progress",
    claimDate: "2024-01-13",
    warrantyEnd: "2024-04-13",
  },
  {
    id: "WRN-004",
    repairId: "REP-008",
    customer: "Robert Taylor",
    device: "iPhone 12",
    originalRepair: "Back Glass Repair",
    originalRepairTh: "ซ่อมกระจกหลัง",
    claimReason: "Glass cracked again",
    claimReasonTh: "กระจกแตกอีกครั้ง",
    status: "rejected",
    claimDate: "2024-01-12",
    warrantyEnd: "2024-04-12",
  },
];

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  approved: "status-completed",
  rejected: "status-cancelled",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  "in-progress": <ShieldCheck className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
};

const Warranty = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const statusLabels: Record<string, string> = {
    pending: t("pendingReview"),
    "in-progress": t("underInspection"),
    approved: t("approved"),
    rejected: t("rejected"),
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.repairId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("warrantyClaims")}</h1>
            <p className="page-description">{t("warrantyDescription")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("newClaim")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("createWarrantyClaim")}</DialogTitle>
                <DialogDescription>{t("submitNewWarrantyClaim")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="repairId">{t("originalRepairId")}</Label>
                  <Input id="repairId" placeholder="e.g., REP-001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="claimReason">{t("claimReason")}</Label>
                  <Textarea id="claimReason" placeholder={t("describeIssue")} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  {t("submitClaim")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-pending/10">
              <Clock className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("pending")}</p>
              <p className="text-xl font-semibold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-completed/10">
              <CheckCircle className="w-5 h-5 text-status-completed" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("approved")}</p>
              <p className="text-xl font-semibold text-foreground">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-cancelled/10">
              <XCircle className="w-5 h-5 text-status-cancelled" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("rejected")}</p>
              <p className="text-xl font-semibold text-foreground">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchClaims")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="in-progress">{t("underInspection")}</SelectItem>
            <SelectItem value="approved">{t("approved")}</SelectItem>
            <SelectItem value="rejected">{t("rejected")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Claims Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("claimId")}</th>
                <th>{t("customer")}</th>
                <th>{t("device")}</th>
                <th>{t("originalRepair")}</th>
                <th>{t("claimReason")}</th>
                <th>{t("status")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.id}>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{claim.id}</p>
                      <p className="text-xs text-muted-foreground">{claim.repairId}</p>
                    </div>
                  </td>
                  <td>{claim.customer}</td>
                  <td>{claim.device}</td>
                  <td>{language === "th" ? claim.originalRepairTh : claim.originalRepair}</td>
                  <td className="max-w-[200px] truncate">
                    {language === "th" ? claim.claimReasonTh : claim.claimReason}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${statusStyles[claim.status]} flex items-center gap-1`}
                    >
                      {statusIcons[claim.status]}
                      {statusLabels[claim.status]}
                    </span>
                  </td>
                  <td>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="w-4 h-4" />
                      {t("view")}
                    </Button>
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

export default Warranty;
