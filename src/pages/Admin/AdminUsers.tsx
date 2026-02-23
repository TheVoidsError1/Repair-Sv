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
import { Edit, Lock, Mail, Phone, Plus, Shield, Trash2, User as UserIcon, UserCircle, UserPlus, AlertCircle } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

/** หนัดการผู้ใช้ — เฉพาะเจ้าของ (Admin) */
const AdminUsers = () => {
  const { t, language } = useLanguage();
  const { users, addUser, updateUser, deleteUser, formatLastLogin, setUsers, currentUser } = useAuth();
  const isOwner = currentUser?.role === "owner";
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "staff" as UserRole,
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // โหลด users จาก backend เมื่อ component mount
  useEffect(() => {
    const loadUsersFromBackend = async () => {
      try {
        const response = await apiClient.getPersonnel();
        if (response.status === 'success' && response.data) {
          // แปลงข้อมูลจาก backend เป็นรูปแบบ User
          const backendUsers: User[] = response.data.map((personnel: any) => ({
            id: personnel.id,
            username: personnel.username,
            password: "", // ไม่เก็บ password
            name: `${personnel.firstName || ''} ${personnel.lastName || ''}`.trim() || personnel.username,
            email: personnel.email || undefined,
            phone: personnel.phone || undefined,
            role: personnel.role === 'admin' ? 'owner' : 'staff',
            status: personnel.isActive ? 'active' : 'inactive',
            lastLogin: personnel.lastLogin ? new Date(personnel.lastLogin).toISOString() : null,
          }));
          setUsers(backendUsers);
        }
      } catch (error) {
        console.error('Error loading users from backend:', error);
      }
    };
    void loadUsersFromBackend();
  }, [setUsers]);

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      username: "",
      email: "",
      phone: "",
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
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      password: "",
      confirmPassword: "",
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!isOwner) {
      toast.error(language === "th" ? "คุณไม่มีสิทธิ์ในการจัดการผู้ใช้" : "You do not have permission to manage users");
      return;
    }

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
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
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
    if (!form.email.trim()) {
      errors.email = language === "th" ? "กรุณากรอกอีเมล" : "Please enter email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = language === "th" ? "รูปแบบอีเมลไม่ถูกต้อง" : "Invalid email format";
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

    setIsLoading(true);
    try {
      // แปลง name เป็น firstName และ lastName
      const nameParts = form.name.trim().split(/\s+/);
      const firstName = nameParts[0] || form.name.trim();
      const lastName = nameParts.slice(1).join(' ') || '';

      // แปลง role: owner -> admin, staff -> staff
      const backendRole = form.role === 'owner' ? 'admin' : 'staff';

      // สร้างผู้ใช้ผ่าน API
      const response = await apiClient.createPersonnel({
        firstName,
        lastName,
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: backendRole,
        isActive: true,
      });

      if (response.status === 'success' && response.data) {
        // เพิ่ม user ใหม่เข้า local state
        const newUser: User = {
          id: response.data.id,
          username: response.data.username,
          password: "",
          name: `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim() || response.data.username,
          email: response.data.email || undefined,
          phone: response.data.phone || undefined,
          role: response.data.role === 'admin' ? 'owner' : 'staff',
          status: response.data.isActive ? 'active' : 'inactive',
          lastLogin: null,
        };
        addUser(newUser);
        toast.success(language === "th" ? "เพิ่มผู้ใช้แล้ว" : "User added");
        setIsUserDialogOpen(false);
        resetForm();
      } else {
        const errorMessage = response.message || (language === "th" ? "เกิดข้อผิดพลาด" : "Something went wrong");
        if (errorMessage.includes('Username already exists') || errorMessage.includes('username')) {
          setFormErrors({ username: t("usernameExists") });
        } else if (errorMessage.includes('Email already exists') || errorMessage.includes('email')) {
          setFormErrors({ email: language === "th" ? "อีเมลนี้มีอยู่แล้ว" : "Email already exists" });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้" : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!isOwner) {
      toast.error(language === "th" ? "คุณไม่มีสิทธิ์ในการลบผู้ใช้" : "You do not have permission to delete users");
      return;
    }

    try {
      // ลบผู้ใช้จาก backend
      const response = await apiClient.deletePersonnel(user.id);
      
      if (response.status === 'success') {
        // ลบจาก local state
        deleteUser(user.id);
        setDeleteTarget(null);
        toast.success(language === "th" ? "ลบผู้ใช้แล้ว" : "User deleted");
      } else {
        toast.error(response.message || (language === "th" ? "เกิดข้อผิดพลาดในการลบผู้ใช้" : "Failed to delete user"));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการลบผู้ใช้" : "Failed to delete user");
    }
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

      {!isOwner && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground mb-1">
              {language === "th" ? "ไม่มีสิทธิ์เข้าถึง" : "Access Denied"}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === "th" 
                ? "คุณไม่มีสิทธิ์ในการจัดการผู้ใช้ในระบบ กรุณาติดต่อผู้ดูแลระบบ" 
                : "You do not have permission to manage users. Please contact the system administrator."}
            </p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t("userManagement")}</h3>
            <p className="text-sm text-muted-foreground">{t("manageStaffAccounts")}</p>
          </div>
          <Dialog open={isUserDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsUserDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openAddDialog} disabled={!isOwner}>
                <Plus className="w-4 h-4" />
                {t("addUser")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">
                      {editingUser ? t("editUser") : t("addNewUser")}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingUser
                        ? (language === "th" ? "แก้ไขข้อมูลผู้ใช้" : "Edit user details")
                        : t("createNewStaffAccount")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* ชื่อ-นามสกุล */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-name">
                    {t("fullName")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-name"
                      placeholder={t("enterFullName")}
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }));
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      className={cn("pl-10", formErrors.name ? "border-destructive focus-visible:ring-destructive" : "")}
                    />
                  </div>
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>

                {/* ชื่อผู้ใช้ */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-username">
                    {language === "th" ? "ชื่อผู้ใช้" : "Username"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-username"
                      placeholder={language === "th" ? "กรอกชื่อผู้ใช้" : "Enter username"}
                      value={form.username}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, username: e.target.value }));
                        if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: "" }));
                      }}
                      disabled={!!editingUser}
                      className={cn("pl-10", formErrors.username ? "border-destructive focus-visible:ring-destructive" : "")}
                    />
                  </div>
                  {formErrors.username && <p className="text-xs text-destructive">{formErrors.username}</p>}
                </div>

                {/* อีเมล + เบอร์โทร (2 คอลัมน์) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email">
                      {language === "th" ? "อีเมล" : "Email"}
                      <span className="text-destructive">*</span>
                      <span className="text-muted-foreground text-xs ml-1">({language === "th" ? "ใช้สำหรับเข้าสู่ระบบ" : "Used for login"})</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder={language === "th" ? "กรอกอีเมล" : "Enter email"}
                        value={form.email}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, email: e.target.value }));
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className={cn("pl-10", formErrors.email ? "border-destructive focus-visible:ring-destructive" : "")}
                        required
                      />
                    </div>
                    {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-phone">
                      {language === "th" ? "เบอร์โทร" : "Phone"}
                      <span className="text-muted-foreground text-xs ml-1">({language === "th" ? "ไม่บังคับ" : "Optional"})</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin-phone"
                        type="tel"
                        placeholder={language === "th" ? "กรอกเบอร์โทร" : "Enter phone"}
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* บทบาท */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-role">{t("role")}</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={form.role}
                      onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder={t("selectRole")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">{t("staff")}</SelectItem>
                        <SelectItem value="owner">{t("owner")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* รหัสผ่าน + ยืนยัน (2 คอลัมน์) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-password">
                      {t("password")} {!editingUser && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder={editingUser ? (language === "th" ? "เว้นว่างถ้าไม่เปลี่ยน" : "Leave blank") : t("enterPassword")}
                        value={form.password}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, password: e.target.value }));
                          if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className={cn("pl-10", formErrors.password ? "border-destructive focus-visible:ring-destructive" : "")}
                      />
                    </div>
                    {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-confirmPassword">
                      {t("confirmPassword")} {!editingUser && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin-confirmPassword"
                        type="password"
                        placeholder={language === "th" ? "ยืนยันรหัสผ่าน" : "Confirm"}
                        value={form.confirmPassword}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, confirmPassword: e.target.value }));
                          if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }}
                        className={cn("pl-10", formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : "")}
                      />
                    </div>
                    {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => { setIsUserDialogOpen(false); resetForm(); }} className="flex-1">
                  {t("cancel")}
                </Button>
                <Button onClick={handleSaveUser} className="flex-1 gap-2" disabled={isLoading || !isOwner}>
                  <UserPlus className="w-4 h-4" />
                  {isLoading 
                    ? (language === "th" ? "กำลังสร้าง..." : "Creating...")
                    : (editingUser ? t("saveChanges") : t("createUser"))
                  }
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
                <div className="text-right">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditDialog(user)}
                    disabled={!isOwner}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(user)}
                    disabled={!isOwner}
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
