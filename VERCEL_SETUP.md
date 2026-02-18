# การตั้งค่า Vercel สำหรับ Repair Hub Pro

## ปัญหาที่พบ
Frontend ถูก deploy บน Vercel แล้ว แต่ไม่สามารถเชื่อมต่อกับ Backend API ได้

## วิธีแก้ไข

### วิธีที่ 1: ใช้ Environment Variable (แนะนำ)

1. ไปที่ Vercel Dashboard → Project Settings → Environment Variables
2. เพิ่ม Environment Variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: URL ของ Backend ที่ deploy แล้ว (เช่น `https://your-backend.railway.app` หรือ `https://your-backend.render.com`)
   - **Environment**: Production, Preview, Development (เลือกตามต้องการ)

3. Redeploy project บน Vercel

### วิธีที่ 2: ใช้ Vercel Rewrites (ถ้า Backend อยู่บน Vercel)

1. แก้ไขไฟล์ `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://YOUR_BACKEND_URL/api/$1"
       }
     ]
   }
   ```

2. แทนที่ `YOUR_BACKEND_URL` ด้วย URL จริงของ Backend

## Deploy Backend

Backend ต้องถูก deploy แยกจาก Frontend บน platform อื่น เช่น:

- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### ตัวอย่างการตั้งค่า Backend บน Railway:

1. สร้างโปรเจกต์ใหม่บน Railway
2. Connect GitHub repository
3. ตั้งค่า Root Directory เป็น `backend`
4. ตั้งค่า Environment Variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `FRONTEND_URL` (URL ของ Frontend บน Vercel)
   - `PORT` (Railway จะกำหนดให้อัตโนมัติ)
   - `NODE_ENV=production`

5. หลังจาก deploy เสร็จ ให้ copy URL ของ Backend (เช่น `https://your-app.railway.app`)

6. ตั้งค่า `VITE_API_BASE_URL` บน Vercel ให้ชี้ไปที่ URL นี้

## ตรวจสอบการตั้งค่า

หลังจากตั้งค่าเสร็จแล้ว:

1. ไปที่ Vercel Dashboard → Deployments
2. คลิกที่ deployment ล่าสุด → View Function Logs
3. ตรวจสอบว่า build สำเร็จ
4. เปิดเว็บไซต์และตรวจสอบ Console ใน Browser DevTools
5. ควรเห็น API calls ไปที่ Backend URL ที่ตั้งค่าไว้

## Socket.IO

สำหรับ Socket.IO connection ต้องใช้ URL เดียวกันกับ API base URL

ตรวจสอบว่า Backend รองรับ WebSocket connections และ CORS ถูกตั้งค่าถูกต้อง
