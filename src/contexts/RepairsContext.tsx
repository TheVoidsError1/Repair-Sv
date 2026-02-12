import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type RepairTag = "endOfDay" | "leaveDevice";

export interface RepairItem {
  id: string;
  customer: string;
  phone: string;
  device: string;
  issue: string;
  issueTh: string;
  status: string;
  technician: string;
  technicianTh?: string;
  createdAt: string;
  estimatedCost: number;
  tag?: RepairTag;
}

const initialRepairs: RepairItem[] = [
  {
    id: "REP-001",
    customer: "John Doe",
    phone: "081-234-5678",
    device: "iPhone 14 Pro",
    issue: "Screen Replacement",
    issueTh: "เปลี่ยนหน้าจอ",
    status: "in-progress",
    technician: "Tom",
    createdAt: "2024-01-15",
    estimatedCost: 4500,
    tag: "endOfDay",
  },
  {
    id: "REP-002",
    customer: "Jane Smith",
    phone: "082-345-6789",
    device: "Samsung Galaxy S23",
    issue: "Battery Replacement",
    issueTh: "เปลี่ยนแบตเตอรี่",
    status: "pending",
    technician: "Unassigned",
    technicianTh: "ยังไม่มอบหมาย",
    createdAt: "2024-01-15",
    estimatedCost: 1200,
    tag: "leaveDevice",
  },
  {
    id: "REP-003",
    customer: "Mike Johnson",
    phone: "083-456-7890",
    device: "Google Pixel 7",
    issue: "Water Damage Repair",
    issueTh: "ซ่อมเสียหายจากน้ำ",
    status: "completed",
    technician: "Anna",
    createdAt: "2024-01-14",
    estimatedCost: 3200,
    tag: "endOfDay",
  },
  {
    id: "REP-004",
    customer: "Sarah Williams",
    phone: "084-567-8901",
    device: "iPhone 13",
    issue: "Back Glass Repair",
    issueTh: "ซ่อมกระจกหลัง",
    status: "completed",
    technician: "Tom",
    createdAt: "2024-01-14",
    estimatedCost: 2800,
  },
  {
    id: "REP-005",
    customer: "David Brown",
    phone: "085-678-9012",
    device: "OnePlus 11",
    issue: "Charging Port Replacement",
    issueTh: "เปลี่ยนพอร์ตชาร์จ",
    status: "cancelled",
    technician: "Anna",
    createdAt: "2024-01-13",
    estimatedCost: 800,
    tag: "leaveDevice",
  },
  {
    id: "REP-006",
    customer: "Emily Chen",
    phone: "086-789-0123",
    device: "iPhone 15 Pro Max",
    issue: "Speaker Not Working",
    issueTh: "ลำโพงไม่ทำงาน",
    status: "pending",
    technician: "Unassigned",
    technicianTh: "ยังไม่มอบหมาย",
    createdAt: "2024-01-15",
    estimatedCost: 1500,
    tag: "leaveDevice",
  },
  {
    id: "REP-008",
    customer: "Robert Taylor",
    phone: "087-890-1234",
    device: "iPhone 12",
    issue: "Back Glass Repair",
    issueTh: "ซ่อมกระจกหลัง",
    status: "completed",
    technician: "Tom",
    createdAt: "2024-01-12",
    estimatedCost: 2800,
    tag: "endOfDay",
  },
  {
    id: "REP-010",
    customer: "Lisa Anderson",
    phone: "088-901-2345",
    device: "Samsung Galaxy S22",
    issue: "Battery Replacement",
    issueTh: "เปลี่ยนแบตเตอรี่",
    status: "completed",
    technician: "Anna",
    createdAt: "2024-01-13",
    estimatedCost: 1200,
    tag: "leaveDevice",
  },
];

interface RepairsContextValue {
  repairs: RepairItem[];
  setRepairs: React.Dispatch<React.SetStateAction<RepairItem[]>>;
  endOfDayCount: number;
  leaveDeviceCount: number;
}

const RepairsContext = createContext<RepairsContextValue | null>(null);

export function RepairsProvider({ children }: { children: ReactNode }) {
  const [repairs, setRepairs] = useState<RepairItem[]>(initialRepairs);

  const value = useMemo(() => {
    const endOfDayCount = repairs.filter((r) => r.tag === "endOfDay").length;
    const leaveDeviceCount = repairs.filter((r) => r.tag === "leaveDevice").length;
    return {
      repairs,
      setRepairs,
      endOfDayCount,
      leaveDeviceCount,
    };
  }, [repairs]);

  return (
    <RepairsContext.Provider value={value}>
      {children}
    </RepairsContext.Provider>
  );
}

export function useRepairs() {
  const ctx = useContext(RepairsContext);
  if (!ctx) throw new Error("useRepairs must be used within RepairsProvider");
  return ctx;
}
