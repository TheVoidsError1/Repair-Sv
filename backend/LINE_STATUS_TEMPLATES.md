# LINE Status Templates API Documentation

## คำอธิบาย
ระบบจัดการเทมเพลตข้อความสถานะการซ่อมสำหรับการแจ้งเตือนผ่าน LINE Official Account

## ตัวแปรที่ใช้ได้ในเทมเพลต

เทมเพลตสามารถใช้ตัวแปรเหล่านี้ได้:
- `{customerName}` - ชื่อลูกค้า
- `{repairNumber}` - หมายเลขงานซ่อม
- `{deviceType}` - ประเภทอุปกรณ์
- `{status}` - สถานะปัจจุบัน
- `{additionalInfo}` - ข้อมูลเพิ่มเติม (ถ้ามี จะแสดงเป็น "หมายเหตุ: ...")

## สถานะที่รองรับ

1. **pending** - รอดำเนินการ
2. **in-progress** - กำลังซ่อม
3. **waiting_parts** - รออะไหล่
4. **completed** - ซ่อมเสร็จแล้ว
5. **cancelled** - ยกเลิกแล้ว
6. **picked-up** - รับเครื่องแล้ว

---

## API Endpoints

### 1. ดึงเทมเพลตทั้งหมด
**GET** `/api/line/status-templates`

ดึงเทมเพลตข้อความสถานะทั้งหมด

#### Response
```json
{
  "status": "success",
  "data": {
    "pending": {
      "status": "pending",
      "template": "🔔 แจ้งเตือน: งานซ่อมของคุณกำลังรอดำเนินการ\n\n...",
      "description": "ข้อความเมื่อสถานะเป็นรอดำเนินการ"
    },
    "in-progress": {
      "status": "in-progress",
      "template": "🔧 แจ้งเตือน: เริ่มซ่อมแล้ว!\n\n...",
      "description": "ข้อความเมื่อสถานะเป็นกำลังซ่อม"
    },
    ...
  },
  "message": "ดึงเทมเพลตสำเร็จ"
}
```

#### ตัวอย่างการใช้งาน
```bash
curl http://localhost:3000/api/line/status-templates
```

---

### 2. ดึงเทมเพลตเฉพาะสถานะ
**GET** `/api/line/status-templates/:status`

ดึงเทมเพลตข้อความของสถานะที่ระบุ

#### Parameters
- `status` (path) - สถานะที่ต้องการดึง (pending, in-progress, waiting_parts, completed, cancelled, picked-up)

#### Response
```json
{
  "status": "success",
  "data": {
    "status": "completed",
    "template": "✅ แจ้งเตือน: ซ่อมเสร็จแล้ว!\n\n...",
    "description": "ข้อความเมื่อสถานะเป็นซ่อมเสร็จแล้ว"
  },
  "message": "ดึงเทมเพลตสำเร็จ"
}
```

#### ตัวอย่างการใช้งาน
```bash
curl http://localhost:3000/api/line/status-templates/completed
```

---

### 3. แก้ไขเทมเพลต
**PUT** `/api/line/status-templates/:status`

อัพเดทเทมเพลตข้อความของสถานะที่ระบุ

#### Parameters
- `status` (path) - สถานะที่ต้องการแก้ไข

#### Request Body
```json
{
  "template": "✅ แจ้งเตือนใหม่: ซ่อมเสร็จแล้ว!\n\nสวัสดีคุณ {customerName}\nหมายเลขงานซ่อม: {repairNumber}\nอุปกรณ์: {deviceType}\n\nงานซ่อมเสร็จสมบูรณ์แล้วค่ะ ✨\n{additionalInfo}"
}
```

#### Response
```json
{
  "status": "success",
  "message": "อัพเดทเทมเพลตสำเร็จ",
  "data": {
    "status": "completed",
    "template": "✅ แจ้งเตือนใหม่: ซ่อมเสร็จแล้ว!\n\n..."
  }
}
```

#### ตัวอย่างการใช้งาน
```bash
curl -X PUT http://localhost:3000/api/line/status-templates/completed \
  -H "Content-Type: application/json" \
  -d '{
    "template": "✅ แจ้งเตือนใหม่: ซ่อมเสร็จแล้ว!\n\nสวัสดีคุณ {customerName}\nหมายเลขงานซ่อม: {repairNumber}\nอุปกรณ์: {deviceType}\n\nงานซ่อมเสร็จสมบูรณ์แล้วค่ะ ✨\n{additionalInfo}"
  }'
```

---

### 4. รีเซ็ตเทมเพลต
**POST** `/api/line/status-templates/reset`

รีเซ็ตเทมเพลตกลับไปใช้ค่าเริ่มต้น

#### Request Body
```json
{
  "status": "completed"  // ถ้าไม่ระบุจะรีเซ็ตทั้งหมด
}
```

หรือ

```json
{}  // รีเซ็ตทั้งหมด
```

#### Response
```json
{
  "status": "success",
  "message": "รีเซ็ตเทมเพลตสำหรับสถานะ completed สำเร็จ",
  "data": {
    "resetStatus": "completed"
  }
}
```

#### ตัวอย่างการใช้งาน
```bash
# รีเซ็ตเฉพาะสถานะ completed
curl -X POST http://localhost:3000/api/line/status-templates/reset \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# รีเซ็ตทั้งหมด
curl -X POST http://localhost:3000/api/line/status-templates/reset \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 5. ทดสอบการส่งข้อความด้วยเทมเพลต
**POST** `/api/line/test-template`

ทดสอบส่งข้อความด้วยเทมเพลตที่กำหนด

#### Request Body
```json
{
  "userId": "U1234567890abcdef1234567890abcdef",
  "status": "completed",
  "customerName": "สมชาย ใจดี",
  "repairNumber": "RP-2024-0001",
  "deviceType": "iPhone 13 Pro",
  "additionalInfo": "ตรวจสอบทุกอย่างเรียบร้อยแล้ว"
}
```

#### Response
```json
{
  "status": "success",
  "message": "ส่งข้อความทดสอบสำเร็จ",
  "data": {
    "userId": "U1234567890abcdef1234567890abcdef",
    "status": "completed",
    "previewMessage": "✅ แจ้งเตือน: ซ่อมเสร็จแล้ว!\n\nสวัสดีคุณ สมชาย ใจดี\nหมายเลขงานซ่อม: RP-2024-0001\nอุปกรณ์: iPhone 13 Pro\nสถานะ: ซ่อมเสร็จแล้ว ✨\n\nอุปกรณ์ของคุณซ่อมเสร็จเรียบร้อยแล้ว พร้อมรับได้ตลอดเวลา!\nหมายเหตุ: ตรวจสอบทุกอย่างเรียบร้อยแล้ว\n"
  }
}
```

#### ตัวอย่างการใช้งาน
```bash
curl -X POST http://localhost:3000/api/line/test-template \
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

## เทมเพลตเริ่มต้น

### Pending (รอดำเนินการ)
```
🔔 แจ้งเตือน: งานซ่อมของคุณกำลังรอดำเนินการ

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: รอดำเนินการ

เราได้รับงานซ่อมของคุณเรียบร้อยแล้ว และจะเริ่มดำเนินการในไม่ช้า
```

### In-Progress (กำลังซ่อม)
```
🔧 แจ้งเตือน: เริ่มซ่อมแล้ว!

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: กำลังซ่อม

ช่างของเรากำลังดำเนินการซ่อมอุปกรณ์ของคุณอยู่
{additionalInfo}
```

### Waiting Parts (รออะไหล่)
```
⏳ แจ้งเตือน: รออะไหล่

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: รออะไหล่

งานซ่อมของคุณอยู่ระหว่างรออะไหล่ เราจะแจ้งให้ทราบเมื่อได้รับอะไหล่แล้ว
```

### Completed (ซ่อมเสร็จแล้ว)
```
✅ แจ้งเตือน: ซ่อมเสร็จแล้ว!

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: ซ่อมเสร็จแล้ว ✨

อุปกรณ์ของคุณซ่อมเสร็จเรียบร้อยแล้ว พร้อมรับได้ตลอดเวลา!
{additionalInfo}
```

### Cancelled (ยกเลิกแล้ว)
```
❌ แจ้งเตือน: ยกเลิกงานซ่อม

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: ยกเลิกแล้ว

{additionalInfo}หากมีข้อสงสัย กรุณาติดต่อเรา
```

### Picked-up (รับเครื่องแล้ว)
```
📦 แจ้งเตือน: รับเครื่องแล้ว

สวัสดีคุณ {customerName}
หมายเลขงานซ่อม: {repairNumber}
อุปกรณ์: {deviceType}
สถานะ: รับเครื่องแล้ว

ขอบคุณที่ใช้บริการของเรา 🙏
หากมีปัญหาใด ๆ กรุณาติดต่อเราได้ทันที
```

---

## ข้อควรระวัง

1. **การเก็บข้อมูล**: เทมเพลตที่แก้ไขจะถูกเก็บใน memory (in-memory) ดังนั้นจะหายเมื่อรีสตาร์ท server
2. **ตัวแปร**: อย่าลืมใส่ตัวแปร `{customerName}`, `{repairNumber}`, `{deviceType}` ในเทมเพลตเพื่อแสดงข้อมูลที่ถูกต้อง
3. **additionalInfo**: ตัวแปร `{additionalInfo}` จะแสดงเป็น "หมายเหตุ: ..." เมื่อมีข้อมูล หรือว่างเปล่าเมื่อไม่มีข้อมูล
4. **ความยาวข้อความ**: LINE มีข้อจำกัดความยาวข้อความที่ 5,000 ตัวอักษร
5. **Emoji**: สามารถใช้ emoji ในเทมเพลตได้ตามปกติ

---

## ตัวอย่างการใช้งานในระบบจริง

เมื่อมีการเปลี่ยนสถานะงานซ่อมในระบบ จะมีการเรียกฟังก์ชัน `notifyRepairStatusChange` ที่จะ:
1. ดึงเทมเพลตที่เหมาะสมตามสถานะ
2. แทนที่ตัวแปรด้วยข้อมูลจริง
3. ส่งข้อความผ่าน LINE API

```typescript
// ตัวอย่างการใช้งานใน repair.routes.ts
const lineService = getLineNotificationService();
if (lineService && customer.lineIdRes) {
  await lineService.notifyRepairStatusChange(
    customer.lineIdRes,
    customerName,
    repair.repairNumber,
    'completed',
    repair.deviceType,
    'ตรวจสอบทุกอย่างเรียบร้อยแล้ว'
  );
}
```

---

## การปรับแต่งเทมเพลตผ่าน Frontend

คุณสามารถสร้างหน้าจัดการเทมเพลตใน Frontend ที่มีฟีเจอร์:
- แสดงรายการเทมเพลตทั้งหมด
- แก้ไขเทมเพลตด้วย textarea
- ดูตัวอย่างข้อความที่จะส่ง (preview)
- ทดสอบส่งข้อความ
- รีเซ็ตกลับค่าเริ่มต้น

---

## Error Codes

- `400` - Bad Request (ข้อมูลไม่ครบหรือผิดรูปแบบ)
- `404` - Not Found (ไม่พบเทมเพลตหรือสถานะที่ระบุ)
- `500` - Internal Server Error (เกิดข้อผิดพลาดในระบบ)
