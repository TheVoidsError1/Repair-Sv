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
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RichMenu {
  richMenuId: string;
  size: { width: number; height: number };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: any;
  }>;
}

const RichMenu = () => {
  const { language } = useLanguage();
  const [richMenus, setRichMenus] = useState<RichMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedRichMenu, setSelectedRichMenu] = useState<RichMenu | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    chatBarText: "เมนู",
    menuBarText: "เมนู",
    useCustomText: false,
    customText: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // โหลดรายการ Rich Menu
  const loadRichMenus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getRichMenuList();
      if (response.status === "success" && response.data) {
        setRichMenus(response.data);
      } else {
        toast.error(
          language === "th"
            ? "ไม่สามารถโหลดรายการ Rich Menu ได้"
            : "Failed to load rich menus"
        );
      }
    } catch (error) {
      console.error("Error loading rich menus:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการโหลดข้อมูล"
          : "Error loading data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRichMenus();
  }, []);

  // สร้าง Rich Menu
  const handleCreateRichMenu = async () => {
    if (!formData.name.trim()) {
      toast.error(
        language === "th" ? "กรุณากรอกชื่อ Rich Menu" : "Please enter rich menu name"
      );
      return;
    }

    if (!selectedFile) {
      toast.error(
        language === "th" ? "กรุณาเลือกรูปภาพ" : "Please select an image"
      );
      return;
    }

    setUploading(true);
    try {
      // สร้าง Rich Menu structure
      // Rich Menu size: 2500x1686 (full) หรือ 2500x843 (half)
      const richMenuData = {
        size: {
          width: 2500,
          height: 1686, // Full size
        },
        selected: false,
        name: formData.name,
        chatBarText: formData.useCustomText ? formData.customText : formData.menuBarText,
        areas: [
          // ตัวอย่าง: 3 ปุ่มในแถวล่าง
          {
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: {
              type: "postback",
              label: "เช็คสถานะงานซ่อม",
              data: "action=check_status",
            },
          },
          {
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: {
              type: "postback",
              label: "ติดต่อเรา",
              data: "action=contact",
            },
          },
          {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: {
              type: "postback",
              label: "ประวัติการซ่อม",
              data: "action=history",
            },
          },
        ],
      };

      const createResponse = await apiClient.createRichMenu(richMenuData);
      if (createResponse.status === "success" && createResponse.data) {
        const richMenuId = createResponse.data.richMenuId;

        // อัพโหลดรูปภาพ
        const uploadResponse = await apiClient.uploadRichMenuImage(richMenuId, selectedFile);
        if (uploadResponse.status === "success") {
          toast.success(
            language === "th"
              ? "สร้าง Rich Menu สำเร็จ"
              : "Rich menu created successfully"
          );
          setShowCreateDialog(false);
          setFormData({
            name: "",
            chatBarText: "เมนู",
            menuBarText: "เมนู",
            useCustomText: false,
            customText: "",
          });
          setSelectedFile(null);
          setPreviewImage(null);
          loadRichMenus();
        } else {
          toast.error(
            language === "th"
              ? "อัพโหลดรูปภาพไม่สำเร็จ"
              : "Failed to upload image"
          );
        }
      } else {
        toast.error(
          language === "th"
            ? "สร้าง Rich Menu ไม่สำเร็จ"
            : "Failed to create rich menu"
        );
      }
    } catch (error) {
      console.error("Error creating rich menu:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการสร้าง Rich Menu"
          : "Error creating rich menu"
      );
    } finally {
      setUploading(false);
    }
  };

  // ตั้งค่า Rich Menu เป็น default
  const handleSetDefault = async (richMenuId: string) => {
    setSettingDefault(richMenuId);
    try {
      const response = await apiClient.setDefaultRichMenu(richMenuId);
      if (response.status === "success") {
        toast.success(
          language === "th"
            ? "ตั้งค่า Rich Menu เป็น default สำเร็จ"
            : "Set default rich menu successfully"
        );
        loadRichMenus();
      } else {
        toast.error(
          language === "th"
            ? "ตั้งค่า Rich Menu ไม่สำเร็จ"
            : "Failed to set default rich menu"
        );
      }
    } catch (error) {
      console.error("Error setting default rich menu:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการตั้งค่า"
          : "Error setting default rich menu"
      );
    } finally {
      setSettingDefault(null);
    }
  };

  // ลบ Rich Menu
  const handleDelete = async (richMenuId: string) => {
    if (
      !confirm(
        language === "th"
          ? "คุณแน่ใจหรือไม่ว่าต้องการลบ Rich Menu นี้?"
          : "Are you sure you want to delete this rich menu?"
      )
    ) {
      return;
    }

    setDeleting(richMenuId);
    try {
      const response = await apiClient.deleteRichMenu(richMenuId);
      if (response.status === "success") {
        toast.success(
          language === "th" ? "ลบ Rich Menu สำเร็จ" : "Rich menu deleted successfully"
        );
        loadRichMenus();
      } else {
        toast.error(
          language === "th"
            ? "ลบ Rich Menu ไม่สำเร็จ"
            : "Failed to delete rich menu"
        );
      }
    } catch (error) {
      console.error("Error deleting rich menu:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการลบ"
          : "Error deleting rich menu"
      );
    } finally {
      setDeleting(null);
    }
  };

  // ดาวน์โหลดรูปภาพ Rich Menu
  const handleDownloadImage = async (richMenuId: string) => {
    try {
      const blob = await apiClient.downloadRichMenuImage(richMenuId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `richmenu-${richMenuId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(
        language === "th" ? "ดาวน์โหลดสำเร็จ" : "Download successful"
      );
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการดาวน์โหลด"
          : "Error downloading image"
      );
    }
  };

  // จัดการไฟล์ที่เลือก
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith("image/")) {
        toast.error(
          language === "th"
            ? "กรุณาเลือกรูปภาพเท่านั้น"
            : "Please select an image file"
        );
        return;
      }

      // ตรวจสอบขนาดไฟล์ (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          language === "th"
            ? "ขนาดไฟล์ต้องไม่เกิน 10MB"
            : "File size must not exceed 10MB"
        );
        return;
      }

      setSelectedFile(file);

      // สร้าง preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ดูรูปภาพ Rich Menu
  const handleViewImage = async (richMenuId: string) => {
    try {
      const blob = await apiClient.downloadRichMenuImage(richMenuId);
      const url = window.URL.createObjectURL(blob);
      setPreviewImage(url);
      setSelectedRichMenu(richMenus.find((rm) => rm.richMenuId === richMenuId) || null);
      setShowImageDialog(true);
    } catch (error) {
      console.error("Error viewing image:", error);
      toast.error(
        language === "th"
          ? "ไม่สามารถดูรูปภาพได้"
          : "Cannot view image"
      );
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">
              {language === "th" ? "จัดการ Rich Menu" : "Rich Menu Management"}
            </h1>
            <p className="page-description">
              {language === "th"
                ? "จัดการ Rich Menu ของ LINE Official Account"
                : "Manage LINE Official Account Rich Menus"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadRichMenus}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {language === "th" ? "รีเฟรช" : "Refresh"}
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {language === "th" ? "สร้าง Rich Menu" : "Create Rich Menu"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : richMenus.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {language === "th"
                ? "ยังไม่มี Rich Menu"
                : "No Rich Menus yet"}
            </p>
            <p className="text-sm">
              {language === "th"
                ? "คลิกปุ่ม 'สร้าง Rich Menu' เพื่อเริ่มต้น"
                : "Click 'Create Rich Menu' to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {language === "th" ? "ชื่อ" : "Name"}
                  </TableHead>
                  <TableHead>
                    {language === "th" ? "ข้อความบนเมนูบาร์" : "Menu Bar Text"}
                  </TableHead>
                  <TableHead>
                    {language === "th" ? "สถานะ" : "Status"}
                  </TableHead>
                  <TableHead>
                    {language === "th" ? "จำนวนปุ่ม" : "Buttons"}
                  </TableHead>
                  <TableHead className="text-right">
                    {language === "th" ? "การจัดการ" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {richMenus.map((richMenu) => (
                  <TableRow key={richMenu.richMenuId}>
                    <TableCell className="font-medium">
                      {richMenu.name}
                    </TableCell>
                    <TableCell>{richMenu.chatBarText}</TableCell>
                    <TableCell>
                      {richMenu.selected ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          {language === "th" ? "Default" : "Default"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {language === "th" ? "ไม่ใช่ Default" : "Not Default"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{richMenu.areas.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewImage(richMenu.richMenuId)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadImage(richMenu.richMenuId)}
                          className="gap-1"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!richMenu.selected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(richMenu.richMenuId)}
                            disabled={settingDefault === richMenu.richMenuId}
                            className="gap-1"
                          >
                            {settingDefault === richMenu.richMenuId ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Settings className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(richMenu.richMenuId)}
                          disabled={deleting === richMenu.richMenuId}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          {deleting === richMenu.richMenuId ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog: สร้าง Rich Menu */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "สร้าง Rich Menu" : "Create Rich Menu"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "สร้าง Rich Menu ใหม่สำหรับ LINE Official Account"
                : "Create a new Rich Menu for LINE Official Account"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                {language === "th" ? "ชื่อ Rich Menu" : "Rich Menu Name"} *
              </Label>
              <Input
                placeholder={
                  language === "th"
                    ? "เช่น MacFix Service Rich Menu"
                    : "e.g., MacFix Service Rich Menu"
                }
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                {language === "th"
                  ? "ข้อความบนเมนูบาร์"
                  : "Menu Bar Text"}
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="menu-default"
                    name="menuBarText"
                    checked={!formData.useCustomText}
                    onChange={() =>
                      setFormData({ ...formData, useCustomText: false })
                    }
                  />
                  <Label htmlFor="menu-default" className="font-normal cursor-pointer">
                    {language === "th" ? "เมนู" : "Menu"}
                  </Label>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="radio"
                    id="menu-custom"
                    name="menuBarText"
                    checked={formData.useCustomText}
                    onChange={() =>
                      setFormData({ ...formData, useCustomText: true })
                    }
                  />
                  <Label htmlFor="menu-custom" className="font-normal cursor-pointer">
                    {language === "th" ? "ข้อความอื่นๆ" : "Other Text"}
                  </Label>
                  {formData.useCustomText && (
                    <Input
                      placeholder={
                        language === "th"
                          ? "ใส่ข้อความ (สูงสุด 14 ตัวอักษร)"
                          : "Enter text (max 14 characters)"
                      }
                      value={formData.customText}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customText: e.target.value.substring(0, 14),
                        })
                      }
                      maxLength={14}
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              {formData.useCustomText && (
                <p className="text-xs text-muted-foreground">
                  {formData.customText.length}/14
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {language === "th" ? "รูปภาพ Rich Menu" : "Rich Menu Image"} *
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <input
                  type="file"
                  id="richmenu-image"
                  accept="image/png,image/jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label
                  htmlFor="richmenu-image"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {language === "th"
                      ? "คลิกเพื่อเลือกรูปภาพ (PNG หรือ JPEG, สูงสุด 10MB)"
                      : "Click to select image (PNG or JPEG, max 10MB)"}
                  </span>
                </Label>
              </div>
              {previewImage && (
                <div className="mt-4">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg border border-border"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>💡 {language === "th" ? "คำแนะนำ:" : "Tips:"}</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-600 dark:text-blue-400 mt-2">
                <li>
                  {language === "th"
                    ? "ขนาดรูปภาพที่แนะนำ: 2500x1686 pixels (Full) หรือ 2500x843 pixels (Half)"
                    : "Recommended image size: 2500x1686 pixels (Full) or 2500x843 pixels (Half)"}
                </li>
                <li>
                  {language === "th"
                    ? "รูปแบบไฟล์: PNG หรือ JPEG"
                    : "File format: PNG or JPEG"}
                </li>
                <li>
                  {language === "th"
                    ? "ขนาดไฟล์: ไม่เกิน 10MB"
                    : "File size: Maximum 10MB"}
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setFormData({
                  name: "",
                  chatBarText: "เมนู",
                  menuBarText: "เมนู",
                  useCustomText: false,
                  customText: "",
                });
                setSelectedFile(null);
                setPreviewImage(null);
              }}
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              onClick={handleCreateRichMenu}
              disabled={uploading || !formData.name.trim() || !selectedFile}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === "th" ? "กำลังสร้าง..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {language === "th" ? "สร้าง" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: ดูรูปภาพ */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {language === "th"
                ? `รูปภาพ Rich Menu: ${selectedRichMenu?.name || ""}`
                : `Rich Menu Image: ${selectedRichMenu?.name || ""}`}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {previewImage && (
              <img
                src={previewImage}
                alt="Rich Menu"
                className="max-w-full h-auto rounded-lg border border-border"
              />
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowImageDialog(false)}>
              {language === "th" ? "ปิด" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default RichMenu;
