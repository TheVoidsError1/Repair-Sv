/**
 * Script สำหรับตรวจสอบ LINE Channel Access Token
 * ใช้เพื่อตรวจสอบว่า Token ถูกต้องและใช้งานได้หรือไม่
 */

import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลด environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkLineToken() {
  console.log('🔍 กำลังตรวจสอบ LINE Channel Access Token...\n');

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  // ตรวจสอบว่ามี Token หรือไม่
  if (!channelAccessToken) {
    console.error('❌ ไม่พบ LINE_CHANNEL_ACCESS_TOKEN ในไฟล์ .env');
    console.log('\n📝 วิธีแก้ไข:');
    console.log('1. เปิดไฟล์ backend/.env');
    console.log('2. เพิ่มบรรทัด: LINE_CHANNEL_ACCESS_TOKEN=your_token_here');
    console.log('3. Restart backend server\n');
    process.exit(1);
  }

  console.log('✅ พบ LINE_CHANNEL_ACCESS_TOKEN ใน .env file');
  console.log(`📏 ความยาว Token: ${channelAccessToken.length} ตัวอักษร`);
  
  // แสดง preview ของ Token (4 ตัวแรก + ... + 4 ตัวสุดท้าย)
  if (channelAccessToken.length > 8) {
    const preview = `${channelAccessToken.substring(0, 4)}...${channelAccessToken.substring(channelAccessToken.length - 4)}`;
    console.log(`🔑 Token Preview: ${preview}`);
  }

  // ตรวจสอบ format
  if (channelAccessToken.length < 20) {
    console.warn('⚠️  Token ดูสั้นเกินไป (น้อยกว่า 20 ตัวอักษร)');
    console.warn('   LINE Channel Access Token ปกติจะยาวกว่า 100 ตัวอักษร\n');
  }

  // ทดสอบ Token กับ LINE API
  console.log('\n🧪 กำลังทดสอบ Token กับ LINE API...\n');

  try {
    const response = await axios.get('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      timeout: 10000, // 10 seconds timeout
    });

    if (response.status === 200) {
      console.log('✅ Token ถูกต้องและใช้งานได้!\n');
      console.log('📋 ข้อมูล Bot:');
      console.log(`   - Bot Name: ${response.data.displayName || 'N/A'}`);
      console.log(`   - Bot ID: ${response.data.userId || 'N/A'}`);
      console.log(`   - Basic ID: ${response.data.basicId || 'N/A'}`);
      console.log(`   - Premium ID: ${response.data.premiumId || 'N/A'}`);
      console.log(`   - Picture URL: ${response.data.pictureUrl || 'N/A'}`);
      console.log(`   - Status: ${response.data.statusMessage || 'N/A'}\n`);
      
      console.log('🎉 Token พร้อมใช้งาน! คุณสามารถส่งข้อความได้แล้ว\n');
      return true;
    }
  } catch (error: any) {
    console.error('❌ Token ไม่ถูกต้องหรือหมดอายุ!\n');
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error('📊 Error Details:');
      console.error(`   Status Code: ${status}`);
      console.error(`   Error Message: ${data?.message || error.message}\n`);
      
      if (status === 401) {
        console.error('🔴 สาเหตุที่เป็นไปได้:');
        console.error('   1. Token ไม่ถูกต้อง (อาจจะคัดลอกผิด)');
        console.error('   2. Token หมดอายุ (LINE Token มีอายุ 30 วัน)');
        console.error('   3. Token ไม่ใช่ของ Channel นี้');
        console.error('   4. Token ถูก revoke หรือลบไปแล้ว\n');
        
        console.log('💡 วิธีแก้ไข:');
        console.log('   1. ไปที่ LINE Developers Console: https://developers.line.biz/console/');
        console.log('   2. เลือก Provider และ Channel ของคุณ');
        console.log('   3. ไปที่แท็บ "Messaging API"');
        console.log('   4. หาส่วน "Channel access token"');
        console.log('   5. คลิก "Issue" หรือ "Reissue" เพื่อสร้าง Token ใหม่');
        console.log('   6. คัดลอก Token ใหม่ (ยาวประมาณ 100+ ตัวอักษร)');
        console.log('   7. วาง Token ใหม่ในไฟล์ backend/.env');
        console.log('   8. Restart backend server\n');
      } else if (status === 403) {
        console.error('🔴 Token ไม่มีสิทธิ์เข้าถึง API นี้');
        console.error('   ตรวจสอบว่า Token นี้เป็นของ Messaging API Channel\n');
      } else if (status === 404) {
        console.error('🔴 ไม่พบ Bot หรือ Channel');
        console.error('   ตรวจสอบว่า Channel ยังใช้งานอยู่\n');
      } else {
        console.error(`🔴 Error อื่น ๆ: ${data?.message || error.message}\n`);
      }
    } else {
      console.error('🔴 Unknown error:', error);
    }
    
    return false;
  }
}

// รันการตรวจสอบ
checkLineToken()
  .then((success) => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
