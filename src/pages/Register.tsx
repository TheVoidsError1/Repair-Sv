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
import { useLanguage } from "@/contexts/LanguageContext";
import { UserPlus, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "technician",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.firstName.trim()) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "กรุณากรอกชื่อ" : "Please enter first name",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "กรุณากรอกนามสกุล" : "Please enter last name",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.username.trim()) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "กรุณากรอกชื่อผู้ใช้" : "Please enter username",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "กรุณากรอกอีเมล" : "Please enter email",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" : "Password must be at least 4 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
        description: language === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.createPersonnel({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        role: formData.role,
        isActive: true,
      });

      if (response.status === 'success' && response.data) {
        toast({
          title: language === "th" ? "สมัครสมาชิกสำเร็จ" : "Registration successful",
          description: language === "th"
            ? `ยินดีต้อนรับ ${formData.firstName} ${formData.lastName}`
            : `Welcome ${formData.firstName} ${formData.lastName}`,
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "technician",
        });

        // Navigate to login or system management
        setTimeout(() => {
          navigate("/system");
        }, 1500);
      } else {
        toast({
          title: language === "th" ? "สมัครสมาชิกล้มเหลว" : "Registration failed",
          description: response.message || (language === "th" ? "เกิดข้อผิดพลาดในการสมัครสมาชิก" : "Failed to register"),
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
      setIsLoading(false);
    }
  };

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
              {language === "th" ? "สมัครสมาชิก" : "Register"}
            </h1>
            <p className="page-description">
              {language === "th"
                ? "กรอกข้อมูลเพื่อสมัครสมาชิกใหม่"
                : "Fill in the information to register a new account"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    required
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
                    required
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
                  required
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
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === "th" ? "เบอร์โทรศัพท์" : "Phone"} <span className="text-muted-foreground">({language === "th" ? "ไม่บังคับ" : "Optional"})</span>
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

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                {language === "th" ? "บทบาท" : "Role"}
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">
                    {language === "th" ? "ช่างเทคนิค" : "Technician"}
                  </SelectItem>
                  <SelectItem value="staff">
                    {language === "th" ? "พนักงาน" : "Staff"}
                  </SelectItem>
                  <SelectItem value="admin">
                    {language === "th" ? "ผู้ดูแลระบบ" : "Admin"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === "th" ? "รหัสผ่าน" : "Password"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={language === "th" ? "กรอกรหัสผ่าน" : "Enter password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {language === "th" ? "ยืนยันรหัสผ่าน" : "Confirm Password"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={language === "th" ? "ยืนยันรหัสผ่าน" : "Confirm password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-11"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <UserPlus className="w-4 h-4" />
                {isLoading
                  ? (language === "th" ? "กำลังสมัครสมาชิก..." : "Registering...")
                  : (language === "th" ? "สมัครสมาชิก" : "Register")}
              </Button>
              <Link to="/system">
                <Button type="button" variant="outline">
                  {language === "th" ? "ยกเลิก" : "Cancel"}
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
