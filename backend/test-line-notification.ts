/**
 * ไฟล์ทดสอบระบบแจ้งเตือน LINE
 * 
 * วิธีใช้งาน:
 * 1. เพิ่ม LINE_CHANNEL_ACCESS_TOKEN ใน .env
 * 2. แก้ไข testUserId เป็น LINE User ID ของคุณ
 * 3. รัน: npx tsx test-line-notification.ts
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { getLineNotificationService } from './src/services/line-notification.service.js';

dotenv.config();

async function testLineNotification() {
  console.log('🧪 เริ่มทดสอบระบบแจ้งเตือน LINE...\n');

  // ตรวจสอบว่ามี Channel Access Token หรือไม่
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('❌ Error: LINE_CHANNEL_ACCESS_TOKEN not found in .env file');
    console.log('\nกรุณาเพิ่ม LINE_CHANNEL_ACCESS_TOKEN ในไฟล์ .env:');
    console.log('LINE_CHANNEL_ACCESS_TOKEN=your_token_here');
    process.exit(1);
  }

  // ดึง LINE Notification Service
  const lineService = getLineNotificationService();
  if (!lineService) {
    console.error('❌ Error: Cannot initialize LINE Notification Service');
    process.exit(1);
  }

  console.log('✅ LINE Notification Service initialized\n');

  // ===== ทดสอบส่งข้อความ =====
  
  // ⚠️ แก้ไข LINE User ID ตรงนี้
  const testUserId = 'U1234567890abcdef...'; // ← ใส่ LINE User ID ของคุณ
  
  if (testUserId === 'U1234567890abcdef...') {
    console.error('❌ Error: กรุณาแก้ไข testUserId ในไฟล์นี้ก่อน!');
    console.log('\nวิธีหา LINE User ID:');
    console.log('1. ไปที่ LINE Official Account Manager');
    console.log('2. เปิดแชทกับตัวเอง');
    console.log('3. คลิกที่ชื่อด้านบน');
    console.log('4. คัดลอก User ID (เริ่มต้นด้วย U)');
    process.exit(1);
  }

  console.log(`📱 ส่งข้อความทดสอบไปที่: ${testUserId}\n`);

  // ทดสอบที่ 1: ส่งข้อความธรรมดา
  console.log('🔹 ทดสอบที่ 1: ส่งข้อความทั่วไป');
  const test1 = await lineService.sendCustomMessage(
    testUserId,
    '🔔 ทดสอบระบบแจ้งเตือน\n\nหากคุณเห็นข้อความนี้ แสดงว่าระบบทำงานปกติ! ✅'
  );
  console.log(test1 ? '✅ สำเร็จ!' : '❌ ล้มเหลว!\n');

  // รอ 2 วินาที
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ทดสอบที่ 2: ส่งข้อความแจ้งเตือนสถานะ "กำลังซ่อม"
  console.log('\n🔹 ทดสอบที่ 2: ข้อความแจ้งสถานะ "กำลังซ่อม"');
  const test2 = await lineService.notifyRepairStatusChange(
    testUserId,
    'คุณทดสอบ',
    'REP-2024-001',
    'in-progress',
    'iPhone 14 Pro',
    'ช่างกำลังตรวจสอบอาการ'
  );
  console.log(test2 ? '✅ สำเร็จ!' : '❌ ล้มเหลว!\n');

  // รอ 2 วินาที
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ทดสอบที่ 3: ส่งข้อความแจ้งเตือนสถานะ "ซ่อมเสร็จแล้ว"
  console.log('\n🔹 ทดสอบที่ 3: ข้อความแจ้งสถานะ "ซ่อมเสร็จแล้ว"');
  const test3 = await lineService.notifyRepairStatusChange(
    testUserId,
    'คุณทดสอบ',
    'REP-2024-001',
    'completed',
    'iPhone 14 Pro',
    'ซ่อมหน้าจอ และเปลี่ยนแบตเตอรี่'
  );
  console.log(test3 ? '✅ สำเร็จ!' : '❌ ล้มเหลว!\n');

  // สรุปผล
  console.log('\n' + '='.repeat(50));
  console.log('📊 สรุปผลการทดสอบ:');
  console.log('='.repeat(50));
  
  const successCount = [test1, test2, test3].filter(Boolean).length;
  const totalTests = 3;
  
  console.log(`✅ สำเร็จ: ${successCount}/${totalTests} ข้อ`);
  console.log(`❌ ล้มเหลว: ${totalTests - successCount}/${totalTests} ข้อ`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 ผ่านทุกการทดสอบ! ระบบพร้อมใช้งาน');
  } else {
    console.log('\n⚠️  บางการทดสอบล้มเหลว กรุณาตรวจสอบ:');
    console.log('   1. LINE Channel Access Token ถูกต้อง');
    console.log('   2. User ID ถูกต้อง (เริ่มต้นด้วย U)');
    console.log('   3. คุณเพิ่ม LINE OA เป็นเพื่อนแล้ว');
    console.log('   4. LINE OA ไม่ถูกบล็อก');
  }
  
  console.log('\n✨ เสร็จสิ้นการทดสอบ\n');
  process.exit(successCount === totalTests ? 0 : 1);
}

// รันการทดสอบ
testLineNotification().catch((error) => {
  console.error('\n❌ เกิดข้อผิดพลาดในการทดสอบ:');
  console.error(error);
  process.exit(1);
});
