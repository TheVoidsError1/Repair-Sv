import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Smartphone, Mail, Lock, Wrench } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: เพิ่ม logic authentication จริง
    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* ซ้าย - ส่วน Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,15%)] to-[hsl(217,91%,60%)]/20 p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Macfix service</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            {language === "th"
              ? "ระบบจัดการร้านซ่อมมือถือ"
              : "Mobile Repair Shop Management"}
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            {language === "th"
              ? "จัดการงานซ่อม สินค้าคงคลัง การเงิน และการรับประกัน ในที่เดียว"
              : "Manage repairs, inventory, finance, and warranty all in one place"}
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 text-white/70">
              <Wrench className="w-5 h-5 text-primary" />
              <span className="text-sm">
                {language === "th" ? "ติดตามงานซ่อม" : "Track repairs"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="text-sm">
                {language === "th" ? "จัดการสต็อก" : "Manage stock"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} Macfix service.{" "}
          {language === "th" ? "ระบบจัดการร้านซ่อม" : "Repair shop management"}
        </p>
      </div>

      {/* ขวา - ฟอร์ม Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo สำหรับ Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-3">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Macfix service
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("loginSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {t("rememberMe")}
                </span>
              </label>
              <Link
                to="#"
                className="text-sm text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
            >
              {t("loginButton")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
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
