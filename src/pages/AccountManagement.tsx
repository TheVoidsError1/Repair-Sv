import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Mail, Phone, ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

const AccountManagement = () => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Load user data from API if available
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      // Try to get user data from API
      // For now, use data from AuthContext
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || currentUser.username || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      } else {
        // Fallback to currentUser from context
        setFormData({
          firstName: currentUser.name?.split(' ')[0] || "",
          lastName: currentUser.name?.split(' ').slice(1).join(' ') || "",
          username: currentUser.username || "",
          email: "",
          phone: "",
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      // Update user data via API
      const response = await apiClient.updatePersonnel(currentUser.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
      });

      if (response.status === 'success') {
        toast({
          title: language === "th" ? "บันทึกสำเร็จ" : "Saved successfully",
          description: language === "th"
            ? "ข้อมูลบัญชีถูกอัพเดทแล้ว"
            : "Account information has been updated",
        });
      } else {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: response.message || (language === "th" ? "ไม่สามารถบันทึกข้อมูลได้" : "Failed to save data"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: error instanceof Error
          ? error.message
          : (language === "th" ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : "Connection error"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            {language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-header mb-6">
        <div className="flex items-center gap-4">
          <Link to="/system">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="page-title">
              {language === "th" ? "จัดการบัญชี" : "Account Management"}
            </h1>
            <p className="page-description">
              {language === "th"
                ? "จัดการข้อมูลบัญชีผู้ใช้ของคุณ"
                : "Manage your user account information"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 space-y-6">
          {/* User Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {language === "th" ? "ข้อมูลส่วนตัว" : "Personal Information"}
            </h3>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {language === "th" ? "ชื่อ" : "First Name"}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={language === "th" ? "กรอกชื่อ" : "Enter first name"}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {language === "th" ? "นามสกุล" : "Last Name"}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={language === "th" ? "กรอกนามสกุล" : "Enter last name"}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="pl-11"
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                {language === "th" ? "ชื่อผู้ใช้" : "Username"}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder={language === "th" ? "กรอกชื่อผู้ใช้" : "Enter username"}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-11"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {language === "th" ? "อีเมล" : "Email"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={language === "th" ? "กรอกอีเมล" : "Enter email"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === "th" ? "เบอร์โทรศัพท์" : "Phone"}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={language === "th" ? "กรอกเบอร์โทรศัพท์" : "Enter phone number"}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-11"
                />
              </div>
            </div>
          </div>

          {/* Role Display (Read-only) */}
          {currentUser && (
            <div className="space-y-2">
              <Label>
                {language === "th" ? "บทบาท" : "Role"}
              </Label>
              <Input
                type="text"
                value={currentUser.role === "owner" ? (language === "th" ? "เจ้าของ" : "Owner") : (language === "th" ? "พนักงาน" : "Staff")}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 gap-2"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving
                ? (language === "th" ? "กำลังบันทึก..." : "Saving...")
                : (language === "th" ? "บันทึก" : "Save")}
            </Button>
            <Link to="/system">
              <Button type="button" variant="outline">
                {language === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AccountManagement;
