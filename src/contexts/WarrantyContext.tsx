import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type WarrantyClaimStatus =
  | "pending"
  | "in-progress"
  | "approved"
  | "rejected";

export interface WarrantyClaim {
  id: string;
  repairId: string;
  claimReason: string;
  claimReasonTh: string;
  status: WarrantyClaimStatus;
  claimDate: string;
}

const initialClaims: WarrantyClaim[] = [
  {
    id: "WRN-001",
    repairId: "REP-001",
    claimReason: "Screen flickering after 2 weeks",
    claimReasonTh: "หน้าจอกระพริบหลังจาก 2 สัปดาห์",
    status: "pending",
    claimDate: "2024-01-15",
  },
  {
    id: "WRN-002",
    repairId: "REP-003",
    claimReason: "Device not charging properly",
    claimReasonTh: "อุปกรณ์ชาร์จไม่เข้า",
    status: "approved",
    claimDate: "2024-01-14",
  },
  {
    id: "WRN-003",
    repairId: "REP-010",
    claimReason: "Battery drains too fast",
    claimReasonTh: "แบตเตอรี่หมดเร็วเกินไป",
    status: "in-progress",
    claimDate: "2024-01-13",
  },
  {
    id: "WRN-004",
    repairId: "REP-008",
    claimReason: "Glass cracked again",
    claimReasonTh: "กระจกแตกอีกครั้ง",
    status: "rejected",
    claimDate: "2024-01-12",
  },
];

function nextClaimId(claims: WarrantyClaim[]): string {
  const nums = claims
    .map((c) => {
      const m = c.id.match(/^WRN-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `WRN-${String(max + 1).padStart(3, "0")}`;
}

interface WarrantyContextValue {
  claims: WarrantyClaim[];
  addClaim: (params: {
    repairId: string;
    claimReason: string;
    claimReasonTh: string;
  }) => WarrantyClaim;
  updateClaimStatus: (
    claimId: string,
    status: WarrantyClaimStatus
  ) => void;
}

const WarrantyContext = createContext<WarrantyContextValue | null>(null);

export function WarrantyProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<WarrantyClaim[]>(initialClaims);

  const addClaim = useCallback(
    (params: {
      repairId: string;
      claimReason: string;
      claimReasonTh: string;
    }) => {
      const today = new Date().toISOString().slice(0, 10);
      const newClaim: WarrantyClaim = {
        id: nextClaimId(claims),
        repairId: params.repairId,
        claimReason: params.claimReason,
        claimReasonTh: params.claimReasonTh,
        status: "pending",
        claimDate: today,
      };
      setClaims((prev) => [...prev, newClaim]);
      return newClaim;
    },
    [claims]
  );

  const updateClaimStatus = useCallback(
    (claimId: string, status: WarrantyClaimStatus) => {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status } : c))
      );
    },
    []
  );

  const value = useMemo(
    () => ({ claims, addClaim, updateClaimStatus }),
    [claims, addClaim, updateClaimStatus]
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
