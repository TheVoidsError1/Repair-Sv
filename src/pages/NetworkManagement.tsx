import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Network,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NetworkManagement = () => {
  const { language } = useLanguage();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // เปิด ngrok Web Interface
  const openNgrokInterface = () => {
    window.open("http://127.0.0.1:4040", "_blank");
  };

  // คัดลอก Webhook URL
  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success(
      language === "th"
        ? "คัดลอก Webhook URL แล้ว!"
        : "Webhook URL copied!"
    );
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === "th" ? "Network" : "Network"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "th"
              ? "จัดการ Network และ ngrok สำหรับการพัฒนา"
              : "Manage Network and ngrok for development"}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Network className="w-5 h-5" />
            {language === "th"
              ? "🔧 Development (ทดสอบ) - ใช้ ngrok"
              : "🔧 Development (Testing) - Use ngrok"}
          </h3>

          <div className="space-y-6">
            {/* คำแนะนำ */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                    {language === "th"
                      ? "localhost ใช้ไม่ได้! LINE ต้องการ public URL"
                      : "localhost won't work! LINE requires a public URL"}
                  </p>
                  <p>
                    {language === "th"
                      ? "ใช้ ngrok เพื่อเปิด localhost ให้ LINE เข้าถึงได้"
                      : "Use ngrok to expose localhost to LINE"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold">
                  {language === "th" ? "ขั้นตอน:" : "Steps:"}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground ml-2">
                  <li>
                    {language === "th" ? "ติดตั้ง ngrok จาก" : "Install ngrok from"}{" "}
                    <a
                      href="https://ngrok.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      ngrok.com
                    </a>
                  </li>
                  <li>
                    {language === "th" ? "รัน backend server:" : "Run backend server:"}{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      npm run dev
                    </code>
                  </li>
                  <li>
                    {language === "th" ? "รัน ngrok:" : "Run ngrok:"}{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      ngrok http 3001
                    </code>
                  </li>
                  <li>
                    {language === "th"
                      ? "คัดลอก URL ที่ได้ (เช่น"
                      : "Copy the URL (e.g."}{" "}
                    <span className="font-mono">https://abc123.ngrok-free.app</span>
                    {language === "th" ? ")" : ")"}
                  </li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openNgrokInterface}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {language === "th" ? "เปิด ngrok Web UI" : "Open ngrok Web UI"}
                </Button>
              </div>
            </div>

            {/* Input ngrok URL */}
            <div className="space-y-2">
              <Label htmlFor="ngrok-url" className="text-sm">
                {language === "th"
                  ? "ngrok URL (ใส่ URL ที่ได้จาก ngrok)"
                  : "ngrok URL (Paste URL from ngrok)"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ngrok-url"
                  placeholder="https://abc123.ngrok-free.app"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (webhookUrl) {
                      copyWebhookUrl(`${webhookUrl}/api/line/webhook`);
                    } else {
                      toast.error(
                        language === "th"
                          ? "กรุณาใส่ ngrok URL ก่อน"
                          : "Please enter ngrok URL first"
                      );
                    }
                  }}
                  disabled={!webhookUrl}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Webhook URL ที่ใช้ */}
            {webhookUrl && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                  ✅ {language === "th" ? "Webhook URL ที่ใช้:" : "Webhook URL to use:"}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-green-500/20 px-2 py-1 rounded flex-1 break-all">
                    {webhookUrl}/api/line/webhook
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyWebhookUrl(`${webhookUrl}/api/line/webhook`)}
                    className="flex-shrink-0"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* คำแนะนำเพิ่มเติม */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                💡 {language === "th" ? "คำแนะนำ:" : "Tips:"}
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>
                  {language === "th"
                    ? "ngrok URL จะเปลี่ยนทุกครั้งที่รัน ngrok ใหม่"
                    : "ngrok URL will change every time you restart ngrok"}
                </li>
                <li>
                  {language === "th"
                    ? "ใช้ ngrok Web UI เพื่อดู URL ปัจจุบัน"
                    : "Use ngrok Web UI to see the current URL"}
                </li>
                <li>
                  {language === "th"
                    ? "คัดลอก Webhook URL ไปตั้งค่าใน LINE Developers Console"
                    : "Copy Webhook URL to configure in LINE Developers Console"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NetworkManagement;
