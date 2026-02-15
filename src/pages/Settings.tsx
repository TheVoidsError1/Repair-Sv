import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import {
    Bell,
    Globe,
    Lock,
    Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currentUser, updateUser } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    lowStock: true,
    newRepair: true,
    warrantyExpiry: false,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentUser) {
      toast.error(language === "th" ? "ไม่พบข้อมูลผู้ใช้" : "User not found");
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      toast.error(language === "th" ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" : "New password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("confirmNewPassword") + " " + (language === "th" ? "ไม่ตรงกัน" : "do not match"));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // ดึง user data จาก localStorage เพื่อใช้ id จาก backend
      const storedUser = localStorage.getItem('user');
      let userId: string | null = null;

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          userId = userData.id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      if (!userId) {
        toast.error(language === "th" ? "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่" : "User data not found. Please login again");
        setIsUpdatingPassword(false);
        return;
      }

      const response = await apiClient.changePassword(userId, newPassword);

      if (response.status === 'success') {
        toast.success(language === "th" ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
        // อัปเดตใน local state ด้วย
        updateUser(currentUser.id, { password: newPassword });
      } else {
        toast.error(response.message || (language === "th" ? "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" : "Failed to update password"));
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : "Connection error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{t("settings")}</h1>
            <p className="page-description">{t("settingsDescription")}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="language" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="language" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{t("language")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">{t("notifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t("security")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Language Tab */}
        <TabsContent value="language" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("languageSettings")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("choosePreferredLanguage")}
            </p>
            <div className="grid gap-4 max-w-md">
              <div className="grid gap-2">
                <Label>{t("displayLanguage")}</Label>
                <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "th")}>
                  <SelectTrigger>
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("english")}</SelectItem>
                    <SelectItem value="th">{t("thai")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("notificationPreferences")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("configureNotifications")}
            </p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t("emailNotifications")}</p>
                  <p className="text-sm text-muted-foreground">{t("receiveViaEmail")}</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t("pushNotifications")}</p>
                  <p className="text-sm text-muted-foreground">{t("receivePushNotifications")}</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-medium text-foreground mb-4">{t("notificationTypes")}</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{t("lowStockAlertsNotif")}</p>
                      <p className="text-xs text-muted-foreground">{t("whenInventoryFallsBelow")}</p>
                    </div>
                    <Switch
                      checked={notifications.lowStock}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, lowStock: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{t("newRepairOrders")}</p>
                      <p className="text-xs text-muted-foreground">{t("whenNewRepairCreated")}</p>
                    </div>
                    <Switch
                      checked={notifications.newRepair}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newRepair: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{t("warrantyExpiry")}</p>
                      <p className="text-xs text-muted-foreground">{t("beforeWarrantyEnds")}</p>
                    </div>
                    <Switch
                      checked={notifications.warrantyExpiry}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, warrantyExpiry: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab — เปลี่ยนรหัสผ่าน (ทั้งพนักงานและเจ้าของ) */}
        <TabsContent value="security" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("securitySettings")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("manageAccountSecurity")}
            </p>
            <div className="space-y-6 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t("newPassword")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t("enterConfirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                className="gap-2" 
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
              >
                <Lock className="w-4 h-4" />
                {isUpdatingPassword 
                  ? (language === "th" ? "กำลังอัปเดต..." : "Updating...")
                  : t("updatePassword")
                }
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("twoFactorAuth")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("addExtraLayerSecurity")}
            </p>
            <Button variant="outline" className="gap-2">
              <Shield className="w-4 h-4" />
              {t("enable2FA")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Settings;
