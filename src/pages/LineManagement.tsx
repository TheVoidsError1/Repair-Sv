import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import {
  CheckCircle2,
  MessageSquare,
  Send,
  Settings,
  Smartphone,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Copy,
  ExternalLink,
  Link,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LineStatus {
  connected: boolean;
  hasToken: boolean;
  message?: string;
  tokenPreview?: string | null;
  tokenLength?: number;
  isValidFormat?: boolean;
}

interface CustomerWithLine {
  id: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  lineId?: string;
  lineIdRes?: string;
}

const LineManagement = () => {
  const { t, language } = useLanguage();
  const [lineStatus, setLineStatus] = useState<LineStatus>({
    connected: false,
    hasToken: false,
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [customers, setCustomers] = useState<CustomerWithLine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [testUserId, setTestUserId] = useState("");
  const [testMessage, setTestMessage] = useState(
    language === "th"
      ? "🔔 ทดสอบระบบแจ้งเตือน\n\nหากคุณเห็นข้อความนี้ แสดงว่าระบบทำงานปกติ! ✅"
      : "🔔 Test Notification\n\nIf you see this message, the system is working correctly! ✅"
  );
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedLineUserId, setSelectedLineUserId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [allCustomers, setAllCustomers] = useState<CustomerWithLine[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // ตรวจสอบสถานะ LINE
  const checkLineStatus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getLineStatus();
      if (response.status === "success" && response.data) {
        setLineStatus(response.data);
      } else {
        setLineStatus({
          connected: false,
          hasToken: false,
          message: response.message || "Failed to check LINE status",
        });
      }
    } catch (error) {
      console.error("Error checking LINE status:", error);
      setLineStatus({
        connected: false,
        hasToken: false,
        message: "Error checking LINE status",
      });
    } finally {
      setLoading(false);
    }
  };

  // โหลดรายการลูกค้าที่มี LINE User ID
  const loadCustomers = async () => {
    try {
      const response = await apiClient.getCustomersWithLine();
      if (response.status === "success" && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error(
        language === "th"
          ? "ไม่สามารถโหลดข้อมูลลูกค้าได้"
          : "Failed to load customers"
      );
    }
  };

  // โหลดรายการลูกค้าทั้งหมด (สำหรับ Manual Linking)
  const loadAllCustomers = async () => {
    try {
      const response = await apiClient.getCustomers();
      if (response.status === "success" && response.data) {
        setAllCustomers(response.data);
      }
    } catch (error) {
      console.error("Error loading all customers:", error);
    }
  };

  // ทดสอบการส่งข้อความ
  const testSendMessage = async () => {
    const trimmedUserId = testUserId.trim();
    
    if (!trimmedUserId) {
      toast.error(
        language === "th"
          ? "กรุณากรอก LINE User ID"
          : "Please enter LINE User ID"
      );
      return;
    }

    // ตรวจสอบ format ของ User ID
    if (!trimmedUserId.startsWith("U")) {
      toast.error(
        language === "th"
          ? "❌ LINE User ID ต้องเริ่มต้นด้วยตัว 'U' เท่านั้น\n\nคุณใส่: " + trimmedUserId + "\n\n💡 หมายเหตุ: LINE ID (เช่น thenight1 หรือ @thenight1) ใช้ส่งข้อความไม่ได้\nต้องใช้ LINE User ID (เช่น U1234567890abcdef...)"
          : "❌ LINE User ID must start with 'U'\n\nYou entered: " + trimmedUserId + "\n\n💡 Note: LINE ID (like thenight1 or @thenight1) cannot be used\nYou need LINE User ID (like U1234567890abcdef...)",
        {
          duration: 8000,
        }
      );
      return;
    }

    if (trimmedUserId.length < 20) {
      toast.error(
        language === "th"
          ? "⚠️ LINE User ID ดูเหมือนจะสั้นเกินไป (น้อยกว่า 20 ตัวอักษร)\n\nLINE User ID ปกติจะยาวกว่า 30 ตัวอักษร"
          : "⚠️ LINE User ID seems too short (less than 20 characters)\n\nLINE User ID is usually longer than 30 characters",
        {
          duration: 6000,
        }
      );
      return;
    }

    if (!testMessage.trim()) {
      toast.error(
        language === "th"
          ? "กรุณากรอกข้อความ"
          : "Please enter message"
      );
      return;
    }

    setTesting(true);
    try {
      const response = await apiClient.testLineNotification(
        trimmedUserId,
        testMessage
      );
      if (response.status === "success") {
        toast.success(
          language === "th"
            ? "✅ ส่งข้อความสำเร็จ! ตรวจสอบ LINE ของคุณ"
            : "✅ Message sent successfully! Check your LINE",
          {
            duration: 5000,
          }
        );
      } else {
        // แสดง error message ที่ละเอียดขึ้น
        let errorMsg = response.message || (language === "th" ? "❌ ส่งข้อความไม่สำเร็จ" : "❌ Failed to send message");
        
        // เพิ่ม details ถ้ามี
        if (response.details) {
          errorMsg += "\n\n" + response.details;
        }
        
        // เพิ่ม possible reasons ถ้ามี
        if (response.possibleReasons && Array.isArray(response.possibleReasons)) {
          errorMsg += "\n\n" + (language === "th" ? "สาเหตุที่เป็นไปได้:" : "Possible reasons:") + "\n";
          response.possibleReasons.forEach((reason: string, index: number) => {
            errorMsg += `${index + 1}. ${reason}\n`;
          });
        }
        
        toast.error(errorMsg, {
          duration: 10000,
        });
      }
    } catch (error: any) {
      console.error("Error sending test message:", error);
      
      let errorMsg = language === "th"
        ? "❌ เกิดข้อผิดพลาดในการส่งข้อความ"
        : "❌ Error sending message";
      
      // ตรวจสอบ error response
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMsg += "\n\n" + errorData.message;
        }
        if (errorData.details) {
          errorMsg += "\n\n" + errorData.details;
        }
        if (errorData.possibleReasons && Array.isArray(errorData.possibleReasons)) {
          errorMsg += "\n\n" + (language === "th" ? "สาเหตุที่เป็นไปได้:" : "Possible reasons:") + "\n";
          errorData.possibleReasons.forEach((reason: string, index: number) => {
            errorMsg += `${index + 1}. ${reason}\n`;
          });
        }
      } else {
        errorMsg += "\n\n" + (language === "th"
          ? "กรุณาตรวจสอบ:\n1. LINE User ID ถูกต้อง\n2. Channel Access Token ตั้งค่าแล้ว\n3. User เป็นเพื่อนกับ LINE Official Account แล้ว"
          : "Please check:\n1. LINE User ID is correct\n2. Channel Access Token is configured\n3. User is a friend of LINE Official Account");
      }
      
      toast.error(errorMsg, {
        duration: 10000,
      });
    } finally {
      setTesting(false);
    }
  };

  // คัดลอก User ID
  const copyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success(
      language === "th"
        ? "คัดลอก LINE User ID แล้ว!"
        : "LINE User ID copied!",
      {
        duration: 3000,
      }
    );
  };

  // เชื่อมโยง LINE User ID กับลูกค้า
  const handleLinkCustomer = async () => {
    if (!selectedCustomerId || !selectedLineUserId) {
      toast.error(
        language === "th"
          ? "กรุณาเลือกลูกค้าและ LINE User ID"
          : "Please select customer and LINE User ID"
      );
      return;
    }

    setLinkingUserId(selectedLineUserId);
    try {
      const response = await apiClient.linkLineToCustomer(
        selectedCustomerId,
        selectedLineUserId
      );

      if (response.status === "success") {
        toast.success(
          language === "th"
            ? `✅ เชื่อมโยงสำเร็จ! ${response.data?.customerName || ""}`
            : `✅ Linked successfully! ${response.data?.customerName || ""}`,
          {
            duration: 5000,
          }
        );
        setShowLinkDialog(false);
        setSelectedCustomerId("");
        setSelectedLineUserId("");
        loadCustomers(); // Refresh customer list
      } else {
        toast.error(
          response.message ||
            (language === "th"
              ? "เชื่อมโยงไม่สำเร็จ"
              : "Failed to link"),
          {
            duration: 8000,
          }
        );
      }
    } catch (error: any) {
      console.error("Error linking customer:", error);
      toast.error(
        error?.message ||
          (language === "th"
            ? "เกิดข้อผิดพลาดในการเชื่อมโยง"
            : "Error linking customer"),
        {
          duration: 8000,
        }
      );
    } finally {
      setLinkingUserId(null);
    }
  };

  // เปิด Dialog สำหรับ Manual Linking
  const openLinkDialog = (lineUserId: string) => {
    setSelectedLineUserId(lineUserId);
    setShowLinkDialog(true);
    if (allCustomers.length === 0) {
      loadAllCustomers();
    }
  };

  useEffect(() => {
    checkLineStatus();
    loadCustomers();
  }, []);

  // กรองลูกค้าตามคำค้นหา
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    const name =
      customer.fullName ||
      `${customer.firstName} ${customer.lastName || ""}`.trim();
    return (
      name.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.lineIdRes?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">
              {language === "th" ? "จัดการ LINE Official Account" : "LINE Management"}
            </h1>
            <p className="page-description">
              {language === "th"
                ? "จัดการการแจ้งเตือนผ่าน LINE Official Account"
                : "Manage LINE Official Account notifications"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              checkLineStatus();
              loadCustomers();
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {language === "th" ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="status" className="gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "สถานะ" : "Status"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ทดสอบ" : "Test"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ลูกค้า" : "Customers"}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {language === "th"
                ? "สถานะการเชื่อมต่อ LINE"
                : "LINE Connection Status"}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    {lineStatus.hasToken ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {language === "th"
                          ? "Channel Access Token"
                          : "Channel Access Token"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lineStatus.hasToken
                          ? language === "th"
                            ? "ตั้งค่าแล้ว"
                            : "Configured"
                          : language === "th"
                          ? "ยังไม่ได้ตั้งค่า"
                          : "Not configured"}
                      </p>
                      {lineStatus.hasToken && lineStatus.tokenPreview && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Token:</span>{" "}
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">
                              {lineStatus.tokenPreview}
                            </code>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              {language === "th" ? "ความยาว:" : "Length:"}
                            </span>{" "}
                            {lineStatus.tokenLength}{" "}
                            {language === "th" ? "ตัวอักษร" : "characters"}
                            {lineStatus.isValidFormat === false && (
                              <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                                ⚠️ {language === "th"
                                  ? "Token อาจสั้นเกินไป"
                                  : "Token may be too short"}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {lineStatus.connected ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {language === "th"
                          ? "สถานะการเชื่อมต่อ"
                          : "Connection Status"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lineStatus.connected
                          ? language === "th"
                            ? "เชื่อมต่อสำเร็จ"
                            : "Connected"
                          : language === "th"
                          ? "ไม่สามารถเชื่อมต่อได้"
                          : "Not connected"}
                      </p>
                    </div>
                  </div>
                </div>

                {lineStatus.message && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      {lineStatus.message}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    <strong>
                      {language === "th" ? "วิธีตั้งค่า:" : "Setup Guide:"}
                    </strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-600 dark:text-blue-400">
                    <li>
                      {language === "th"
                        ? "ไปที่ LINE Developers Console"
                        : "Go to LINE Developers Console"}
                    </li>
                    <li>
                      {language === "th"
                        ? "สร้าง Messaging API channel"
                        : "Create Messaging API channel"}
                    </li>
                    <li>
                      {language === "th"
                        ? "คัดลอก Channel Access Token"
                        : "Copy Channel Access Token"}
                    </li>
                    <li>
                      {language === "th"
                        ? "เพิ่ม Token ในไฟล์ backend/.env"
                        : "Add Token to backend/.env file"}
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              {language === "th"
                ? "ทดสอบการส่งข้อความ"
                : "Test Message Sending"}
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  ❌ {language === "th" 
                    ? "ข้อมูลสำคัญ: LINE ID ≠ LINE User ID" 
                    : "Important: LINE ID ≠ LINE User ID"}
                </p>
                <div className="space-y-2 text-xs text-red-600 dark:text-red-400">
                  <div className="flex items-start gap-2">
                    <span className="font-bold">❌</span>
                    <div>
                      <span className="font-semibold">LINE ID (username)</span>
                      <div className="mt-1">
                        ตัวอย่าง: <code className="bg-red-500/20 px-1.5 py-0.5 rounded">thenight1</code> หรือ <code className="bg-red-500/20 px-1.5 py-0.5 rounded">@thenight1</code>
                      </div>
                      <div className="mt-1 font-semibold">→ ใช้ส่งข้อความไม่ได้ ❌</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-red-500/20">
                    <span className="font-bold">✅</span>
                    <div>
                      <span className="font-semibold">LINE User ID (ระบบภายใน)</span>
                      <div className="mt-1">
                        ตัวอย่าง: <code className="bg-green-500/20 px-1.5 py-0.5 rounded">U1234567890abcdef12345678901234567890...</code>
                      </div>
                      <div className="mt-1 font-semibold text-green-600 dark:text-green-400">→ ใช้ส่งข้อความได้ ✅</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="test-user-id">
                  {language === "th" ? "LINE User ID (ต้องขึ้นต้นด้วย U)" : "LINE User ID (must start with U)"}
                </Label>
                <Input
                  id="test-user-id"
                  placeholder={
                    language === "th"
                      ? "U1234567890abcdef... (ต้องเริ่มต้นด้วย U)"
                      : "U1234567890abcdef... (must start with U)"
                  }
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className={testUserId && !testUserId.startsWith("U") ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {testUserId && !testUserId.startsWith("U") && (
                  <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <span className="text-red-600 dark:text-red-400 text-xs">
                      ⚠️ คุณใส่ "<strong>{testUserId}</strong>" ซึ่งไม่ใช่ LINE User ID ที่ถูกต้อง!
                      <br />
                      LINE User ID ต้องขึ้นต้นด้วยตัว <strong>"U"</strong> เท่านั้น
                    </span>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    💡 {language === "th" ? "วิธีหา LINE User ID:" : "How to find LINE User ID:"}
                  </p>
                  <div className="space-y-3 text-xs text-blue-600 dark:text-blue-400">
                    <div>
                      <strong className="text-sm">วิธีที่ 1: ดูจาก URL (ง่ายที่สุด) ⭐</strong>
                      <ol className="list-decimal list-inside space-y-1 ml-2 mt-1">
                        <li>เปิด LINE Official Account Manager</li>
                        <li>ไปที่ <strong>Chat (แชท)</strong> → เปิดแชทกับผู้ใช้</li>
                        <li>ดูที่ <strong>Address Bar (แถบ URL)</strong> ด้านบน</li>
                        <li>LINE User ID จะอยู่หลัง <code className="bg-blue-500/20 px-1 py-0.5 rounded">/chat/</code></li>
                        <li>ตัวอย่าง: <code className="bg-blue-500/20 px-1 py-0.5 rounded">...chat/U7dde80c4e4a939b334ecfee27dea1653</code></li>
                        <li>คัดลอกส่วนที่ขึ้นต้นด้วย <strong>U</strong> (ยาวประมาณ 33 ตัวอักษร)</li>
                      </ol>
                    </div>
                    <div className="pt-2 border-t border-blue-500/20">
                      <strong className="text-sm">วิธีที่ 2: ดูจากหน้าแชท</strong>
                      <ol className="list-decimal list-inside space-y-1 ml-2 mt-1">
                        <li>เปิดแชทกับผู้ใช้ใน LINE Official Account Manager</li>
                        <li>คลิกที่ <strong>ชื่อผู้ใช้</strong> ด้านบน</li>
                        <li>จะเห็นข้อมูลผู้ใช้ → หา <strong>"User ID"</strong></li>
                        <li>คัดลอก User ID (เริ่มต้นด้วย U)</li>
                      </ol>
                    </div>
                    <div className="pt-2 border-t border-blue-500/20">
                      <strong className="text-sm">วิธีที่ 3: ดูจากฐานข้อมูล</strong>
                      <p className="ml-2 mt-1">
                        ดูได้ในแท็บ <strong>"ลูกค้า"</strong> ด้านล่าง
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="test-message">
                  {language === "th" ? "ข้อความทดสอบ" : "Test Message"}
                </Label>
                <textarea
                  id="test-message"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={
                    language === "th"
                      ? "กรอกข้อความที่ต้องการส่ง..."
                      : "Enter message to send..."
                  }
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>

              <Button
                onClick={testSendMessage}
                disabled={testing || !lineStatus.hasToken}
                className="gap-2"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {language === "th" ? "กำลังส่ง..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {language === "th" ? "ส่งข้อความทดสอบ" : "Send Test Message"}
                  </>
                )}
              </Button>

              {!lineStatus.hasToken && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {language === "th"
                      ? "⚠️ กรุณาตั้งค่า Channel Access Token ก่อนทดสอบ"
                      : "⚠️ Please configure Channel Access Token before testing"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {language === "th"
                  ? "ลูกค้าที่มี LINE User ID"
                  : "Customers with LINE User ID"}
              </h3>
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={
                    language === "th"
                      ? "ค้นหาชื่อ, เบอร์โทร, หรือ LINE User ID..."
                      : "Search name, phone, or LINE User ID..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "th"
                  ? "ไม่พบลูกค้าที่มี LINE User ID"
                  : "No customers with LINE User ID found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {language === "th" ? "ชื่อลูกค้า" : "Customer Name"}
                      </TableHead>
                      <TableHead>
                        {language === "th" ? "เบอร์โทร" : "Phone"}
                      </TableHead>
                      <TableHead>
                        {language === "th" ? "LINE ID" : "LINE ID"}
                      </TableHead>
                      <TableHead>
                        {language === "th" ? "LINE User ID" : "LINE User ID"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => {
                      const name =
                        customer.fullName ||
                        `${customer.firstName} ${customer.lastName || ""}`.trim();
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell>
                            {customer.lineId ? (
                              <span className="text-muted-foreground">
                                {customer.lineId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.lineIdRes ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {customer.lineIdRes.substring(0, 20)}...
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              {language === "th"
                ? `พบทั้งหมด ${filteredCustomers.length} รายการ`
                : `Total ${filteredCustomers.length} customers`}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: เชื่อมโยงลูกค้า */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "th"
                ? "เชื่อมโยง LINE User ID กับลูกค้า"
                : "Link LINE User ID to Customer"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "เลือกลูกค้าที่ต้องการเชื่อมโยงกับ LINE User ID นี้"
                : "Select customer to link with this LINE User ID"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* แสดง LINE User ID ที่เลือก */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <Label className="text-xs text-muted-foreground">LINE User ID:</Label>
              <code className="block mt-1 text-sm bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded font-mono break-all">
                {selectedLineUserId}
              </code>
            </div>

            {/* ค้นหาลูกค้า */}
            <div className="space-y-2">
              <Label>{language === "th" ? "ค้นหาลูกค้า" : "Search Customer"}</Label>
              <Input
                placeholder={
                  language === "th"
                    ? "ค้นหาชื่อ หรือ เบอร์โทร..."
                    : "Search name or phone..."
                }
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />
            </div>

            {/* รายการลูกค้า */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">
                    {language === "th" ? "กำลังโหลดข้อมูล..." : "Loading..."}
                  </p>
                </div>
              ) : (
                allCustomers
                  .filter((customer) => {
                    const searchLower = customerSearchTerm.toLowerCase();
                    const name =
                      customer.fullName ||
                      `${customer.firstName} ${customer.lastName || ""}`.trim();
                    return (
                      name.toLowerCase().includes(searchLower) ||
                      customer.phone?.includes(customerSearchTerm)
                    );
                  })
                  .map((customer) => {
                    const name =
                      customer.fullName ||
                      `${customer.firstName} ${customer.lastName || ""}`.trim();
                    const isSelected = selectedCustomerId === customer.id;
                    const hasLineId = !!customer.lineIdRes;

                    return (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-muted-foreground">
                              {customer.phone || language === "th" ? "ไม่มีเบอร์" : "No phone"}
                            </p>
                            {hasLineId && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                  {language === "th"
                                    ? "เชื่อมโยงกับ LINE แล้ว"
                                    : "Already linked"}
                                </span>
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkDialog(false);
                setSelectedCustomerId("");
                setSelectedLineUserId("");
              }}
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              onClick={handleLinkCustomer}
              disabled={!selectedCustomerId || linkingUserId !== null}
              className="gap-2"
            >
              {linkingUserId ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === "th" ? "กำลังเชื่อมโยง..." : "Linking..."}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {language === "th" ? "เชื่อมโยง" : "Link"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default LineManagement;
