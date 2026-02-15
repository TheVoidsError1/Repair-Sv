# การอัพเดทระบบจัดการเทมเพลตข้อความ LINE

## สรุปการอัพเดท

เพิ่มฟีเจอร์การจัดการเทมเพลตข้อความสถานะการซ่อมสำหรับการแจ้งเตือนผ่าน LINE Official Account โดยผู้ใช้สามารถแก้ไขข้อความได้เองผ่าน UI

---

## ไฟล์ที่มีการเปลี่ยนแปลง

### Backend

#### 1. `backend/src/services/line-notification.service.ts`
**การเปลี่ยนแปลง:**
- เพิ่ม interface `StatusTemplate` สำหรับจัดการเทมเพลต
- สร้างค่าเริ่มต้นของเทมเพลตทั้งหมด (`DEFAULT_STATUS_TEMPLATES`)
- เพิ่ม `customStatusTemplates` สำหรับเก็บเทมเพลตที่แก้ไข (in-memory)
- ปรับปรุง `createRepairStatusMessage()` ให้ใช้เทมเพลตแบบ dynamic
- เพิ่มฟังก์ชัน static methods:
  - `getAllTemplates()` - ดึงเทมเพลตทั้งหมด
  - `getTemplate(status)` - ดึงเทมเพลตเฉพาะสถานะ
  - `updateTemplate(status, template)` - อัพเดทเทมเพลต
  - `resetTemplate(status?)` - รีเซ็ตเทมเพลต

**ตัวแปรที่ใช้ได้ในเทมเพลต:**
- `{customerName}` - ชื่อลูกค้า
- `{repairNumber}` - หมายเลขงานซ่อม
- `{deviceType}` - ประเภทอุปกรณ์
- `{status}` - สถานะปัจจุบัน
- `{additionalInfo}` - ข้อมูลเพิ่มเติม

#### 2. `backend/src/api/line.routes.ts`
**การเปลี่ยนแปลง:**
- เพิ่ม import `LineNotificationService` class
- เพิ่ม API endpoints ใหม่:

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/line/status-templates` | ดึงเทมเพลตทั้งหมด |
| GET | `/api/line/status-templates/:status` | ดึงเทมเพลตเฉพาะสถานะ |
| PUT | `/api/line/status-templates/:status` | อัพเดทเทมเพลต |
| POST | `/api/line/status-templates/reset` | รีเซ็ตเทมเพลต |
| POST | `/api/line/test-template` | ทดสอบส่งข้อความด้วยเทมเพลต |

#### 3. `backend/LINE_STATUS_TEMPLATES.md` (ไฟล์ใหม่)
**เนื้อหา:**
- เอกสารคู่มือการใช้งาน API
- ตัวอย่างการใช้งาน (curl commands)
- เทมเพลตเริ่มต้นทั้งหมด
- คำแนะนำและข้อควรระวัง

---

### Frontend

#### 4. `src/pages/LineManagement.tsx`
**การเปลี่ยนแปลง:**
- เพิ่ม icons: `FileText`, `Edit`, `RotateCcw`, `Eye`
- เพิ่ม interface `StatusTemplate`
- เพิ่ม state variables:
  - `templates` - เก็บเทมเพลตทั้งหมด
  - `loadingTemplates` - สถานะการโหลด
  - `editingTemplate` - สถานะกำลังแก้ไข
  - `editedTemplateText` - ข้อความที่กำลังแก้ไข
  - `showPreview` - แสดง/ซ่อน dialog ตัวอย่าง
  - `previewStatus` - สถานะที่กำลังดูตัวอย่าง

- เพิ่มฟังก์ชัน:
  - `loadTemplates()` - โหลดเทมเพลตทั้งหมด
  - `handleEditTemplate(status)` - เริ่มแก้ไขเทมเพลต
  - `handleSaveTemplate(status)` - บันทึกเทมเพลต
  - `handleResetTemplate(status?)` - รีเซ็ตเทมเพลต
  - `handlePreviewTemplate(status)` - ดูตัวอย่าง
  - `getPreviewMessage(status)` - สร้างข้อความตัวอย่าง
  - `getStatusLabel(status)` - แปลชื่อสถานะเป็นไทย

- เพิ่มแท็บ "เทมเพลต" (Templates Tab):
  - แสดงรายการเทมเพลตทั้งหมด
  - ปุ่ม "แก้ไข" สำหรับแต่ละสถานะ
  - ปุ่ม "ดูตัวอย่าง" แสดงข้อความตัวอย่าง
  - ปุ่ม "รีเซ็ต" สำหรับแต่ละสถานะ
  - ปุ่ม "รีเซ็ตทั้งหมด" ด้านบน
  - แสดงตัวแปรที่สามารถใช้ได้

- เพิ่ม Dialog "ดูตัวอย่างเทมเพลต":
  - แสดงข้อความตัวอย่างพร้อมข้อมูลจำลอง
  - ปุ่มปิด

#### 5. `src/lib/api.ts`
**การเปลี่ยนแปลง:**
- เพิ่มฟังก์ชัน API ใหม่:
  - `getLineStatusTemplates()` - ดึงเทมเพลตทั้งหมด
  - `getLineStatusTemplate(status)` - ดึงเทมเพลตเฉพาะสถานะ
  - `updateLineStatusTemplate(status, template)` - อัพเดทเทมเพลต
  - `resetLineStatusTemplate(status?)` - รีเซ็ตเทมเพลต
  - `testLineTemplate(...)` - ทดสอบส่งข้อความด้วยเทมเพลต

---

## วิธีใช้งาน

### 1. เข้าสู่หน้าจัดการ LINE
ไปที่เมนู **"จัดการ LINE Official Account"** ในระบบ

### 2. เลือกแท็บ "เทมเพลต"
คลิกที่แท็บ **"เทมเพลต"** (Templates)

### 3. แก้ไขเทมเพลต
1. คลิกปุ่ม **"แก้ไข"** ที่สถานะที่ต้องการ
2. แก้ไขข้อความในกล่องข้อความ
3. สามารถใช้ตัวแปร: `{customerName}`, `{repairNumber}`, `{deviceType}`, `{status}`, `{additionalInfo}`
4. คลิก **"บันทึก"** เมื่อแก้ไขเสร็จ

### 4. ดูตัวอย่าง
คลิกปุ่ม **"ดูตัวอย่าง"** เพื่อดูข้อความที่จะส่งไปหาลูกค้า (ใช้ข้อมูลตัวอย่าง)

### 5. รีเซ็ตกลับค่าเริ่มต้น
- คลิกปุ่ม **🔄** ข้างแต่ละสถานะเพื่อรีเซ็ตเฉพาะสถานะนั้น
- คลิก **"รีเซ็ตทั้งหมด"** ด้านบนเพื่อรีเซ็ตทุกสถานะ

---

## สถานะที่รองรับ

| สถานะ | Key | คำอธิบาย |
|-------|-----|----------|
| 🔔 รอดำเนินการ | `pending` | เมื่อรับงานซ่อมเข้าระบบ |
| 🔧 กำลังซ่อม | `in-progress` | เมื่อเริ่มดำเนินการซ่อม |
| ⏳ รออะไหล่ | `waiting_parts` | เมื่อต้องรออะไหล่ |
| ✅ ซ่อมเสร็จแล้ว | `completed` | เมื่อซ่อมเสร็จพร้อมรับ |
| ❌ ยกเลิกแล้ว | `cancelled` | เมื่อยกเลิกงานซ่อม |
| 📦 รับเครื่องแล้ว | `picked-up` | เมื่อลูกค้ารับเครื่องแล้ว |

---

## ตัวอย่างเทมเพลต

### Before (Hard-coded)
```typescript
const statusMessages: Record<string, string> = {
  'completed': `✅ แจ้งเตือน: ซ่อมเสร็จแล้ว!\n\n` +
    `สวัสดีคุณ ${customerName}\n` +
    `หมายเลขงานซ่อม: ${repairNumber}\n` +
    // ... ข้อความเพิ่มเติม
};
```

### After (Dynamic Template)
```typescript
// เทมเพลตเก็บในระบบ สามารถแก้ไขผ่าน UI ได้
const template = customStatusTemplates[status] || DEFAULT_STATUS_TEMPLATES[status]?.template;

// แทนที่ตัวแปร
let message = template
  .replace(/{customerName}/g, customerName)
  .replace(/{repairNumber}/g, repairNumber)
  // ... ตัวแปรอื่นๆ
```

---

## ข้อจำกัดและข้อควรระวัง

### 1. การเก็บข้อมูล
⚠️ **สำคัญ:** เทมเพลตที่แก้ไขจะถูกเก็บใน **in-memory** (RAM) ของ server

**ผลกระทบ:**
- เมื่อรีสตาร์ท backend server เทมเพลตจะกลับไปใช้ค่าเริ่มต้น
- เหมาะสำหรับ development และ testing

**แนะนำสำหรับ Production:**
- บันทึกเทมเพลตลงในฐานข้อมูล (เช่น PostgreSQL, MongoDB)
- สร้าง table `line_status_templates` หรือ collection
- เก็บ `status`, `template`, `updatedAt`, `updatedBy`

### 2. ความยาวข้อความ
- LINE มีข้อจำกัดความยาวข้อความที่ **5,000 ตัวอักษร**
- หากข้อความยาวเกินไป จะไม่สามารถส่งได้

### 3. ตัวแปร
- อย่าลืมใส่ตัวแปร `{customerName}`, `{repairNumber}`, `{deviceType}` ในเทมเพลต
- ตัวแปรที่ไม่มีค่าจะถูกแทนที่ด้วยข้อความว่างเปล่า

### 4. Emoji
- สามารถใช้ emoji ในเทมเพลตได้ตามปกติ
- LINE รองรับ emoji ทุกประเภท

---

## การทดสอบ

### 1. ทดสอบผ่าน UI
1. ไปที่แท็บ "เทมเพลต"
2. แก้ไขเทมเพลตที่ต้องการ
3. ไปที่แท็บ "ทดสอบ"
4. ใช้ API endpoint `/api/line/test-template` เพื่อส่งข้อความทดสอบ

### 2. ทดสอบผ่าน API
```bash
curl -X POST http://localhost:3001/api/line/test-template \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1234567890abcdef1234567890abcdef",
    "status": "completed",
    "customerName": "สมชาย ใจดี",
    "repairNumber": "RP-2024-0001",
    "deviceType": "iPhone 13 Pro",
    "additionalInfo": "ตรวจสอบทุกอย่างเรียบร้อยแล้ว"
  }'
```

---

## API Reference

### GET /api/line/status-templates
ดึงเทมเพลตทั้งหมด

**Response:**
```json
{
  "status": "success",
  "data": {
    "pending": {
      "status": "pending",
      "template": "🔔 แจ้งเตือน...",
      "description": "ข้อความเมื่อสถานะเป็นรอดำเนินการ"
    },
    ...
  }
}
```

### GET /api/line/status-templates/:status
ดึงเทมเพลตเฉพาะสถานะ

**Parameters:**
- `status` - สถานะที่ต้องการ (pending, in-progress, waiting_parts, completed, cancelled, picked-up)

### PUT /api/line/status-templates/:status
อัพเดทเทมเพลต

**Request Body:**
```json
{
  "template": "✅ ข้อความใหม่..."
}
```

### POST /api/line/status-templates/reset
รีเซ็ตเทมเพลต

**Request Body:**
```json
{
  "status": "completed"  // ถ้าไม่ระบุจะรีเซ็ตทั้งหมด
}
```

---

## Roadmap (Future Improvements)

### Phase 2: Database Integration
- [ ] สร้าง entity `LineStatusTemplate`
- [ ] เก็บเทมเพลตในฐานข้อมูล
- [ ] เพิ่ม `createdAt`, `updatedAt`, `updatedBy`
- [ ] Version control สำหรับเทมเพลต

### Phase 3: Advanced Features
- [ ] เพิ่มตัวแปรเพิ่มเติม (เช่น `{storeName}`, `{storePhone}`)
- [ ] รองรับหลายภาษา (ไทย/อังกฤษ)
- [ ] เทมเพลตแบบ Rich Message (Flex Message)
- [ ] ตัวอย่างข้อความแบบ real-time preview
- [ ] Import/Export เทมเพลต (JSON)
- [ ] Template history และ rollback

### Phase 4: Analytics
- [ ] ติดตามการส่งข้อความ
- [ ] วิเคราะห์ open rate และ response rate
- [ ] A/B testing สำหรับเทมเพลต

---

## การติดตั้งและใช้งาน

### ขั้นตอนการติดตั้ง
1. Pull code ล่าสุดจาก repository
2. รัน `npm install` ใน folder `backend` (ถ้าจำเป็น)
3. รัน `npm install` ใน folder root (frontend)
4. รีสตาร์ท backend server: `cd backend && npm run dev`
5. รีสตาร์ท frontend: `npm run dev`
6. เข้าสู่ระบบและไปที่หน้า "จัดการ LINE Official Account"
7. ลองแก้ไขเทมเพลตและทดสอบการส่งข้อความ

### การใช้งาน
1. เลือกแท็บ "เทมเพลต"
2. แก้ไขเทมเพลตตามต้องการ
3. บันทึก
4. ทดสอบการส่งข้อความ
5. ตรวจสอบใน LINE ของลูกค้า

---

## ปัญหาที่อาจพบและวิธีแก้ไข

### 1. เทมเพลตหายหลังรีสตาร์ท server
**สาเหตุ:** เก็บข้อมูลใน memory  
**วิธีแก้:** อัพเกรดเป็น database storage (Phase 2)

### 2. ข้อความไม่แสดงตัวแปร
**สาเหตุ:** ลืมใส่ตัวแปรในเทมเพลต  
**วิธีแก้:** ตรวจสอบว่าใส่ `{customerName}`, `{repairNumber}` ฯลฯ แล้ว

### 3. ข้อความส่งไม่ได้
**สาเหตุ:** ข้อความยาวเกิน 5,000 ตัวอักษร  
**วิธีแก้:** ลดความยาวของเทมเพลต

---

## Credits

- **Developer:** [Your Name]
- **Date:** February 15, 2026
- **Version:** 1.0.0

---

## License

Copyright © 2026 Repair Hub Pro. All rights reserved.
