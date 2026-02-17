import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

/**
 * LINE Rich Menu Service
 * จัดการ Rich Menu ของ LINE Official Account
 */

interface LineRichMenuConfig {
  channelAccessToken: string;
}

export interface RichMenuArea {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: RichMenuAction;
}

export interface RichMenuAction {
  type: 'postback' | 'message' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
  label?: string;
  data?: string;
  text?: string;
  uri?: string;
  displayText?: string;
  inputOption?: 'closeRichMenu' | 'openRichMenu' | 'openKeyboard' | 'openVoice';
  fillInText?: string;
  mode?: 'date' | 'time' | 'datetime';
  initial?: string;
  max?: string;
  min?: string;
}

export interface RichMenuSize {
  width: number;
  height: number;
}

export interface RichMenu {
  size: RichMenuSize;
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

export interface RichMenuResponse {
  richMenuId: string;
}

export interface RichMenuListResponse {
  richmenus: Array<{
    richMenuId: string;
    size: RichMenuSize;
    selected: boolean;
    name: string;
    chatBarText: string;
    areas: RichMenuArea[];
  }>;
}

export class LineRichMenuService {
  private channelAccessToken: string;
  private baseUrl = 'https://api.line.me/v2/bot';

  constructor(config: LineRichMenuConfig) {
    this.channelAccessToken = config.channelAccessToken;
  }

  /**
   * สร้าง Rich Menu ใหม่
   */
  async createRichMenu(richMenu: RichMenu): Promise<string> {
    try {
      const response = await axios.post<RichMenuResponse>(
        `${this.baseUrl}/richmenu`,
        richMenu,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200 && response.data.richMenuId) {
        console.log(`[LINE Rich Menu] Created rich menu: ${response.data.richMenuId}`);
        return response.data.richMenuId;
      }

      throw new Error('Failed to create rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error creating rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to create rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * อัพโหลดรูปภาพ Rich Menu
   */
  async uploadRichMenuImage(richMenuId: string, imagePath: string): Promise<boolean> {
    try {
      // อ่านไฟล์รูปภาพ
      const imageBuffer = fs.readFileSync(imagePath);
      const imageExt = path.extname(imagePath).toLowerCase();

      // ตรวจสอบประเภทไฟล์
      let contentType = 'image/png';
      if (imageExt === '.jpg' || imageExt === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (imageExt !== '.png') {
        throw new Error('Rich menu image must be PNG or JPEG format');
      }

      // สร้าง FormData
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: path.basename(imagePath),
        contentType,
      });

      const response = await axios.post(
        `${this.baseUrl}/richmenu/${richMenuId}/content`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Uploaded image for rich menu: ${richMenuId}`);
        return true;
      }

      throw new Error('Failed to upload rich menu image');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error uploading image:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to upload rich menu image: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * อัพโหลดรูปภาพ Rich Menu จาก Buffer
   */
  async uploadRichMenuImageFromBuffer(
    richMenuId: string,
    imageBuffer: Buffer,
    contentType: string = 'image/png'
  ): Promise<boolean> {
    try {
      // สร้าง FormData
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: 'richmenu.png',
        contentType,
      });

      const response = await axios.post(
        `${this.baseUrl}/richmenu/${richMenuId}/content`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Uploaded image for rich menu: ${richMenuId}`);
        return true;
      }

      throw new Error('Failed to upload rich menu image');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error uploading image:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to upload rich menu image: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ดึงรายการ Rich Menu ทั้งหมด
   */
  async getRichMenuList(): Promise<RichMenuListResponse> {
    try {
      const response = await axios.get<RichMenuListResponse>(
        `${this.baseUrl}/richmenu/list`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Retrieved ${response.data.richmenus.length} rich menus`);
        return response.data;
      }

      throw new Error('Failed to get rich menu list');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error getting rich menu list:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to get rich menu list: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Rich Menu ตาม ID
   */
  async getRichMenu(richMenuId: string): Promise<RichMenu> {
    try {
      const response = await axios.get<RichMenu>(
        `${this.baseUrl}/richmenu/${richMenuId}`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Retrieved rich menu: ${richMenuId}`);
        return response.data;
      }

      throw new Error('Failed to get rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error getting rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to get rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ดาวน์โหลดรูปภาพ Rich Menu
   */
  async downloadRichMenuImage(richMenuId: string): Promise<Buffer> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/richmenu/${richMenuId}/content`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
          responseType: 'arraybuffer',
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Downloaded image for rich menu: ${richMenuId}`);
        return Buffer.from(response.data);
      }

      throw new Error('Failed to download rich menu image');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error downloading image:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to download rich menu image: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ตั้งค่า Rich Menu เป็น default สำหรับผู้ใช้ทั้งหมด
   */
  async setDefaultRichMenu(richMenuId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/user/all/richmenu/${richMenuId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Set default rich menu: ${richMenuId}`);
        return true;
      }

      throw new Error('Failed to set default rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error setting default rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to set default rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ตั้งค่า Rich Menu สำหรับผู้ใช้เฉพาะ
   */
  async setUserRichMenu(userId: string, richMenuId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/user/${userId}/richmenu/${richMenuId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Set rich menu for user ${userId}: ${richMenuId}`);
        return true;
      }

      throw new Error('Failed to set user rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error setting user rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to set user rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ดึง Rich Menu ID ที่ตั้งไว้สำหรับผู้ใช้
   */
  async getUserRichMenu(userId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/${userId}/richmenu`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200 && response.data.richMenuId) {
        return response.data.richMenuId;
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          // ไม่มี Rich Menu สำหรับผู้ใช้นี้
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * ลบ Rich Menu
   */
  async deleteRichMenu(richMenuId: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/richmenu/${richMenuId}`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Deleted rich menu: ${richMenuId}`);
        return true;
      }

      throw new Error('Failed to delete rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error deleting rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to delete rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ลบ Rich Menu default
   */
  async cancelDefaultRichMenu(): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/user/all/richmenu`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log('[LINE Rich Menu] Cancelled default rich menu');
        return true;
      }

      throw new Error('Failed to cancel default rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error cancelling default rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to cancel default rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ลบ Rich Menu สำหรับผู้ใช้เฉพาะ
   */
  async cancelUserRichMenu(userId: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/user/${userId}/richmenu`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`[LINE Rich Menu] Cancelled rich menu for user: ${userId}`);
        return true;
      }

      throw new Error('Failed to cancel user rich menu');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;

        console.error('[LINE Rich Menu] Error cancelling user rich menu:', {
          status,
          data,
          message: errorMessage,
        });

        throw new Error(`Failed to cancel user rich menu: ${errorMessage}`);
      }
      throw error;
    }
  }
}

// Singleton instance
let richMenuService: LineRichMenuService | null = null;
let lastToken: string | null = null;

/**
 * สร้างหรือดึง instance ของ LINE Rich Menu Service
 */
export function getLineRichMenuService(): LineRichMenuService | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.warn('[LINE Rich Menu] LINE_CHANNEL_ACCESS_TOKEN not configured, Rich Menu service disabled');
    richMenuService = null;
    lastToken = null;
    return null;
  }

  // ถ้า Token เปลี่ยน หรือยังไม่มี service instance ให้สร้างใหม่
  if (!richMenuService || lastToken !== channelAccessToken) {
    richMenuService = new LineRichMenuService({ channelAccessToken });
    lastToken = channelAccessToken;
    console.log('[LINE Rich Menu] Rich Menu Service initialized');
  }

  return richMenuService;
}
