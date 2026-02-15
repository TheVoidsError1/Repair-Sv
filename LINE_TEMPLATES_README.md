# LINE Status Templates Management

## สรุปสั้นๆ

เพิ่มฟีเจอร์การจัดการเทมเพลตข้อความสถานะการซ่อมสำหรับการแจ้งเตือนผ่าน LINE Official Account โดยผู้ใช้สามารถแก้ไขข้อความได้เองผ่าน UI โดยไม่ต้องแก้โค้ด

## ไฟล์ที่เกี่ยวข้อง

### Backend
- ✅ `backend/src/services/line-notification.service.ts` - Service จัดการเทมเพลต
- ✅ `backend/src/api/line.routes.ts` - API endpoints
- ✅ `backend/LINE_STATUS_TEMPLATES.md` - API Documentation

### Frontend
- ✅ `src/pages/LineManagement.tsx` - UI จัดการเทมเพลต
- ✅ `src/lib/api.ts` - API client functions

### Documentation
- ✅ `LINE_TEMPLATES_UPDATE.md` - เอกสารการอัพเดท (ฉบับสมบูรณ์)
- ✅ `คู่มือจัดการเทมเพลต_LINE.md` - คู่มือผู้ใช้งาน (ภาษาไทย)
- ✅ `LINE_TEMPLATES_README.md` - ไฟล์นี้

## API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/line/status-templates` | ดึงเทมเพลตทั้งหมด |
| GET | `/api/line/status-templates/:status` | ดึงเทมเพลตเฉพาะสถานะ |
| PUT | `/api/line/status-templates/:status` | อัพเดทเทมเพลต |
| POST | `/api/line/status-templates/reset` | รีเซ็ตเทมเพลต |
| POST | `/api/line/test-template` | ทดสอบส่งข้อความ |

## สถานะที่รองรับ

- `pending` - รอดำเนินการ
- `in-progress` - กำลังซ่อม
- `waiting_parts` - รออะไหล่
- `completed` - ซ่อมเสร็จแล้ว
- `cancelled` - ยกเลิกแล้ว
- `picked-up` - รับเครื่องแล้ว

## ตัวแปรที่ใช้ได้

- `{customerName}` - ชื่อลูกค้า
- `{repairNumber}` - หมายเลขงานซ่อม
- `{deviceType}` - ประเภทอุปกรณ์
- `{status}` - สถานะ
- `{additionalInfo}` - ข้อมูลเพิ่มเติม

## วิธีใช้งาน

1. เข้าสู่หน้า "จัดการ LINE Official Account"
2. เลือกแท็บ "เทมเพลต"
3. แก้ไขเทมเพลตตามต้องการ
4. บันทึก
5. ทดสอบการส่งข้อความ

## ข้อจำกัด

⚠️ **สำคัญ:** เทมเพลตเก็บใน in-memory (จะหายเมื่อรีสตาร์ท server)

**แนะนำสำหรับ Production:**
- เก็บเทมเพลตในฐานข้อมูล
- สร้าง table `line_status_templates`
- เพิ่ม version control

## เอกสารเพิ่มเติม

- 📖 [คู่มือผู้ใช้ (ภาษาไทย)](./คู่มือจัดการเทมเพลต_LINE.md)
- 📖 [การอัพเดทระบบ (ฉบับสมบูรณ์)](./LINE_TEMPLATES_UPDATE.md)
- 📖 [API Documentation](./backend/LINE_STATUS_TEMPLATES.md)

## Quick Test

```bash
# 1. ดึงเทมเพลตทั้งหมด
curl http://localhost:3001/api/line/status-templates

# 2. แก้ไขเทมเพลต
curl -X PUT http://localhost:3001/api/line/status-templates/completed \
  -H "Content-Type: application/json" \
  -d '{"template": "✅ ซ่อมเสร็จแล้ว!\n\nคุณ {customerName}\nงาน: {repairNumber}"}'

# 3. รีเซ็ตเทมเพลต
curl -X POST http://localhost:3001/api/line/status-templates/reset \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# 4. ทดสอบส่งข้อความ
curl -X POST http://localhost:3001/api/line/test-template \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1234567890abcdef",
    "status": "completed",
    "customerName": "สมชาย",
    "repairNumber": "RP-001",
    "deviceType": "iPhone"
  }'
```

---

**Date:** 2026-02-15  
**Version:** 1.0.0  
**Status:** ✅ Ready to use
