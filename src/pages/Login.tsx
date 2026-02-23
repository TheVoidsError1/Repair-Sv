import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Lock, Settings2, Smartphone, Wrench, UserCircle2, Crown } from "lucide-react";
import { type FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { t, language } = useLanguage();
  const { loginFromApi } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"owner" | "staff">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // โหลดข้อมูลที่จดจำไว้เมื่อ component mount
  useEffect(() => {
    const rememberedData = localStorage.getItem('rememberedLogin');
    if (rememberedData) {
      try {
        const parsed = JSON.parse(rememberedData);
        if (parsed.email && parsed.password) {
          setEmail(parsed.email);
          setPassword(parsed.password);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading remembered login:', error);
      }
    }
  }, []);

  // จัดการ rememberMe เมื่อ checkbox เปลี่ยน
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      // ถ้า uncheck ให้ลบข้อมูลที่จดจำไว้
      localStorage.removeItem('rememberedLogin');
    }
  };

  // เพิ่ม CSS animations เมื่อ component mount
  useEffect(() => {
    // ตรวจสอบว่ามี style tag อยู่แล้วหรือไม่
    if (document.getElementById('login-animations')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'login-animations';
    style.textContent = `
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slide-in-left {
        from {
          transform: translateX(-30px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slide-in-right {
        from {
          transform: translateX(30px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fade-in-up {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slide-in-up {
        from {
          transform: translateY(30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes float-slow {
        0%, 100% {
          transform: translate(-50%, -50%) translateY(0px);
        }
        50% {
          transform: translate(-50%, -50%) translateY(-20px);
        }
      }

      @keyframes float-reverse {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(20px);
        }
      }

      @keyframes pulse-slow {
        0%, 100% {
          opacity: 0.04;
        }
        50% {
          opacity: 0.06;
        }
      }

      .animate-fade-in {
        animation: fade-in 0.6s ease-out;
      }

      .animate-slide-in-left {
        animation: slide-in-left 0.8s ease-out;
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.8s ease-out;
      }

      .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out;
      }

      .animate-fade-in-up-delay {
        animation: fade-in-up 0.6s ease-out 0.2s both;
      }

      .animate-fade-in-up-delay-2 {
        animation: fade-in-up 0.6s ease-out 0.4s both;
      }

      .animate-slide-in-up {
        animation: slide-in-up 0.8s ease-out 0.3s both;
      }

      .animate-slide-in-up-delay {
        animation: slide-in-up 0.8s ease-out 0.5s both;
      }

      .animate-float-slow {
        animation: float-slow 6s ease-in-out infinite;
      }

      .animate-float-reverse {
        animation: float-reverse 8s ease-in-out infinite;
      }

      .animate-pulse-slow {
        animation: pulse-slow 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      const styleElement = document.getElementById('login-animations');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password, selectedRole);

      if (response.status === 'success' && response.data) {
        // Save token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // บันทึกข้อมูล login ถ้า rememberMe เป็น true
        if (rememberMe) {
          localStorage.setItem('rememberedLogin', JSON.stringify({
            email: email,
            password: password
          }));
        } else {
          // ลบข้อมูลที่จดจำไว้ถ้า rememberMe เป็น false
          localStorage.removeItem('rememberedLogin');
        }

        // Sync with AuthContext — map backend role to frontend role
        const backendRole = response.data.user.role;
        const frontendRole = backendRole === 'admin' ? 'owner' : 'staff';

        loginFromApi({
          email: response.data.user.email || email,
          username: response.data.user.username,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          name: response.data.user.name,
          role: frontendRole,
        });

        const userName = response.data.user.name || 
          `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim() || 
          response.data.user.email || 
          email;

        toast({
          title: t("loginSuccessful"),
          description: `${t("welcomeUser")} ${userName}`,
        });

        // รอให้ state update ก่อน navigate
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      } else {
        toast({
          title: t("loginFailed"),
          description: response.message || t("invalidCredentials"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error 
          ? error.message 
          : t("connectionError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/80 animate-fade-in">
      {/* ซ้าย - ส่วน Branding (ธีมร้านซ่อมมือถือ เรียบหรู) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/90 p-12 xl:p-16 animate-slide-in-left">
        {/* ลายพื้นหลังเบา ๆ */}
        <div className="absolute inset-0 opacity-[0.04] animate-pulse-slow" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float-slow" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl animate-float-reverse" />

        <div className="relative">
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg hover:bg-white/15 hover:scale-110 transition-all duration-300 cursor-pointer group">
              <Smartphone className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.8} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Macfix service</span>
          </div>
        </div>

        <div className="relative space-y-6 animate-fade-in-up-delay">
          <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight tracking-tight animate-slide-in-up">
            {t("mobileRepairShopManagement")}
          </h2>
          <p className="text-white/75 text-base xl:text-lg max-w-md leading-relaxed animate-slide-in-up-delay">
            {t("manageRepairsInventoryFinance")}
          </p>
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors duration-300 group cursor-pointer">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                <Wrench className="w-4 h-4 text-indigo-300 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium">
                {t("trackRepairs")}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors duration-300 group cursor-pointer">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                <Settings2 className="w-4 h-4 text-indigo-300 group-hover:rotate-180 transition-transform duration-300" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium">
                {t("manageStock")}
              </span>
            </div>
          </div>
        </div>

        <p className="relative text-white/40 text-sm">
          © {new Date().getFullYear()} Macfix service. {t("repairShopManagement")}
        </p>
      </div>

      {/* ขวา - ฟอร์ม Login (สวยเรียบ เน้นฟอร์ม) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white min-h-screen animate-slide-in-right">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo สำหรับ Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-6 animate-fade-in-up">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 shadow-lg mb-3 hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <Smartphone className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.8} />
            </div>
            <span className="text-lg font-semibold text-slate-800 tracking-tight">Macfix service</span>
          </div>

          <div className="text-center lg:text-left animate-fade-in-up-delay">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-slate-500 text-sm">{t("loginSubtitle")}</p>
          </div>

          {/* Role Selector */}
          <div className="animate-fade-in-up-delay">
            <p className="text-sm font-medium text-slate-600 mb-3">{t("loginAsRole")}</p>
            <div className="grid grid-cols-2 gap-3">
              {/* พนักงาน */}
              <button
                type="button"
                onClick={() => setSelectedRole("staff")}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                  ${selectedRole === "staff"
                    ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100 scale-[1.02]"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.01]"
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300
                  ${selectedRole === "staff"
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                    : "bg-slate-200 text-slate-500"
                  }
                `}>
                  <UserCircle2 className="w-6 h-6" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-semibold transition-colors duration-300 ${selectedRole === "staff" ? "text-indigo-700" : "text-slate-600"}`}>
                    {t("loginAsStaff")}
                  </p>
                  <p className={`text-xs mt-0.5 transition-colors duration-300 ${selectedRole === "staff" ? "text-indigo-400" : "text-slate-400"}`}>
                    Employee
                  </p>
                </div>
                {selectedRole === "staff" && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </button>

              {/* เจ้าของร้าน */}
              <button
                type="button"
                onClick={() => setSelectedRole("owner")}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer relative
                  ${selectedRole === "owner"
                    ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-100 scale-[1.02]"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.01]"
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300
                  ${selectedRole === "owner"
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                    : "bg-slate-200 text-slate-500"
                  }
                `}>
                  <Crown className="w-6 h-6" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-semibold transition-colors duration-300 ${selectedRole === "owner" ? "text-amber-700" : "text-slate-600"}`}>
                    {t("loginAsOwner")}
                  </p>
                  <p className={`text-xs mt-0.5 transition-colors duration-300 ${selectedRole === "owner" ? "text-amber-400" : "text-slate-400"}`}>
                    Owner
                  </p>
                </div>
                {selectedRole === "owner" && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up-delay-2">
            <div className="space-y-2 group">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-indigo-600"
              >
                {language === "th" ? "อีเมลหรือชื่อผู้ใช้" : "Email or Username"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-indigo-500 group-focus-within:scale-110" strokeWidth={1.8} />
                <Input
                  id="email"
                  type="text"
                  placeholder={language === "th" ? "กรอกอีเมลหรือชื่อผู้ใช้" : "Enter email or username"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 focus:scale-[1.02] focus:shadow-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-indigo-600"
              >
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-indigo-500 group-focus-within:scale-110" strokeWidth={1.8} />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 focus:scale-[1.02] focus:shadow-lg"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={handleRememberMeChange}
                  className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all duration-300 group-hover:scale-110"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  {t("rememberMe")}
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-all duration-300 hover:scale-105"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className={`w-full h-11 text-base font-medium relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none ${
                selectedRole === "owner"
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-500"
                  : "bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
              }`}
              disabled={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {selectedRole === "owner"
                  ? <Crown className="w-4 h-4" strokeWidth={2} />
                  : <UserCircle2 className="w-4 h-4" strokeWidth={2} />
                }
                {isLoading ? t("loggingIn") : t("loginButton")}
              </span>
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            {t("macfixSystem")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
