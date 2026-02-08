import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RepairOrderData } from "./RepairBill";

const initialFormData = {
  customer: "",
  phone: "",
  model: "",
  color: "",
  screenLockCode: "",
  problemSymptoms: "",
  deposit: "",
  estimatedPrice: "",
  repairSummaryPrice: "",
  dateOfReport: "",
  timeOfReport: "",
  scheduledPickupTime: "",
};

const pickupHourOptions = (() => {
  const options: { value: string; hour: number }[] = [];
  for (let h = 1; h <= 23; h++) {
    options.push({ value: `${h.toString().padStart(2, "0")}:00`, hour: h });
  }
  options.push({ value: "23:59", hour: 24 });
  return options;
})();

const RepairNew = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);

  const scheduledPickupDate = formData.scheduledPickupTime
    ? (() => {
        const d = new Date(formData.scheduledPickupTime);
        return isNaN(d.getTime()) ? undefined : d;
      })()
    : undefined;
  const scheduledPickupTimeSlot = formData.scheduledPickupTime
    ? formData.scheduledPickupTime.slice(11, 16)
    : "";

  const setScheduledPickupDate = (date: Date | undefined) => {
    const dateStr = date
      ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
      : "";
    const timePart = scheduledPickupTimeSlot || "09:00";
    setFormData((prev) => ({
      ...prev,
      scheduledPickupTime: dateStr ? `${dateStr}T${timePart}` : "",
    }));
  };

  const setScheduledPickupHour = (timeValue: string) => {
    const useSlot = timeValue || "09:00";
    const datePart = scheduledPickupDate
      ? `${scheduledPickupDate.getFullYear()}-${(scheduledPickupDate.getMonth() + 1).toString().padStart(2, "0")}-${scheduledPickupDate.getDate().toString().padStart(2, "0")}`
      : new Date().toISOString().slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      scheduledPickupTime: `${datePart}T${useSlot}`,
    }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setReportDateTimeOnOpen = () => {
    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      dateOfReport: now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      timeOfReport: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
    }));
  };

  useEffect(() => {
    setReportDateTimeOnOpen();
  }, []);

  const handleCreateOrder = () => {
    const now = new Date();
    const defaultDate = now.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const orderData: RepairOrderData = {
      ...formData,
      dateOfReport: formData.dateOfReport || defaultDate,
      timeOfReport: formData.timeOfReport || undefined,
      scheduledPickupTime: formData.scheduledPickupTime || undefined,
    };
    setFormData(initialFormData);
    navigate("/repairs/bill", { state: orderData });
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
                <Label htmlFor="customer">{t("customerName")}</Label>
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
                <Label htmlFor="model">{t("model")}</Label>
                <Input
                  id="model"
                  placeholder={t("enterModel")}
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                />
              </div>
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
                <Label htmlFor="issue">{t("problemSymptoms")}</Label>
                <Textarea
                  id="issue"
                  placeholder={t("enterProblemSymptoms")}
                  className="min-h-[100px] resize-y max-h-[200px]"
                  value={formData.problemSymptoms}
                  onChange={(e) => handleInputChange("problemSymptoms", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>{t("selectScheduledPickupTime")}</Label>
                <div className="flex flex-nowrap items-stretch rounded-lg border border-input bg-background overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 flex-1 min-w-0 rounded-none border-0 border-r border-input bg-transparent gap-2 font-normal hover:bg-muted/50"
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">
                          {scheduledPickupDate
                            ? scheduledPickupDate.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : t("pickUpDate")}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledPickupDate}
                        onSelect={(d) => setScheduledPickupDate(d ?? undefined)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={scheduledPickupTimeSlot || "__none__"}
                    onValueChange={(v) => setScheduledPickupHour(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-10 flex-1 min-w-0 rounded-none border-0 border-l border-input bg-transparent focus:ring-0 focus:ring-offset-0 [&>span]:text-sm">
                      <SelectValue placeholder={t("selectHours")} />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupHourOptions.map(({ value, hour }) => (
                        <SelectItem key={value} value={value}>
                          {hour} {t("hoursUnit")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.scheduledPickupTime && (
                  <p className="text-xs font-medium text-foreground rounded bg-muted/50 px-2.5 py-1.5 border border-border/50 truncate">
                    {t("pickupSummary")}:{" "}
                    {scheduledPickupDate?.toLocaleDateString(language === "th" ? "th-TH" : "en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {scheduledPickupTimeSlot
                      ? (() => {
                          const h = scheduledPickupTimeSlot === "23:59" ? 24 : parseInt(scheduledPickupTimeSlot.slice(0, 2), 10);
                          return `${h} ${t("hoursUnit")}`;
                        })()
                      : "—"}
                  </p>
                )}
              </div>
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
                  onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="repairSummaryPrice">{t("repairSummaryPrice")}</Label>
                <Input
                  id="repairSummaryPrice"
                  type="number"
                  placeholder={t("enterRepairSummaryPrice")}
                  value={formData.repairSummaryPrice}
                  onChange={(e) => handleInputChange("repairSummaryPrice", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 border-t border-border/60 bg-muted/20 py-5 px-6">
            <Button variant="outline" onClick={() => navigate("/repairs")}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreateOrder}>{t("createOrder")}</Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default RepairNew;
