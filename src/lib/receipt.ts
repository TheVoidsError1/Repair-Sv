/**
 * Logic สำหรับใบเสร็จรับเงิน
 * อ้างอิงรูปแบบและข้อมูลจากใบเสร็จรับเงินต้นแบบ 100%
 * แมปจากบิลรับแจ้งซ่อม (RepairOrderData) ไม่สร้างข้อมูลใหม่
 */

export interface ReceiptShopInfo {
  name: string;
  address: string;
  phone: string;
}

export interface ReceiptLineItem {
  /** รหัสสินค้า / ITEM CODE (ว่างได้ถ้าไม่มีในระบบ) */
  itemCode: string;
  /** รายการ / DESCRIPTION */
  description: string;
  /** จำนวน / QUANTITY */
  quantity: number;
  /** ราคาต่อหน่วย / UNIT PRICE */
  unitPrice: number;
  /** จำนวนเงิน / AMOUNT */
  amount: number;
}

export interface ReceiptData {
  /** ส่วนหัว */
  shop: ReceiptShopInfo;
  /** เลขที่บิล (เช่น No80, REP-001) */
  receiptNo: string;
  /** วันที่ออกบิล (พ.ศ. เช่น 09/02/2569) */
  issueDate: string;
  /** ชื่อลูกค้า */
  customerName: string;
  /** เลขประจำตัว (ID No.) */
  customerId: string;
  /** ที่อยู่ลูกค้า */
  customerAddress: string;
  /** เบอร์โทร (ใช้ในระบบ ถ้าใบเสร็จต้นแบบไม่แสดงก็ไม่บังคับ) */
  customerPhone: string;
  /** ใบสั่งซื้อเลขที่ (PURCHASE ORDER NO.) */
  purchaseOrderNo: string;
  /** ใบส่งของ/ใบแจ้งหนี้ (DELIVER ORDER NO.) */
  deliverOrderNo: string;
  /** ชื่อพนักงาน หรือว่างไว้เป็นช่องเซ็นชื่อพนักงาน */
  salesmanCode: string;
  /** รายการซ่อม */
  items: ReceiptLineItem[];
  /** รวมเงิน */
  subtotal: number;
  /** VAT (ว่างได้) */
  vat: number | null;
  /** จำนวนเงินทั้งสิ้น */
  grandTotal: number;
  /** ท้ายเอกสาร เช่น "ลูกค้า (FOR CUSTOMER)" */
  copyLabel?: string;
}

function parsePrice(value: string): number {
  if (!value || value.trim() === "") return 0;
  const num = parseFloat(String(value).replace(/,/g, "").trim());
  return Number.isNaN(num) ? 0 : num;
}

/**
 * แมปจากบิลรับแจ้งซ่อม → ข้อมูลใบเสร็จรับเงิน
 * ใช้ข้อมูลจาก RepairOrderData + options สำหรับฟิลด์ที่อาจมาจากระบบอื่น
 */
export function mapRepairOrderToReceiptData(
  data: {
    customer: string;
    phone: string;
    problemSymptoms: string;
    repairSummaryPrice: string;
    estimatedPrice?: string;
    dateOfReport?: string;
    model?: string;
    selectedPartId?: string;
  },
  options: {
    receiptNo?: string;
    issueDate?: string;
    customerAddress?: string;
    customerId?: string;
    purchaseOrderNo?: string;
    deliverOrderNo?: string;
    salesmanCode?: string;
    copyLabel?: string;
    selectedPart?: {
      partNumber?: string;
      name?: string;
      nameTh?: string;
      price?: number;
    } | null;
    selectedParts?: Array<{
      partNumber?: string;
      name?: string;
      nameTh?: string;
      price?: number;
    }>;
  } = {}
): ReceiptData {
  const receiptNo = options.receiptNo ?? "—";
  const issueDate = options.issueDate ?? data.dateOfReport ?? "—";
  
  // ถ้ามี selectedParts (array) ให้สร้างรายการสำหรับแต่ละ part
  let items: ReceiptLineItem[] = [];
  let subtotal = 0;

  if (options.selectedParts && options.selectedParts.length > 0) {
    // สร้างรายการสำหรับแต่ละ part
    items = options.selectedParts.map((part) => {
      // แปลงราคาให้เป็น number เสมอ (เผื่อ backend ส่งมาเป็น string จาก decimal)
      const partPrice = part.price != null ? parseFloat(String(part.price)) : 0;
      subtotal += partPrice;
      return {
        itemCode: part.partNumber || "",
        description: part.nameTh || part.name || "รายการซ่อม",
        quantity: 1,
        unitPrice: partPrice,
        amount: partPrice,
      };
    });
  } else if (options.selectedPart) {
    // รองรับ backward compatibility: ถ้ามี selectedPart เดียว
    const partPrice =
      options.selectedPart.price != null
        ? parseFloat(String(options.selectedPart.price))
        : parsePrice(data.repairSummaryPrice || data.estimatedPrice || "0");
    subtotal = partPrice;
    items = [
      {
        itemCode: options.selectedPart.partNumber || "",
        description: options.selectedPart.nameTh || options.selectedPart.name || "รายการซ่อม",
        quantity: 1,
        unitPrice: partPrice,
        amount: partPrice,
      },
    ];
  } else {
    // ถ้าไม่มี part ให้ใช้ราคารวมจาก repairSummaryPrice
    const price = parsePrice(data.repairSummaryPrice || data.estimatedPrice || "0");
    subtotal = price;
    items = [
      {
        itemCode: "",
        description: data.problemSymptoms?.trim() || (data.model ? `ซ่อม${data.model}` : "รายการซ่อม"),
        quantity: 1,
        unitPrice: price,
        amount: price,
      },
    ];
  }

  // คำนวณ VAT 7%
  const vat = Math.round((subtotal * 0.07) * 100) / 100; // ปัดเป็น 2 ทศนิยม
  const grandTotal = subtotal + vat;

  return {
    shop: {
      name: "Macfix Service",
      address: "ตรงข้าม รพ.ทักษิณ ต.ตลาด อ.เมือง จ.สุราษฎร์ธานี",
      phone: "โทร. 084-615-2244",
    },
    receiptNo,
    issueDate,
    customerName: data.customer || "—",
    customerId: options.customerId ?? "",
    customerAddress: options.customerAddress ?? "",
    customerPhone: data.phone || "",
    purchaseOrderNo: options.purchaseOrderNo ?? "",
    deliverOrderNo: options.deliverOrderNo ?? "",
    salesmanCode: options.salesmanCode ?? "",
    items,
    subtotal,
    vat,
    grandTotal,
    copyLabel: options.copyLabel,
  };
}

export function formatReceiptNumber(n: number): string {
  // ป้องกันค่า NaN / Infinity
  if (typeof n !== "number" || !isFinite(n)) return "0.00";

  // แสดงทศนิยม 2 ตำแหน่งแบบอ่านง่าย
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
