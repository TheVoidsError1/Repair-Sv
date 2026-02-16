import {
    createContext,
    useContext,
    useMemo,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import { useSocket } from "./SocketContext";

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
  refreshRepairs: (page?: number, limit?: number) => Promise<void>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  setPagination: React.Dispatch<React.SetStateAction<{
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  }>>;
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    totalCount: 0,
    totalPages: 0,
  });
  const { socket, isConnected } = useSocket();

  const refreshRepairs = async (page: number = 1, limit: number = 8) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getRepairs(page, limit) as any;
      if (response.status === 'success' && response.data) {
        const convertedRepairs = Array.isArray(response.data) 
          ? response.data.map(convertRepairFromAPI)
          : [];
        setRepairs(convertedRepairs);
        
        // Update pagination info if provided
        if (response.pagination) {
          setPagination(response.pagination);
        }
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

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    refreshRepairs(pagination.page, pagination.limit);
  }, []);

  // ฟัง Socket events สำหรับ real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up repair socket listeners');

    // เมื่อมีการสร้างงานซ่อมใหม่
    socket.on('repair:created', (repair: any) => {
      console.log('📡 Received repair:created', repair);
      const convertedRepair = convertRepairFromAPI(repair);
      setRepairs((prev) => [convertedRepair, ...prev]);
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }));
    });

    // เมื่อมีการอัปเดตงานซ่อม
    socket.on('repair:updated', (repair: any) => {
      console.log('📡 Received repair:updated', repair);
      const convertedRepair = convertRepairFromAPI(repair);
      setRepairs((prev) => 
        prev.map((r) => 
          r.id === convertedRepair.id ? convertedRepair : r
        )
      );
    });

    // เมื่อมีการลบงานซ่อม
    socket.on('repair:deleted', (data: { id: string }) => {
      console.log('📡 Received repair:deleted', data);
      setRepairs((prev) => prev.filter((r) => r.id !== data.id));
      setPagination((prev) => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - 1),
      }));
    });

    // Cleanup listeners
    return () => {
      socket.off('repair:created');
      socket.off('repair:updated');
      socket.off('repair:deleted');
    };
  }, [socket, isConnected]);

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
      pagination,
      setPagination,
    };
  }, [repairs, isLoading, pagination]);

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
