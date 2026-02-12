import {
    createContext,
    useContext,
    useMemo,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { apiClient } from "@/lib/api";

export type RepairTag = "endOfDay" | "leaveDevice";

export interface RepairItem {
  id: string;
  /** Serial Number / IMEI — ใช้เป็นตัวระบุหลักสำหรับการรับประกัน */
  serialNumber?: string;
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
  /** รหัสอะไหล่ที่เลือก (UUID) - สำหรับ backward compatibility */
  selectedPartId?: string;
  /** ข้อมูลอะไหล่ (ถ้ามี) - สำหรับ backward compatibility */
  selectedPart?: {
    partNumber?: string;
    name?: string;
    nameTh?: string;
  };
  /** ข้อมูลอะไหล่ทั้งหมดที่เลือก (array) */
  selectedParts?: Array<{
    id?: string;
    partNumber?: string;
    name?: string;
    nameTh?: string;
    price?: number;
  }>;
}

interface RepairsContextValue {
  repairs: RepairItem[];
  setRepairs: React.Dispatch<React.SetStateAction<RepairItem[]>>;
  endOfDayCount: number;
  leaveDeviceCount: number;
  isLoading: boolean;
  refreshRepairs: () => Promise<void>;
}

const RepairsContext = createContext<RepairsContextValue | null>(null);

// Convert API repair data to RepairItem format
function convertRepairFromAPI(repair: any): RepairItem {
  return {
    id: repair.repairNumber || repair.id,
    serialNumber: repair.serialNumber,
    customer: repair.customer?.fullName || `${repair.customer?.firstName || ''} ${repair.customer?.lastName || ''}`.trim() || 'Unknown',
    phone: repair.customer?.phone || '',
    device: repair.deviceModel || repair.deviceType || '',
    issue: repair.problemDescription || repair.problemSymptoms || '',
    issueTh: repair.problemSymptoms || repair.problemDescription || '',
    status: repair.status || 'pending',
    technician: repair.assignedTo ? `${repair.assignedTo.firstName} ${repair.assignedTo.lastName || ''}`.trim() : 'Unassigned',
    technicianTh: repair.assignedTo ? `${repair.assignedTo.firstName} ${repair.assignedTo.lastName || ''}`.trim() : 'ยังไม่มอบหมาย',
    createdAt: repair.dateOfReport ? new Date(repair.dateOfReport).toISOString().split('T')[0] : repair.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    estimatedCost: parseFloat(String(repair.estimatedPrice || repair.repairSummaryPrice || repair.totalCost || 0)),
    tag: repair.serviceType === 'walk_in' ? 'endOfDay' as const : 'leaveDevice' as const,
    selectedPartId: repair.selectedPartId,
    selectedPart: repair.selectedPart ? {
      partNumber: repair.selectedPart.partNumber,
      name: repair.selectedPart.name,
      nameTh: repair.selectedPart.nameTh,
    } : undefined,
    selectedParts: repair.selectedParts ? repair.selectedParts.map((part: any) => ({
      id: part.id,
      partNumber: part.partNumber,
      name: part.name,
      nameTh: part.nameTh,
      price: part.price,
    })) : (repair.selectedPart ? [{
      id: repair.selectedPart.id,
      partNumber: repair.selectedPart.partNumber,
      name: repair.selectedPart.name,
      nameTh: repair.selectedPart.nameTh,
      price: repair.selectedPart.price,
    }] : undefined),
  };
}

export function RepairsProvider({ children }: { children: ReactNode }) {
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRepairs = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRepairs();
      if (response.status === 'success' && response.data) {
        const convertedRepairs = response.data.map(convertRepairFromAPI);
        setRepairs(convertedRepairs);
      } else {
        console.error('Failed to load repairs:', response.message);
        setRepairs([]);
      }
    } catch (error) {
      console.error('Error loading repairs:', error);
      setRepairs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshRepairs();
  }, []);

  const value = useMemo(() => {
    const endOfDayCount = repairs.filter((r) => r.tag === "endOfDay").length;
    const leaveDeviceCount = repairs.filter((r) => r.tag === "leaveDevice").length;
    return {
      repairs,
      setRepairs,
      endOfDayCount,
      leaveDeviceCount,
      isLoading,
      refreshRepairs,
    };
  }, [repairs, isLoading]);

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
