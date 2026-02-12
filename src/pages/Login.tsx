import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Lock, Settings2, Smartphone, Wrench } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { t, language } = useLanguage();
  const { loginFromApi } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password);

      if (response.status === 'success' && response.data) {
        // Save token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Sync with AuthContext
        loginFromApi({
          email: response.data.user.email || email,
          username: response.data.user.username,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          name: response.data.user.name,
          role: response.data.user.role || (response.data.user.isOwner ? "owner" : "staff"),
        });

        const userName = response.data.user.name || 
          `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim() || 
          response.data.user.email || 
          email;

        toast({
          title: language === "th" ? "เข้าสู่ระบบสำเร็จ" : "Login successful",
          description: language === "th" 
            ? `ยินดีต้อนรับ ${userName}`
            : `Welcome ${userName}`,
        });

        // รอให้ state update ก่อน navigate
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      } else {
        toast({
          title: language === "th" ? "เข้าสู่ระบบล้มเหลว" : "Login failed",
          description: response.message || (language === "th" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : "Invalid email or password"),
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
    <div className="min-h-screen flex bg-slate-50/80">
      {/* ซ้าย - ส่วน Branding (ธีมร้านซ่อมมือถือ เรียบหรู) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/90 p-12 xl:p-16">
        {/* ลายพื้นหลังเบา ๆ */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
              <Smartphone className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Macfix service</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight tracking-tight">
            {language === "th"
              ? "ระบบจัดการร้านซ่อมมือถือ"
              : "Mobile Repair Shop Management"}
          </h2>
          <p className="text-white/75 text-base xl:text-lg max-w-md leading-relaxed">
            {language === "th"
              ? "จัดการงานซ่อม สินค้าคงคลัง การเงิน และการรับประกัน ในที่เดียว"
              : "Manage repairs, inventory, finance, and warranty all in one place"}
          </p>
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2.5 text-white/70">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
                <Wrench className="w-4 h-4 text-indigo-300" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium">
                {language === "th" ? "ติดตามงานซ่อม" : "Track repairs"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-white/70">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
                <Settings2 className="w-4 h-4 text-indigo-300" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium">
                {language === "th" ? "จัดการสต็อก" : "Manage stock"}
              </span>
            </div>
          </div>
        </div>

        <p className="relative text-white/40 text-sm">
          © {new Date().getFullYear()} Macfix service.{" "}
          {language === "th" ? "ระบบจัดการร้านซ่อม" : "Repair shop management"}
        </p>
      </div>

      {/* ขวา - ฟอร์ม Login (สวยเรียบ เน้นฟอร์ม) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white min-h-screen">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo สำหรับ Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 shadow-lg mb-3">
              <Smartphone className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-lg font-semibold text-slate-800 tracking-tight">Macfix service</span>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-slate-500 text-sm">{t("loginSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.8} />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.8} />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <span className="text-sm text-slate-600">
                  {t("rememberMe")}
                </span>
              </label>
              <Link
                to="#"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading 
                ? (language === "th" ? "กำลังเข้าสู่ระบบ..." : "Logging in...")
                : t("loginButton")
              }
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            {language === "th"
              ? "ระบบจัดการร้านซ่อมมือถือ Macfix"
              : "Macfix Mobile Repair Shop Management"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
