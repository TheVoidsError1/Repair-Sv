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
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types/user";
import {
    Bell,
    Edit,
    Globe,
    Lock,
    Plus,
    Shield,
    Trash2,
    UserCircle,
    Users,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    formatLastLogin,
  } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    lowStock: true,
    newRepair: true,
    warrantyExpiry: false,
  });
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    role: "staff" as UserRole,
    password: "",
    confirmPassword: "",
  });

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      username: "",
      role: "staff",
      password: "",
      confirmPassword: "",
    });
    setEditingUser(null);
  }, []);

  const openAddDialog = () => {
    resetForm();
    setIsUserDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      username: user.username,
      role: user.role,
      password: "",
      confirmPassword: "",
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      if (form.password && form.password !== form.confirmPassword) {
        toast.error(t("confirmNewPassword") + " " + (language === "th" ? "ไม่ตรงกัน" : "do not match"));
        return;
      }
      updateUser(editingUser.id, {
        name: form.name,
        role: form.role,
        status: editingUser.status,
        ...(form.password ? { password: form.password } : {}),
      });
      toast.success(language === "th" ? "บันทึกผู้ใช้แล้ว" : "User saved");
      setIsUserDialogOpen(false);
      resetForm();
      return;
    }
    if (!form.username.trim()) {
      toast.error(language === "th" ? "กรอกชื่อผู้ใช้" : "Enter username");
      return;
    }
    if (!form.password || form.password.length < 4) {
      toast.error(language === "th" ? "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" : "Password must be at least 4 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t("confirmNewPassword") + " " + (language === "th" ? "ไม่ตรงกัน" : "do not match"));
      return;
    }
    const result = addUser({
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim() || form.username.trim(),
      role: form.role,
      status: "active",
    });
    if (!result.success) {
      if (result.error === "username_exists") {
        toast.error(t("usernameExists"));
      } else {
        toast.error(language === "th" ? "เกิดข้อผิดพลาด" : "Something went wrong");
      }
      return;
    }
    toast.success(language === "th" ? "เพิ่มผู้ใช้แล้ว" : "User added");
    setIsUserDialogOpen(false);
    resetForm();
  };

  const handleDeleteUser = (user: User) => {
    deleteUser(user.id);
    setDeleteTarget(null);
    toast.success(language === "th" ? "ลบผู้ใช้แล้ว" : "User deleted");
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{t("users")}</span>
          </TabsTrigger>
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t("userManagement")}</h3>
                <p className="text-sm text-muted-foreground">{t("manageStaffAccounts")}</p>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsUserDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={openAddDialog}>
                    <Plus className="w-4 h-4" />
                    {t("addUser")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingUser ? t("editUser") : t("addNewUser")}</DialogTitle>
                    <DialogDescription>
                      {editingUser
                        ? (language === "th" ? "แก้ไขข้อมูลผู้ใช้" : "Edit user details")
                        : t("createNewStaffAccount")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t("fullName")}</Label>
                      <Input
                        id="name"
                        placeholder={t("enterFullName")}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username">{t("username")}</Label>
                      <Input
                        id="username"
                        placeholder={t("enterUsername")}
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        disabled={!!editingUser}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">{t("role")}</Label>
                      <Select
                        value={form.role}
                        onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectRole")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">{t("staff")}</SelectItem>
                          <SelectItem value="owner">{t("owner")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">{t("password")}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={editingUser ? (language === "th" ? "เว้นว่างถ้าไม่เปลี่ยน" : "Leave blank to keep current") : t("enterPassword")}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t("enterConfirmPassword")}
                        value={form.confirmPassword}
                        onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsUserDialogOpen(false); resetForm(); }}>
                      {t("cancel")}
                    </Button>
                    <Button onClick={handleSaveUser}>
                      {editingUser ? t("saveChanges") : t("createUser")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-6 space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <span
                          className={cn(
                            "status-badge text-xs",
                            user.role === "owner" ? "status-in-progress" : "status-completed"
                          )}
                        >
                          {user.role === "owner" ? t("owner") : t("staff")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">{t("lastLogin")}</p>
                      <p className="text-sm text-foreground">{formatLastLogin(user.lastLogin)}</p>
                    </div>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        user.status === "active" ? "bg-status-completed" : "bg-muted-foreground"
                      )}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

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

        {/* Security Tab */}
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
                <Label htmlFor="current-password">{t("currentPassword")}</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="gap-2">
                <Lock className="w-4 h-4" />
                {t("updatePassword")}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteUser")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteUserConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteUser(deleteTarget)}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Settings;
