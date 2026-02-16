import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, ArrowLeft, Smartphone, CheckCircle2, Lock } from "lucide-react";
import { type FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // เพิ่ม CSS animations เมื่อ component mount
  useEffect(() => {
    if (document.getElementById('forgot-password-animations')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'forgot-password-animations';
    style.textContent = `
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
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

      @keyframes scale-in {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .animate-fade-in {
        animation: fade-in 0.6s ease-out;
      }

      .animate-slide-in-up {
        animation: slide-in-up 0.6s ease-out;
      }

      .animate-scale-in {
        animation: scale-in 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleElement = document.getElementById('forgot-password-animations');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const handleCheckEmail = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.checkEmailExists(email);

      if (response.status === 'success' && response.data?.exists) {
        setEmailVerified(true);
        toast({
          title: t("emailFound"),
          description: t("enterNewPassword"),
        });
      } else {
        toast({
          title: t("emailNotFound"),
          description: t("emailNotRegistered"),
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

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t("passwordsDontMatch"),
        description: t("passwordsMustMatch"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: t("passwordTooShort"),
        description: t("passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.resetPasswordByEmail(email, newPassword);

      if (response.status === 'success') {
        toast({
          title: t("passwordResetSuccessful"),
          description: t("passwordResetDescription"),
        });
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        toast({
          title: t("error"),
          description: response.message || t("unableToResetPassword"),
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
      {/* ซ้าย - ส่วน Branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/90 p-12 xl:p-16">
        {/* ลายพื้นหลังเบา ๆ */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl" />

        <div className="relative">
          <Link to="/login" className="flex items-center gap-3 animate-slide-in-up group">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg hover:bg-white/15 hover:scale-110 transition-all duration-300 cursor-pointer">
              <Smartphone className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.8} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Macfix service</span>
          </Link>
        </div>

        <div className="relative space-y-6 animate-slide-in-up">
          <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight tracking-tight">
            {t("forgotPasswordTitle")}
          </h2>
          <p className="text-white/75 text-base xl:text-lg max-w-md leading-relaxed">
            {t("forgotPasswordDescription")}
          </p>
        </div>

        <p className="relative text-white/40 text-sm">
          © {new Date().getFullYear()} Macfix service. {t("repairShopManagement")}
        </p>
      </div>

      {/* ขวา - ฟอร์ม Forgot Password */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white min-h-screen animate-slide-in-up">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo สำหรับ Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <Link to="/login" className="flex flex-col items-center group">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 shadow-lg mb-3 hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <Smartphone className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.8} />
              </div>
              <span className="text-lg font-semibold text-slate-800 tracking-tight">Macfix service</span>
            </Link>
          </div>

          {!emailVerified ? (
            <>
              <div className="text-center lg:text-left animate-fade-in">
                <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                  {t("forgotPasswordTitle")}
                </h1>
                <p className="mt-2 text-slate-500 text-sm">
                  {t("forgotPasswordSubtitle")}
                </p>
              </div>

              <form onSubmit={handleCheckEmail} className="space-y-5 animate-fade-in">
                <div className="space-y-2 group">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-indigo-600"
                  >
                    {t("email")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-indigo-500 group-focus-within:scale-110" strokeWidth={1.8} />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("enterEmail")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 focus:scale-[1.02] focus:shadow-lg"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
                  disabled={isLoading}
                >
                  <span className="relative z-10">
                    {isLoading ? t("checking") : t("verifyEmail")}
                  </span>
                  {!isLoading && (
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Button>
              </form>

              <div className="text-center animate-fade-in">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("backToLogin")}
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-scale-in">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100">
                    <CheckCircle2 className="w-10 h-10 text-indigo-600" strokeWidth={1.5} />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">
                  {t("emailVerified")}
                </h2>
                <p className="mt-2 text-slate-600 text-sm">
                  {email} {t("emailInSystem")}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2 group">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-indigo-600"
                  >
                    {t("newPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-indigo-500 group-focus-within:scale-110" strokeWidth={1.8} />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={t("enterNewPasswordPlaceholder")}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 focus:scale-[1.02] focus:shadow-lg"
                      required
                      disabled={isLoading}
                      minLength={4}
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-indigo-600"
                  >
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-indigo-500 group-focus-within:scale-110" strokeWidth={1.8} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t("confirmNewPassword")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 focus:scale-[1.02] focus:shadow-lg"
                      required
                      disabled={isLoading}
                      minLength={4}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
                  disabled={isLoading}
                >
                  <span className="relative z-10">
                    {isLoading ? t("resettingPassword") : t("resetPassword")}
                  </span>
                  {!isLoading && (
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setEmailVerified(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {t("changeEmail")}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-400">
            {t("macfixSystem")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
