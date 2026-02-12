/**
 * ข้อมูลอะไหล่ร่วม (parts table) — ใช้ใน RepairNew และอ้างอิงจาก Inventory
 * เมื่อมี API จริงสามารถเปลี่ยนเป็น fetch ได้
 */
export interface Part {
  id: string;
  name: string;
  nameTh: string;
  category: string;
  categoryTh: string;
  stock: number;
  minStock: number;
  cost: number;
  sellPrice: number;
}

/** สถานะสต็อกสำหรับหน้าแจ้งซ่อม: เขียว > 5, เหลือง 1–5, แดง = 0 */
export type PartStockStatus = "high" | "low" | "out";

export function getPartStockStatus(stock: number): PartStockStatus {
  if (stock === 0) return "out";
  if (stock <= 5) return "low";
  return "high";
}

/** รายการอะไหล่จาก "parts table" — แหล่งเดียวสำหรับ RepairNew */
export const partsList: Part[] = [
  {
    id: "PART-001",
    name: "iPhone 14 Pro Screen",
    nameTh: "หน้าจอ iPhone 14 Pro",
    category: "Screens",
    categoryTh: "หน้าจอ",
    stock: 2,
    minStock: 5,
    cost: 3500,
    sellPrice: 4500,
  },
  {
    id: "PART-002",
    name: "iPhone 14 Battery",
    nameTh: "แบตเตอรี่ iPhone 14",
    category: "Batteries",
    categoryTh: "แบตเตอรี่",
    stock: 15,
    minStock: 10,
    cost: 800,
    sellPrice: 1200,
  },
  {
    id: "PART-003",
    name: "Samsung S23 Screen",
    nameTh: "หน้าจอ Samsung S23",
    category: "Screens",
    categoryTh: "หน้าจอ",
    stock: 5,
    minStock: 5,
    cost: 4200,
    sellPrice: 5500,
  },
  {
    id: "PART-004",
    name: "Samsung S23 Battery",
    nameTh: "แบตเตอรี่ Samsung S23",
    category: "Batteries",
    categoryTh: "แบตเตอรี่",
    stock: 3,
    minStock: 5,
    cost: 700,
    sellPrice: 1100,
  },
  {
    id: "PART-005",
    name: "USB-C Charging Port",
    nameTh: "พอร์ตชาร์จ USB-C",
    category: "Ports",
    categoryTh: "พอร์ต",
    stock: 8,
    minStock: 10,
    cost: 150,
    sellPrice: 350,
  },
  {
    id: "PART-006",
    name: "iPhone 13 Back Glass",
    nameTh: "กระจกหลัง iPhone 13",
    category: "Glass",
    categoryTh: "กระจก",
    stock: 12,
    minStock: 8,
    cost: 600,
    sellPrice: 950,
  },
  {
    id: "PART-007",
    name: "Pixel 7 Screen",
    nameTh: "หน้าจอ Pixel 7",
    category: "Screens",
    categoryTh: "หน้าจอ",
    stock: 6,
    minStock: 5,
    cost: 3200,
    sellPrice: 4200,
  },
  {
    id: "PART-008",
    name: "Lightning Charging Port",
    nameTh: "พอร์ตชาร์จ Lightning",
    category: "Ports",
    categoryTh: "พอร์ต",
    stock: 20,
    minStock: 15,
    cost: 180,
    sellPrice: 400,
  },
];
