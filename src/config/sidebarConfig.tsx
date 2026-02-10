import {
  BarChart3,
  DollarSign,
  FileText,
  LayoutDashboard,
  List,
  Package,
  PlusCircle,
  Settings,
  ShieldCheck,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** รายการเมนูย่อยใน 1 section */
export interface SidebarMenuItem {
  id: string;
  href: string;
  labelTh: string;
  labelEn: string;
  icon: LucideIcon;
  /** query ที่ต้องตรง (เช่น status=in-progress) เพื่อถือว่า active */
  matchQuery?: Record<string, string>;
}

/** 1 section ใน Context Sidebar (เช่น MAIN, ADDING) */
export interface SidebarMenuSection {
  id: string;
  labelTh: string;
  labelEn: string;
  items: SidebarMenuItem[];
}

/** หมวดหลัก (Subject) */
export interface SidebarSubjectConfig {
  id: string;
  titleTh: string;
  titleEn: string;
  /** path หลักของหมวด (ใช้เช็ค active และ navigate) */
  basePath: string;
  icon: LucideIcon;
  iconBg: string;
  /** เมนูย่อยแบ่งเป็น section; ถ้าไม่มี = หมวดไม่มีเมนูย่อย (เช่น แดชบอร์ด) */
  sections: SidebarMenuSection[];
}

/** โครงสร้าง config ทั้งหมด — render จาก config ไม่ hardcode */
export const SUBJECTS_CONFIG: Record<string, SidebarSubjectConfig> = {
  dashboard: {
    id: "dashboard",
    titleTh: "แดชบอร์ด",
    titleEn: "Dashboard",
    basePath: "/dashboard",
    icon: LayoutDashboard,
    iconBg: "bg-violet-500/20 text-violet-400",
    sections: [
      {
        id: "main",
        labelTh: "หลัก",
        labelEn: "Main",
        items: [
          {
            id: "overview",
            href: "/dashboard",
            labelTh: "ภาพรวม",
            labelEn: "Overview",
            icon: BarChart3,
          },
        ],
      },
    ],
  },
  repair: {
    id: "repair",
    titleTh: "งานซ่อม",
    titleEn: "Repairs",
    basePath: "/repairs",
    icon: Wrench,
    iconBg: "bg-blue-500/20 text-blue-400",
    sections: [
      {
        id: "repair-menu",
        labelTh: "เมนู",
        labelEn: "Menu",
        items: [
          {
            id: "add-in-store",
            href: "/repairs/new?type=in-store",
            labelTh: "รับซ่อมหน้าร้าน",
            labelEn: "Walk-in repair",
            icon: Store,
            matchQuery: { type: "in-store" },
          },
          {
            id: "add-leave-device",
            href: "/repairs/new?type=leave-device",
            labelTh: "รับซ่อมฝากเครื่อง",
            labelEn: "Drop-off repair",
            icon: Package,
            matchQuery: { type: "leave-device" },
          },
          {
            id: "status",
            href: "/repairs",
            labelTh: "สถานะงานซ่อม",
            labelEn: "Repair status",
            icon: List,
          },
          {
            id: "bill",
            href: "/repairs/bill",
            labelTh: "ออกบิล",
            labelEn: "Issue bill",
            icon: FileText,
          },
        ],
      },
    ],
  },
  inventory: {
    id: "inventory",
    titleTh: "สินค้าคงคลัง",
    titleEn: "Inventory",
    basePath: "/inventory",
    icon: Package,
    iconBg: "bg-teal-500/20 text-teal-400",
    sections: [
      {
        id: "main",
        labelTh: "หลัก",
        labelEn: "Main",
        items: [
          {
            id: "list",
            href: "/inventory",
            labelTh: "รายการสินค้า",
            labelEn: "Stock list",
            icon: Package,
          },
        ],
      },
      {
        id: "adding",
        labelTh: "เพิ่ม",
        labelEn: "Adding",
        items: [
          {
            id: "add-stock",
            href: "/inventory?add=1",
            labelTh: "เพิ่มสินค้า",
            labelEn: "Add item",
            icon: PlusCircle,
          },
        ],
      },
    ],
  },
  finance: {
    id: "finance",
    titleTh: "การเงิน",
    titleEn: "Finance",
    basePath: "/finance",
    icon: DollarSign,
    iconBg: "bg-emerald-500/20 text-emerald-400",
    sections: [
      {
        id: "main",
        labelTh: "หลัก",
        labelEn: "Main",
        items: [
          {
            id: "overview",
            href: "/finance",
            labelTh: "ภาพรวมการเงิน",
            labelEn: "Finance overview",
            icon: DollarSign,
          },
        ],
      },
    ],
  },
  warranty: {
    id: "warranty",
    titleTh: "การรับประกัน",
    titleEn: "Warranty",
    basePath: "/warranty",
    icon: ShieldCheck,
    iconBg: "bg-amber-500/20 text-amber-400",
    sections: [
      {
        id: "main",
        labelTh: "หลัก",
        labelEn: "Main",
        items: [
          {
            id: "list",
            href: "/warranty",
            labelTh: "รายการรับประกัน",
            labelEn: "Warranty list",
            icon: ShieldCheck,
          },
        ],
      },
    ],
  },
  settings: {
    id: "settings",
    titleTh: "ตั้งค่า",
    titleEn: "Settings",
    basePath: "/settings",
    icon: Settings,
    iconBg: "bg-slate-500/20 text-slate-400",
    sections: [
      {
        id: "main",
        labelTh: "หลัก",
        labelEn: "Main",
        items: [
          {
            id: "general",
            href: "/settings",
            labelTh: "ทั่วไป",
            labelEn: "General",
            icon: Settings,
          },
        ],
      },
    ],
  },
};

/** ลำดับการแสดงหมวดหลัก (โหมด Subjects) */
export const SUBJECT_ORDER: string[] = [
  "dashboard",
  "repair",
  "inventory",
  "finance",
  "warranty",
  "settings",
];

/** จาก pathname หา subject id ปัจจุบัน (หรือ null ถ้าอยู่ /subjects) */
export function getSubjectIdFromPath(pathname: string): string | null {
  if (pathname === "/subjects") return null;
  if (pathname === "/" || pathname.startsWith("/") && pathname.length <= 1) return "dashboard";
  for (const subject of Object.values(SUBJECTS_CONFIG)) {
    if (pathname === subject.basePath || (subject.basePath !== "/" && pathname.startsWith(subject.basePath)))
      return subject.id;
  }
  return null;
}

/** เช็คว่าอยู่โหมด Subjects (แสดง 6 หมวดใน Sidebar) — ใช้ที่ "/" และ "/subjects" */
export function isSubjectsMode(pathname: string): boolean {
  return pathname === "/" || pathname === "/subjects";
}
