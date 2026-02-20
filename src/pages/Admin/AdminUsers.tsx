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
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types/user";
import { Edit, Plus, Trash2, UserCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

/** หนัดการผู้ใช้ — เฉพาะเจ้าของ (Admin) */
const AdminUsers = () => {
  const { t, language } = useLanguage();
  const { users, addUser, updateUser, deleteUser, formatLastLogin } = useAuth();
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      username: "",
      role: "staff",
      password: "",
      confirmPassword: "",
    });
    setFormErrors({});
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
    const errors: Record<string, string> = {};

    if (editingUser) {
      if (!form.name.trim()) {
        errors.name = language === "th" ? "กรุณากรอกชื่อ-นามสกุล" : "Please enter full name";
      }
      if (form.password && form.password.length < 4) {
        errors.password = language === "th" ? "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" : "Password must be at least 4 characters";
      }
      if (form.password && form.password !== form.confirmPassword) {
        errors.confirmPassword = language === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match";
      }
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
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

    if (!form.name.trim()) {
      errors.name = language === "th" ? "กรุณากรอกชื่อ-นามสกุล" : "Please enter full name";
    }
    if (!form.username.trim()) {
      errors.username = language === "th" ? "กรุณากรอกชื่อผู้ใช้" : "Please enter username";
    }
    if (!form.password) {
      errors.password = language === "th" ? "กรุณากรอกรหัสผ่าน" : "Please enter password";
    } else if (form.password.length < 4) {
      errors.password = language === "th" ? "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" : "Password must be at least 4 characters";
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = language === "th" ? "กรุณายืนยันรหัสผ่าน" : "Please confirm password";
    } else if (form.password && form.password !== form.confirmPassword) {
      errors.confirmPassword = language === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const result = addUser({
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      role: form.role,
      status: "active",
    });
    if (!result.success) {
      if (result.error === "username_exists") {
        setFormErrors({ username: t("usernameExists") });
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
            <h1 className="page-title">{language === "th" ? "จัดการผู้ใช้" : "User management"}</h1>
            <p className="page-description">{t("manageStaffAccounts")}</p>
          </div>
        </div>
      </div>

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
                  <Label htmlFor="admin-name">
                    {t("fullName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-name"
                    placeholder={t("enterFullName")}
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-username">
                    {t("userName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-username"
                    placeholder={t("enterUsername")}
                    value={form.username}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, username: e.target.value }));
                      if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    disabled={!!editingUser}
                    className={formErrors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {formErrors.username && <p className="text-xs text-destructive">{formErrors.username}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-role">{t("role")}</Label>
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
                  <Label htmlFor="admin-password">
                    {t("password")} {!editingUser && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder={editingUser ? (language === "th" ? "เว้นว่างถ้าไม่เปลี่ยน" : "Leave blank to keep current") : t("enterPassword")}
                    value={form.password}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, password: e.target.value }));
                      if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={formErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-confirmPassword">
                    {t("confirmPassword")} {!editingUser && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="admin-confirmPassword"
                    type="password"
                    placeholder={t("enterConfirmPassword")}
                    value={form.confirmPassword}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, confirmPassword: e.target.value }));
                      if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    className={formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
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

export default AdminUsers;
