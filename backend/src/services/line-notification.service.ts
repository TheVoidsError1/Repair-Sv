import axios from 'axios';

/**
 * LINE Messaging Service
 * ส่งการแจ้งเตือนให้ลูกค้าผ่าน LINE Official Account
 */

interface LineNotificationConfig {
  channelAccessToken: string;
}

// เก็บเทมเพลตข้อความสถานะที่กำหนดเอง
interface StatusTemplate {
  status: string;
  template: string;
  description: string;
}

// เทมเพลตข้อความเริ่มต้น
const DEFAULT_STATUS_TEMPLATES: Record<string, StatusTemplate> = {
  'pending': {
    status: 'pending',
    template: `🔔 แจ้งเตือน: งานซ่อมของคุณกำลังรอดำเนินการ

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: รอดำเนินการ

เราได้รับงานซ่อมของคุณเรียบร้อยแล้ว และจะเริ่มดำเนินการในไม่ช้า`,
    description: 'ข้อความเมื่อสถานะเป็นรอดำเนินการ',
  },
  'in-progress': {
    status: 'in-progress',
    template: `🔧 แจ้งเตือน: เริ่มซ่อมแล้ว!

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: กำลังซ่อม

ช่างของเรากำลังดำเนินการซ่อมอุปกรณ์ของคุณอยู่
{additionalInfo}`,
    description: 'ข้อความเมื่อสถานะเป็นกำลังซ่อม',
  },
  'waiting_parts': {
    status: 'waiting_parts',
    template: `⏳ แจ้งเตือน: รออะไหล่

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: รออะไหล่

งานซ่อมของคุณอยู่ระหว่างรออะไหล่ เราจะแจ้งให้ทราบเมื่อได้รับอะไหล่แล้ว`,
    description: 'ข้อความเมื่อสถานะเป็นรออะไหล่',
  },
  'completed': {
    status: 'completed',
    template: `✅ แจ้งเตือน: ซ่อมเสร็จแล้ว!

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: ซ่อมเสร็จแล้ว ✨

อุปกรณ์ของคุณซ่อมเสร็จเรียบร้อยแล้ว พร้อมรับได้ตลอดเวลา!
{additionalInfo}`,
    description: 'ข้อความเมื่อสถานะเป็นซ่อมเสร็จแล้ว',
  },
  'cancelled': {
    status: 'cancelled',
    template: `❌ แจ้งเตือน: ยกเลิกงานซ่อม

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: ยกเลิกแล้ว

{additionalInfo}หากมีข้อสงสัย กรุณาติดต่อเรา`,
    description: 'ข้อความเมื่อสถานะเป็นยกเลิกแล้ว',
  },
  'picked-up': {
    status: 'picked-up',
    template: `📦 แจ้งเตือน: รับเครื่องแล้ว

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: รับเครื่องแล้ว

ขอบคุณที่ใช้บริการของเรา 🙏
หากมีปัญหาใด ๆ กรุณาติดต่อเราได้ทันที`,
    description: 'ข้อความเมื่อสถานะเป็นรับเครื่องแล้ว',
  },
};

// เก็บเทมเพลตที่ผู้ใช้กำหนดเอง (in-memory)
let customStatusTemplates: Record<string, string> = {};

interface NotificationMessage {
  to: string; // LINE User ID ของลูกค้า
  messages: Array<{
    type: 'text';
    text: string;
  }>;
}

export class LineNotificationService {
  private channelAccessToken: string;
  private apiUrl = 'https://api.line.me/v2/bot/message/push';

  constructor(config: LineNotificationConfig) {
    this.channelAccessToken = config.channelAccessToken;
  }

  /**
   * ส่งข้อความแจ้งเตือนไปยังลูกค้า
   */
  async sendNotification(userId: string, message: string): Promise<boolean> {
    if (!userId || !this.channelAccessToken) {
      console.warn('[LINE] Cannot send notification: Missing userId or access token');
      return false;
    }

    try {
      const payload: NotificationMessage = {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
      });

      if (response.status === 200) {
        console.log(`[LINE] Notification sent successfully to ${userId}`);
        return true;
      } else {
        console.error(`[LINE] Failed to send notification: ${response.status}`, response.data);
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage = data?.message || error.message;
        const details = data?.details || data;
        
        console.error('[LINE] Error sending notification:', {
          status,
          data,
          message: errorMessage,
          userId,
          fullError: JSON.stringify(data, null, 2),
        });

        // แสดง error message ที่เข้าใจง่าย
        if (status === 400) {
          console.error('[LINE] Bad Request (400) - สาเหตุที่เป็นไปได้:');
          console.error('  1. User ID ไม่ถูกต้องหรือ format ผิด');
          console.error('  2. User ยังไม่ได้เป็นเพื่อนกับ LINE Official Account');
          console.error('  3. Message format ไม่ถูกต้อง');
          console.error('  4. Request payload ไม่ถูกต้อง');
          if (details) {
            console.error('  Error Details:', JSON.stringify(details, null, 2));
          }
        } else if (status === 401) {
          console.error('[LINE] Unauthorized (401) - Channel Access Token ไม่ถูกต้องหรือหมดอายุ');
        } else if (status === 403) {
          console.error('[LINE] Forbidden (403) - User ไม่ได้เป็นเพื่อนกับ LINE Official Account');
          console.error('  วิธีแก้ไข: ให้ User เพิ่ม LINE Official Account เป็นเพื่อนก่อน');
        } else if (status === 404) {
          console.error('[LINE] Not Found (404) - User ID ไม่พบในระบบ LINE');
        } else if (status === 429) {
          console.error('[LINE] Too Many Requests (429) - ส่งข้อความบ่อยเกินไป');
        } else {
          console.error(`[LINE] Error ${status}: ${errorMessage}`);
        }
      } else {
        console.error('[LINE] Unknown error sending notification:', error);
      }
      return false;
    }
  }

  /**
   * สร้างข้อความแจ้งเตือนตามสถานะการซ่อม
   */
  createRepairStatusMessage(
    customerName: string,
    repairNumber: string,
    status: string,
    deviceType: string,
    additionalInfo?: string
  ): string {
    // ใช้เทมเพลตที่ผู้ใช้กำหนด หรือเทมเพลตเริ่มต้น
    let template = customStatusTemplates[status] || DEFAULT_STATUS_TEMPLATES[status]?.template;
    
    if (!template) {
      return `แจ้งเตือน: สถานะงานซ่อม ${repairNumber} เปลี่ยนเป็น ${status}`;
    }

    // แทนที่ตัวแปรในเทมเพลต
    let message = template
      .replace(/{customerName}/g, customerName)
      .replace(/{repairNumber}/g, repairNumber)
      .replace(/{deviceType}/g, deviceType)
      .replace(/{status}/g, status);

    // จัดการ additionalInfo
    if (additionalInfo) {
      message = message.replace(/{additionalInfo}/g, `หมายเหตุ: ${additionalInfo}\n`);
    } else {
      message = message.replace(/{additionalInfo}/g, '');
    }

    return message;
  }

  /**
   * ดึงเทมเพลตทั้งหมด
   */
  static getAllTemplates(): Record<string, StatusTemplate> {
    const templates: Record<string, StatusTemplate> = {};
    
    for (const [key, value] of Object.entries(DEFAULT_STATUS_TEMPLATES)) {
      templates[key] = {
        ...value,
        template: customStatusTemplates[key] || value.template,
      };
    }
    
    return templates;
  }

  /**
   * อัพเดทเทมเพลตสำหรับสถานะใดสถานะหนึ่ง
   */
  static updateTemplate(status: string, newTemplate: string): boolean {
    if (!DEFAULT_STATUS_TEMPLATES[status]) {
      return false;
    }
    
    customStatusTemplates[status] = newTemplate;
    return true;
  }

  /**
   * รีเซ็ตเทมเพลตกลับไปใช้ค่าเริ่มต้น
   */
  static resetTemplate(status?: string): void {
    if (status) {
      delete customStatusTemplates[status];
    } else {
      customStatusTemplates = {};
    }
  }

  /**
   * ดึงเทมเพลตของสถานะเฉพาะ
   */
  static getTemplate(status: string): StatusTemplate | null {
    if (!DEFAULT_STATUS_TEMPLATES[status]) {
      return null;
    }
    
    return {
      ...DEFAULT_STATUS_TEMPLATES[status],
      template: customStatusTemplates[status] || DEFAULT_STATUS_TEMPLATES[status].template,
    };
  }

  /**
   * ส่งการแจ้งเตือนเมื่อสถานะการซ่อมเปลี่ยน
   */
  async notifyRepairStatusChange(
    customerLineId: string,
    customerName: string,
    repairNumber: string,
    newStatus: string,
    deviceType: string,
    additionalInfo?: string
  ): Promise<boolean> {
    if (!customerLineId) {
      console.warn('[LINE] Customer does not have LINE ID, skipping notification');
      return false;
    }

    const message = this.createRepairStatusMessage(
      customerName,
      repairNumber,
      newStatus,
      deviceType,
      additionalInfo
    );

    return await this.sendNotification(customerLineId, message);
  }

  /**
   * ส่งข้อความแจ้งเตือนทั่วไป
   */
  async sendCustomMessage(userId: string, message: string): Promise<boolean> {
    return await this.sendNotification(userId, message);
  }
}

// Singleton instance
let lineService: LineNotificationService | null = null;
let lastToken: string | null = null;

/**
 * สร้างหรือดึง instance ของ LINE Notification Service
 * จะสร้าง instance ใหม่ถ้า Token เปลี่ยน
 */
export function getLineNotificationService(): LineNotificationService | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN not configured, LINE notifications disabled');
    lineService = null;
    lastToken = null;
    return null;
  }

  // ถ้า Token เปลี่ยน หรือยังไม่มี service instance ให้สร้างใหม่
  if (!lineService || lastToken !== channelAccessToken) {
    lineService = new LineNotificationService({ channelAccessToken });
    lastToken = channelAccessToken;
    console.log('[LINE] LINE Notification Service initialized');
    if (lastToken !== channelAccessToken) {
      console.log('[LINE] Token updated, service reinitialized');
    }
  }

  return lineService;
}
