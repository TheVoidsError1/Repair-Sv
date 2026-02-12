import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRepairs } from "@/contexts/RepairsContext";
import { useWarranty, type WarrantyClaim } from "@/contexts/WarrantyContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    CheckCircle,
    CheckCircle2,
    ChevronsUpDown,
    Clock,
    Eye,
    Filter,
    Plus,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { useState } from "react";

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
  const { currentUser } = useAuth();
  const { repairs } = useRepairs();
  const { claims, addClaim, updateClaimStatus } = useWarranty();
  const { toast } = useToast();
  const isOwner = currentUser?.role === "owner";
  const pendingClaims = claims.filter((c) => c.status === "pending");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);

  // เลือกได้เฉพาะงานซ่อมที่เสร็จแล้ว (และยังไม่มีเคลมของงานนี้ในบางระบบ — ที่นี่ให้เลือกซ้ำได้)
  const completedRepairs = repairs.filter((r) => r.status === "completed");

  const statusLabels: Record<string, string> = {
    pending: t("pendingReview"),
    "in-progress": t("underInspection"),
    approved: t("approved"),
    rejected: t("rejected"),
  };

  const filteredClaims = claims.filter((claim) => {
    const repair = repairs.find((r) => r.id === claim.repairId);
    const customer = repair?.customer ?? "";
    const matchesSearch =
      claim.repairId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;

  // ฟอร์มสร้างเคลมใหม่
  const [newRepairId, setNewRepairId] = useState("");
  const [newClaimReason, setNewClaimReason] = useState("");
  const [repairComboboxOpen, setRepairComboboxOpen] = useState(false);

  const handleSubmitClaim = () => {
    if (!newRepairId.trim()) {
      toast({
        title: language === "th" ? "แจ้งเตือน" : "Notice",
        description:
          language === "th"
            ? "กรุณาเลือกงานซ่อมเดิม"
            : "Please select the original repair.",
        variant: "destructive",
      });
      return;
    }
    if (!newClaimReason.trim()) {
      toast({
        title: language === "th" ? "แจ้งเตือน" : "Notice",
        description:
          language === "th"
            ? "กรุณากรอกเหตุผลการเคลม"
            : "Please enter the claim reason.",
        variant: "destructive",
      });
      return;
    }
    const reason = newClaimReason.trim();
    addClaim({
      repairId: newRepairId,
      claimReason: reason,
      claimReasonTh: reason,
    });
    toast({
      title: language === "th" ? "สำเร็จ" : "Success",
      description: t("submitClaim"),
    });
    setNewRepairId("");
    setNewClaimReason("");
    setIsDialogOpen(false);
  };

  const selectedRepairForForm = newRepairId
    ? completedRepairs.find((r) => r.id === newRepairId)
    : null;
  const repairDisplayText = selectedRepairForForm
    ? `${selectedRepairForForm.id} · ${selectedRepairForForm.customer} · ${language === "th" ? selectedRepairForForm.issueTh : selectedRepairForForm.issue}`
    : "";

  const handleViewReport = (claim: WarrantyClaim) => {
    setSelectedClaim(claim);
    setReportDialogOpen(true);
  };

  const selectedRepair = selectedClaim
    ? repairs.find((r) => r.id === selectedClaim.repairId)
    : null;

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
                  <Popover open={repairComboboxOpen} onOpenChange={setRepairComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="repairId"
                        variant="outline"
                        role="combobox"
                        aria-expanded={repairComboboxOpen}
                        className={cn(
                          "w-full justify-between font-normal",
                          !newRepairId && "text-muted-foreground"
                        )}
                      >
                        {repairDisplayText || t("searchRepairPlaceholder")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command
                        key={String(repairComboboxOpen)}
                        filter={(value, search) => {
                          const s = search.toLowerCase();
                          if (!s) return 1;
                          return value.toLowerCase().includes(s) ? 1 : 0;
                        }}
                      >
                        <CommandInput placeholder={t("searchRepairPlaceholder")} />
                        <CommandList>
                          <CommandEmpty>{t("noRepairFound")}</CommandEmpty>
                          <CommandGroup>
                            {completedRepairs.map((r) => {
                              const label = `${r.id} · ${r.customer} · ${language === "th" ? r.issueTh : r.issue}`;
                              const searchValue = `${r.id} ${r.customer} ${r.device} ${r.issue} ${r.issueTh}`;
                              return (
                                <CommandItem
                                  key={r.id}
                                  value={searchValue}
                                  onSelect={() => {
                                    setNewRepairId(r.id);
                                    setRepairComboboxOpen(false);
                                  }}
                                >
                                  {label}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="claimReason">{t("claimReason")}</Label>
                  <Textarea
                    id="claimReason"
                    placeholder={t("describeIssue")}
                    value={newClaimReason}
                    onChange={(e) => setNewClaimReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSubmitClaim}>{t("submitClaim")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* เจ้าของเท่านั้น: จัดการคำขออนุมัติเคลม */}
      {isOwner && pendingClaims.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-500/30 border-border overflow-hidden mb-6">
          <div className="p-4 border-b border-border bg-amber-500/5">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              {language === "th" ? "คำขอที่รออนุมัติ" : "Pending approval"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "th" ? "อนุมัติหรือปฏิเสธเคลมการรับประกัน" : "Approve or reject warranty claims"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("claimId")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("claimReason")}</th>
                  <th>{t("date")}</th>
                  <th>{language === "th" ? "การดำเนินการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => {
                  const repair = repairs.find((r) => r.id === claim.repairId);
                  const customer = repair?.customer ?? "—";
                  const reasonText = language === "th" ? claim.claimReasonTh : claim.claimReason;
                  return (
                    <tr key={claim.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground">{claim.id}</p>
                          <p className="text-xs text-muted-foreground">{claim.repairId}</p>
                        </div>
                      </td>
                      <td>{customer}</td>
                      <td className="max-w-[200px] truncate">{reasonText}</td>
                      <td>{claim.claimDate}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1 bg-status-completed hover:bg-status-completed/90"
                            onClick={() => {
                              updateClaimStatus(claim.id, "approved");
                              toast({
                                title: language === "th" ? "อนุมัติแล้ว" : "Approved",
                                description: `${claim.id} ${language === "th" ? "อนุมัติเคลมแล้ว" : "claim approved"}`,
                              });
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {language === "th" ? "อนุมัติ" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => {
                              updateClaimStatus(claim.id, "rejected");
                              toast({
                                title: language === "th" ? "ปฏิเสธแล้ว" : "Rejected",
                                description: `${claim.id} ${language === "th" ? "ปฏิเสธเคลมแล้ว" : "claim rejected"}`,
                                variant: "destructive",
                              });
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            {language === "th" ? "ปฏิเสธ" : "Reject"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards — รูปแบบเดียวกับ Finance / Repairs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-pending/10">
              <Clock className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("pending")}</p>
              <p className="text-xl font-semibold text-foreground">
                {pendingCount}
              </p>
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
              <p className="text-xl font-semibold text-foreground">
                {approvedCount}
              </p>
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
              <p className="text-xl font-semibold text-foreground">
                {rejectedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ค้นหา + ตัวกรอง — รูปแบบเดียวกับ Repairs / Inventory */}
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
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t("filterByStatus")} />
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

      {/* ตารางเคลม — แสดงข้อมูลจากงานซ่อมที่อ้างอิง */}
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
                <th>{t("report")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => {
                const repair = repairs.find((r) => r.id === claim.repairId);
                const originalRepairText = repair
                  ? language === "th"
                    ? repair.issueTh
                    : repair.issue
                  : "—";
                const customer = repair?.customer ?? "—";
                const device = repair?.device ?? "—";
                const reasonText =
                  language === "th" ? claim.claimReasonTh : claim.claimReason;
                return (
                  <tr key={claim.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{claim.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {claim.repairId}
                        </p>
                      </div>
                    </td>
                    <td>{customer}</td>
                    <td>{device}</td>
                    <td>{originalRepairText}</td>
                    <td className="max-w-[200px] truncate">{reasonText}</td>
                    <td>
                      <span
                        className={`status-badge ${statusStyles[claim.status]} flex items-center gap-1`}
                      >
                        {statusIcons[claim.status]}
                        {statusLabels[claim.status]}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleViewReport(claim)}
                      >
                        <Eye className="w-4 h-4" />
                        {t("view")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog ดูรายงานเคลม — แสดงข้อมูลเคลม + งานซ่อมที่เชื่อมกัน */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {t("report")} · {selectedClaim?.id ?? ""}
            </DialogTitle>
            <DialogDescription>
              {t("claimId")}: {selectedClaim?.id} / {selectedClaim?.repairId}
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="grid gap-4 py-2">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customer")} / {t("device")} / {t("originalRepair")}
                </p>
                <p className="text-foreground">
                  {selectedRepair
                    ? `${selectedRepair.customer} · ${selectedRepair.device} · ${language === "th" ? selectedRepair.issueTh : selectedRepair.issue}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("claimReason")}
                </p>
                <p className="text-foreground">
                  {language === "th"
                    ? selectedClaim.claimReasonTh
                    : selectedClaim.claimReason}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("status")}:
                </span>
                <span
                  className={`status-badge ${statusStyles[selectedClaim.status]} flex items-center gap-1`}
                >
                  {statusIcons[selectedClaim.status]}
                  {statusLabels[selectedClaim.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("date")}: {selectedClaim.claimDate}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Warranty;
