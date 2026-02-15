import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';
import { Customer } from '../entities/Customer.js';
import { getLineNotificationService, LineNotificationService } from '../services/line-notification.service.js';
import { Not, IsNull } from 'typeorm';
import crypto from 'crypto';
import axios from 'axios';

const router = Router();

// Store recent webhook events for debugging (in-memory, max 10 events)
interface RecentWebhookEvent {
  timestamp: Date;
  type: string;
  userId: string;
  message?: string;
}

const recentWebhookEvents: RecentWebhookEvent[] = [];

function addRecentEvent(event: RecentWebhookEvent) {
  recentWebhookEvents.unshift(event);
  if (recentWebhookEvents.length > 10) {
    recentWebhookEvents.pop();
  }
}

/**
 * LINE Webhook Endpoint
 * รับ events จาก LINE เมื่อลูกค้า Add Friend หรือส่งข้อความมา
 */

// Middleware สำหรับตรวจสอบ signature (optional แต่แนะนำ)
function validateSignature(req: any): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const signature = req.headers['x-line-signature'] as string;
  
  if (!channelSecret || !signature) {
    return false;
  }

  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
}

/**
 * Webhook endpoint สำหรับรับ events จาก LINE
 * POST /api/line/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    // ตรวจสอบ signature (ถ้าต้องการความปลอดภัยสูง)
    // if (!validateSignature(req)) {
    //   console.error('[LINE Webhook] Invalid signature');
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const events = req.body.events || [];
    console.log(`[LINE Webhook] Received ${events.length} events`);

    for (const event of events) {
      const userId = event.source?.userId;
      
      if (!userId) {
        console.warn('[LINE Webhook] Event without userId:', event.type);
        continue;
      }

      console.log(`[LINE Webhook] Event: ${event.type}, User ID: ${userId}`);

      // บันทึก event สำหรับ debugging
      addRecentEvent({
        timestamp: new Date(),
        type: event.type,
        userId: userId,
        message: event.message?.type === 'text' ? event.message.text : undefined,
      });

      // กรณี: ลูกค้า Add Friend LINE OA
      if (event.type === 'follow') {
        console.log(`[LINE Webhook] New follower: ${userId}`);
        
        // ส่งข้อความต้อนรับ
        const lineService = getLineNotificationService();
        if (lineService) {
          await lineService.sendCustomMessage(
            userId,
            '👋 สวัสดีค่ะ! ขอบคุณที่เพิ่มเราเป็นเพื่อน\n\n📱 กรุณาส่งเบอร์โทรศัพท์ของคุณ (10 หลัก)\nเพื่อเชื่อมโยงบัญชีและรับการแจ้งเตือนสถานะการซ่อม\n\nตัวอย่าง: 0812345678'
          );
        }
      }

      // กรณี: ลูกค้าส่งข้อความมา
      if (event.type === 'message' && event.message?.type === 'text') {
        const messageText = event.message.text;
        console.log(`[LINE Webhook] Message from ${userId}: ${messageText}`);

        // ตรวจสอบว่าเป็นเบอร์โทรหรือไม่ (10 หลัก เริ่มต้นด้วย 0)
        const phonePattern = /^0\d{9}$/;
        const isPhoneNumber = phonePattern.test(messageText.trim());

        if (isPhoneNumber) {
          const phone = messageText.trim();
          console.log(`[LINE Webhook] Detected phone number: ${phone}`);

          // ค้นหาลูกค้าจากเบอร์โทร
          const customerRepository = AppDataSource.getRepository(Customer);
          const customer = await customerRepository.findOne({
            where: { phone },
          });

          if (customer) {
            // บันทึก LINE User ID ลงในฐานข้อมูล
            customer.lineIdRes = userId;
            await customerRepository.save(customer);

            console.log(`[LINE Webhook] Linked user ${userId} to customer ${customer.id} (${customer.firstName})`);

            // ส่งข้อความยืนยัน
            const lineService = getLineNotificationService();
            if (lineService) {
              const customerName = customer.fullName || 
                                  `${customer.firstName} ${customer.lastName || ''}`.trim();
              await lineService.sendCustomMessage(
                userId,
                `✅ เชื่อมโยงบัญชีสำเร็จ!\n\n👤 คุณ ${customerName}\n📱 เบอร์โทร: ${phone}\n\n🔔 ตอนนี้คุณจะได้รับการแจ้งเตือนสถานะการซ่อมอัตโนมัติทางไลน์นี้`
              );
            }
          } else {
            console.log(`[LINE Webhook] No customer found with phone: ${phone}`);

            // แจ้งลูกค้าว่าไม่พบข้อมูล
            const lineService = getLineNotificationService();
            if (lineService) {
              await lineService.sendCustomMessage(
                userId,
                '❌ ไม่พบข้อมูลลูกค้าจากเบอร์โทรนี้\n\n📞 กรุณาติดต่อร้านเพื่อลงทะเบียนก่อน หรือตรวจสอบว่าเบอร์โทรถูกต้อง'
              );
            }
          }
        } else {
          // ข้อความไม่ใช่เบอร์โทร
          console.log(`[LINE Webhook] Message is not a phone number: ${messageText}`);
          
          // แนะนำให้ส่งเบอร์โทร
          const lineService = getLineNotificationService();
          if (lineService) {
            await lineService.sendCustomMessage(
              userId,
              '📱 กรุณาส่งเบอร์โทรศัพท์ของคุณ (10 หลัก)\n\nตัวอย่าง: 0812345678\n\n💡 หากคุณเชื่อมโยงบัญชีแล้ว ไม่ต้องส่งอีก'
            );
          }
        }
      }

      // กรณี: ลูกค้า Unfollow (ยกเลิกการเป็นเพื่อน)
      if (event.type === 'unfollow') {
        console.log(`[LINE Webhook] User unfollowed: ${userId}`);
        
        // TODO: ลบ LINE User ID ออกจากฐานข้อมูล (ถ้าต้องการ)
        // const customerRepository = AppDataSource.getRepository(Customer);
        // await customerRepository.update(
        //   { lineIdRes: userId },
        //   { lineIdRes: null }
        // );
      }
    }

    // ตอบกลับ LINE ว่าได้รับ events แล้ว (ต้องตอบภายใน 1 วินาที)
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('[LINE Webhook] Error processing events:', error);
    
    // แม้จะเกิด error ก็ต้องตอบกลับ 200 OK เพื่อไม่ให้ LINE retry
    res.json({ status: 'error', message: 'Internal error' });
  }
});

/**
 * Endpoint สำหรับทดสอบ (GET)
 */
router.get('/webhook', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LINE Webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
});

/**
 * ดึงรายการ Webhook events ล่าสุด (สำหรับ debugging)
 * GET /api/line/recent-events
 */
router.get('/recent-events', async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: recentWebhookEvents,
      message: `Found ${recentWebhookEvents.length} recent events`,
    });
  } catch (error) {
    console.error('[LINE Recent Events] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent events',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ตรวจสอบสถานะการเชื่อมต่อ LINE
 * GET /api/line/status
 */
router.get('/status', async (req, res) => {
  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const hasToken = !!channelAccessToken;

    let connected = false;
    let message = '';
    let tokenPreview = '';
    let tokenLength = 0;
    let isValidFormat = false;
    let tokenValid = false;
    let tokenError = '';

    if (!hasToken) {
      message = 'LINE_CHANNEL_ACCESS_TOKEN not configured';
    } else {
      tokenLength = channelAccessToken.length;
      // แสดง preview ของ Token (4 ตัวแรก + ... + 4 ตัวสุดท้าย)
      if (tokenLength > 8) {
        tokenPreview = `${channelAccessToken.substring(0, 4)}...${channelAccessToken.substring(tokenLength - 4)}`;
      } else {
        tokenPreview = '***';
      }

      // ตรวจสอบ format ของ Token (LINE Channel Access Token มักจะยาวกว่า 100 ตัวอักษร)
      // แต่บางครั้งอาจจะสั้นกว่าได้ ขึ้นอยู่กับประเภทของ Token
      isValidFormat = tokenLength >= 20; // อย่างน้อย 20 ตัวอักษร

      // ทดสอบการเชื่อมต่อโดยการเรียก LINE API จริง ๆ
      try {
        const response = await axios.get('https://api.line.me/v2/bot/info', {
          headers: {
            'Authorization': `Bearer ${channelAccessToken}`,
          },
        });
        
        if (response.status === 200) {
          tokenValid = true;
          connected = true;
          message = `LINE service is ready. Bot name: ${response.data?.displayName || 'N/A'}`;
        }
      } catch (apiError: any) {
        tokenValid = false;
        connected = false;
        
        if (apiError.response?.status === 401) {
          tokenError = 'Channel Access Token ไม่ถูกต้องหรือหมดอายุ (401 Unauthorized)';
          message = '❌ Token authentication failed. Please check your LINE_CHANNEL_ACCESS_TOKEN in .env file';
        } else if (apiError.response?.status === 403) {
          tokenError = 'Token ไม่มีสิทธิ์เข้าถึง API นี้ (403 Forbidden)';
          message = '❌ Token does not have permission to access this API';
        } else {
          tokenError = apiError.response?.data?.message || apiError.message || 'Unknown error';
          message = `❌ Failed to verify token: ${tokenError}`;
        }
        
        console.error('[LINE Status] Token validation failed:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
          message: tokenError,
        });
      }

      // ถ้า token ไม่ valid แต่ service ยัง initialize ได้
      const lineService = getLineNotificationService();
      if (lineService && !tokenValid) {
        // Service initialized แต่ token ไม่ valid
        message = tokenError || 'LINE service initialized, but token validation failed';
      } else if (!lineService) {
        message = 'Failed to initialize LINE service';
      }
    }

    res.json({
      status: 'success',
      data: {
        connected,
        hasToken,
        tokenValid,
        message,
        tokenPreview: hasToken ? tokenPreview : null,
        tokenLength: hasToken ? tokenLength : 0,
        isValidFormat: hasToken ? isValidFormat : false,
        tokenError: tokenError || null,
      },
    });
  } catch (error) {
    console.error('[LINE Status] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check LINE status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ทดสอบการส่งข้อความ
 * POST /api/line/test
 */
router.post('/test', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'userId and message are required',
      });
    }

    // ตรวจสอบ format ของ userId
    if (!userId.startsWith('U')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid LINE User ID format. LINE User ID must start with "U"',
        details: 'You provided: ' + userId + '. This is not a valid LINE User ID.',
      });
    }

    const lineService = getLineNotificationService();
    if (!lineService) {
      return res.status(500).json({
        status: 'error',
        message: 'LINE service is not configured. Please set LINE_CHANNEL_ACCESS_TOKEN in .env file',
      });
    }

    // เรียก sendCustomMessage และดึง error details
    try {
      const success = await lineService.sendCustomMessage(userId, message);

      if (success) {
        res.json({
          status: 'success',
          message: 'Test message sent successfully',
        });
      } else {
        // ถ้า send ไม่สำเร็จ แต่ไม่ throw error อาจเป็นเพราะ LINE API error
        // ให้ตรวจสอบ logs ใน console
        res.status(500).json({
          status: 'error',
          message: 'Failed to send test message. Please check backend console for details.',
          possibleReasons: [
            'User ยังไม่ได้เป็นเพื่อนกับ LINE Official Account (แม้จะเห็นใน LINE Official Account Manager)',
            'User ยังไม่เคยส่งข้อความมาหา OA (ต้องมี active chat)',
            'User ได้ block หรือปิดการรับข้อความจาก OA',
            'LINE User ID ไม่ถูกต้องหรือ format ผิด',
            'Channel Access Token is invalid or expired (try restarting backend server)',
            'Rate limit exceeded (too many messages sent)',
          ],
          solution: 'ให้ User ส่งข้อความมาหา LINE OA ก่อน (เช่น ส่ง "สวัสดี") แล้วลองส่งอีกครั้ง',
        });
      }
    } catch (sendError: any) {
      // ถ้าเกิด error ระหว่างส่งข้อความ
      console.error('[LINE Test] Error during send:', sendError);
      res.status(500).json({
        status: 'error',
        message: 'Error occurred while sending message',
        error: sendError?.message || 'Unknown error',
        possibleReasons: [
          'Network error or LINE API is unreachable',
          'Invalid request format',
          'Backend server error',
        ],
      });
    }
  } catch (error) {
    console.error('[LINE Test] Error:', error);
    
    let errorMessage = 'Failed to send test message';
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
      error: errorDetails,
    });
  }
});

/**
 * ดึงรายการลูกค้าที่มี LINE User ID
 * GET /api/line/customers
 */
router.get('/customers', async (req, res) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    
    // ดึงลูกค้าทั้งหมดที่มี lineIdRes (LINE User ID)
    const customers = await customerRepository.find({
      where: {
        lineIdRes: Not(IsNull()),
      },
      order: {
        firstName: 'ASC',
      },
    });

    // กรองเฉพาะที่มี lineIdRes จริง ๆ (ไม่ใช่ empty string)
    const customersWithLine = customers.filter(c => c.lineIdRes && c.lineIdRes.trim() !== '');

    // Format response
    const formattedCustomers = customersWithLine.map(customer => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: customer.fullName,
      phone: customer.phone,
      lineId: customer.lineId,
      lineIdRes: customer.lineIdRes,
    }));

    res.json({
      status: 'success',
      data: formattedCustomers,
    });
  } catch (error) {
    console.error('[LINE Customers] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * เชื่อมโยง LINE User ID กับลูกค้าด้วยตนเอง
 * POST /api/line/link-customer
 * Body: { customerId: string, lineUserId: string }
 */
router.post('/link-customer', async (req, res) => {
  try {
    const { customerId, lineUserId } = req.body;

    if (!customerId || !lineUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'customerId and lineUserId are required',
      });
    }

    if (!lineUserId.startsWith('U')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid LINE User ID format. LINE User ID must start with "U"',
      });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    
    // ตรวจสอบว่าลูกค้ามีอยู่จริง
    const customer = await customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    // ตรวจสอบว่า LINE User ID นี้ถูกใช้โดยลูกค้าคนอื่นแล้วหรือไม่
    const existingCustomer = await customerRepository.findOne({
      where: { lineIdRes: lineUserId },
    });

    if (existingCustomer && existingCustomer.id !== customerId) {
      const existingName = existingCustomer.fullName || 
                          `${existingCustomer.firstName} ${existingCustomer.lastName || ''}`.trim();
      return res.status(409).json({
        status: 'error',
        message: `LINE User ID นี้ถูกใช้โดยลูกค้าคนอื่นแล้ว: ${existingName} (${existingCustomer.phone || 'ไม่มีเบอร์'})`,
      });
    }

    // บันทึก LINE User ID
    customer.lineIdRes = lineUserId;
    await customerRepository.save(customer);

    const customerName = customer.fullName || 
                        `${customer.firstName} ${customer.lastName || ''}`.trim();

    console.log(`[LINE Manual Link] Linked user ${lineUserId} to customer ${customer.id} (${customerName})`);

    // ส่งข้อความยืนยันให้ลูกค้า
    const lineService = getLineNotificationService();
    if (lineService) {
      try {
        await lineService.sendCustomMessage(
          lineUserId,
          `✅ เชื่อมโยงบัญชีสำเร็จ!\n\n👤 คุณ ${customerName}\n📱 เบอร์โทร: ${customer.phone || 'ไม่มีเบอร์'}\n\n🔔 ตอนนี้คุณจะได้รับการแจ้งเตือนสถานะการซ่อมอัตโนมัติทางไลน์นี้`
        );
      } catch (sendError) {
        console.error('[LINE Manual Link] Failed to send confirmation message:', sendError);
        // ไม่ throw error เพราะการเชื่อมโยงสำเร็จแล้ว
      }
    }

    res.json({
      status: 'success',
      message: 'เชื่อมโยง LINE User ID สำเร็จ',
      data: {
        customerId: customer.id,
        customerName,
        lineUserId,
      },
    });
  } catch (error) {
    console.error('[LINE Manual Link] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to link LINE User ID',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ยกเลิกการเชื่อมโยง LINE User ID
 * POST /api/line/unlink-customer
 * Body: { customerId: string }
 */
router.post('/unlink-customer', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        status: 'error',
        message: 'customerId is required',
      });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    
    const customer = await customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    const oldLineUserId = customer.lineIdRes;
    customer.lineIdRes = undefined;
    await customerRepository.save(customer);

    const customerName = customer.fullName || 
                        `${customer.firstName} ${customer.lastName || ''}`.trim();

    console.log(`[LINE Manual Unlink] Unlinked LINE User ID from customer ${customer.id} (${customerName})`);

    res.json({
      status: 'success',
      message: 'ยกเลิกการเชื่อมโยงสำเร็จ',
      data: {
        customerId: customer.id,
        customerName,
        oldLineUserId,
      },
    });
  } catch (error) {
    console.error('[LINE Manual Unlink] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unlink LINE User ID',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ดึงเทมเพลตข้อความสถานะทั้งหมด
 * GET /api/line/status-templates
 */
router.get('/status-templates', async (req, res) => {
  try {
    const templates = LineNotificationService.getAllTemplates();
    
    res.json({
      status: 'success',
      data: templates,
      message: 'ดึงเทมเพลตสำเร็จ',
    });
  } catch (error) {
    console.error('[LINE Status Templates] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch status templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ดึงเทมเพลตข้อความสถานะเฉพาะ
 * GET /api/line/status-templates/:status
 */
router.get('/status-templates/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const template = LineNotificationService.getTemplate(status);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: `ไม่พบเทมเพลตสำหรับสถานะ: ${status}`,
      });
    }

    res.json({
      status: 'success',
      data: template,
      message: 'ดึงเทมเพลตสำเร็จ',
    });
  } catch (error) {
    console.error('[LINE Status Template] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch status template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * อัพเดทเทมเพลตข้อความสถานะ
 * PUT /api/line/status-templates/:status
 * Body: { template: string }
 */
router.put('/status-templates/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { template } = req.body;

    if (!template || typeof template !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'template is required and must be a string',
      });
    }

    const success = LineNotificationService.updateTemplate(status, template);

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: `ไม่พบเทมเพลตสำหรับสถานะ: ${status}`,
        availableStatuses: ['pending', 'in-progress', 'waiting_parts', 'completed', 'cancelled', 'picked-up'],
      });
    }

    console.log(`[LINE Template Update] Updated template for status: ${status}`);

    res.json({
      status: 'success',
      message: 'อัพเดทเทมเพลตสำเร็จ',
      data: {
        status,
        template,
      },
    });
  } catch (error) {
    console.error('[LINE Template Update] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update status template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * รีเซ็ตเทมเพลตกลับไปใช้ค่าเริ่มต้น
 * POST /api/line/status-templates/reset
 * Body: { status?: string } (ถ้าไม่ระบุจะรีเซ็ตทั้งหมด)
 */
router.post('/status-templates/reset', async (req, res) => {
  try {
    const { status } = req.body;

    if (status && typeof status !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'status must be a string',
      });
    }

    // ตรวจสอบว่าสถานะที่ระบุมีอยู่จริงหรือไม่
    if (status) {
      const template = LineNotificationService.getTemplate(status);
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: `ไม่พบเทมเพลตสำหรับสถานะ: ${status}`,
          availableStatuses: ['pending', 'in-progress', 'waiting_parts', 'completed', 'cancelled', 'picked-up'],
        });
      }
    }

    LineNotificationService.resetTemplate(status);

    const message = status 
      ? `รีเซ็ตเทมเพลตสำหรับสถานะ ${status} สำเร็จ` 
      : 'รีเซ็ตเทมเพลตทั้งหมดสำเร็จ';

    console.log(`[LINE Template Reset] ${message}`);

    res.json({
      status: 'success',
      message,
      data: {
        resetStatus: status || 'all',
      },
    });
  } catch (error) {
    console.error('[LINE Template Reset] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset status template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ทดสอบการส่งข้อความด้วยเทมเพลต
 * POST /api/line/test-template
 * Body: { userId: string, status: string, customerName: string, repairNumber: string, deviceType: string, additionalInfo?: string }
 */
router.post('/test-template', async (req, res) => {
  try {
    const { userId, status, customerName, repairNumber, deviceType, additionalInfo } = req.body;

    if (!userId || !status || !customerName || !repairNumber || !deviceType) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, status, customerName, repairNumber, and deviceType are required',
      });
    }

    // ตรวจสอบ format ของ userId
    if (!userId.startsWith('U')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid LINE User ID format. LINE User ID must start with "U"',
      });
    }

    const lineService = getLineNotificationService();
    if (!lineService) {
      return res.status(500).json({
        status: 'error',
        message: 'LINE service is not configured',
      });
    }

    // สร้างข้อความจากเทมเพลต
    const message = lineService.createRepairStatusMessage(
      customerName,
      repairNumber,
      status,
      deviceType,
      additionalInfo
    );

    // ส่งข้อความ
    const success = await lineService.sendCustomMessage(userId, message);

    if (success) {
      res.json({
        status: 'success',
        message: 'ส่งข้อความทดสอบสำเร็จ',
        data: {
          userId,
          status,
          previewMessage: message,
        },
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send test message',
      });
    }
  } catch (error) {
    console.error('[LINE Test Template] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
