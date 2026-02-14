import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { apiClient } from "@/lib/api";

export type WarrantyClaimStatus =
  | "pending"
  | "in-progress"
  | "approved"
  | "rejected";

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  repairId: string;
  /** Serial Number ของเครื่องตอนยื่นเคลม — ใช้ตรวจสอบว่าเครื่องตรงกับงานซ่อมเดิม */
  serialNumber?: string;
  claimReason: string;
  claimReasonTh: string;
  status: WarrantyClaimStatus;
  claimDate: string;
  createdAt?: string;
  updatedAt?: string;
  repair?: any; // Populated repair data from backend
}

interface WarrantyContextValue {
  claims: WarrantyClaim[];
  isLoading: boolean;
  error: string | null;
  fetchClaims: () => Promise<void>;
  addClaim: (params: {
    repairId: string;
    serialNumber?: string;
    claimReason: string;
    claimReasonTh: string;
  }) => Promise<WarrantyClaim | null>;
  updateClaimStatus: (
    claimId: string,
    status: WarrantyClaimStatus
  ) => Promise<void>;
  deleteClaim: (claimId: string) => Promise<void>;
}

const WarrantyContext = createContext<WarrantyContextValue | null>(null);

export function WarrantyProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all warranty claims from backend
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getWarrantyClaims();
      if (response.status === "success" && response.data) {
        // Transform backend data to match frontend interface
        const transformedClaims = response.data.map((claim: any) => ({
          id: claim.id, // Use UUID as ID
          claimNumber: claim.claimNumber,
          repairId: claim.repair?.repairNumber || claim.repairId,
          serialNumber: claim.serialNumber || claim.repair?.serialNumber,
          claimReason: claim.claimReason,
          claimReasonTh: claim.claimReasonTh,
          status: claim.status as WarrantyClaimStatus,
          claimDate: claim.claimDate.split('T')[0], // Format date
          createdAt: claim.createdAt,
          updatedAt: claim.updatedAt,
          repair: claim.repair,
        }));
        setClaims(transformedClaims);
      } else {
        setError(response.message || "Failed to fetch warranty claims");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch claims on mount
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Add new warranty claim
  const addClaim = useCallback(
    async (params: {
      repairId: string;
      serialNumber?: string;
      claimReason: string;
      claimReasonTh: string;
    }): Promise<WarrantyClaim | null> => {
      setError(null);
      try {
        const response = await apiClient.createWarrantyClaim(params);
        if (response.status === "success" && response.data) {
          const newClaim: WarrantyClaim = {
            id: response.data.id,
            claimNumber: response.data.claimNumber,
            repairId: response.data.repair?.repairNumber || response.data.repairId,
            serialNumber: response.data.serialNumber || response.data.repair?.serialNumber,
            claimReason: response.data.claimReason,
            claimReasonTh: response.data.claimReasonTh,
            status: response.data.status as WarrantyClaimStatus,
            claimDate: response.data.claimDate.split('T')[0],
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            repair: response.data.repair,
          };
          setClaims((prev) => [newClaim, ...prev]);
          return newClaim;
        } else {
          setError(response.message || "Failed to create warranty claim");
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    []
  );

  // Update warranty claim status
  const updateClaimStatus = useCallback(
    async (claimId: string, status: WarrantyClaimStatus) => {
      setError(null);
      try {
        const response = await apiClient.updateWarrantyClaimStatus(claimId, status);
        if (response.status === "success") {
          setClaims((prev) =>
            prev.map((c) => (c.id === claimId ? { ...c, status } : c))
          );
        } else {
          setError(response.message || "Failed to update warranty claim status");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    []
  );

  // Delete warranty claim
  const deleteClaim = useCallback(async (claimId: string) => {
    setError(null);
    try {
      const response = await apiClient.deleteWarrantyClaim(claimId);
      if (response.status === "success") {
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
      } else {
        setError(response.message || "Failed to delete warranty claim");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const value = useMemo(
    () => ({ claims, isLoading, error, fetchClaims, addClaim, updateClaimStatus, deleteClaim }),
    [claims, isLoading, error, fetchClaims, addClaim, updateClaimStatus, deleteClaim]
  );

  return (
    <WarrantyContext.Provider value={value}>
      {children}
    </WarrantyContext.Provider>
  );
}

export function useWarranty() {
  const ctx = useContext(WarrantyContext);
  if (!ctx) throw new Error("useWarranty must be used within WarrantyProvider");
  return ctx;
}
