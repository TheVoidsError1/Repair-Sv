import type { UserRole } from "@/types/user";

/**
 * สิทธิ์การเข้าถึงตาม role
 * - owner: เจ้าของ — เข้าถึงได้ทุกอย่าง (รวมการเงิน, ตั้งค่า, จัดการผู้ใช้)
 * - staff: พนักงาน — เข้าถึง แดชบอร์ด, งานซ่อม, สินค้าคงคลัง, การรับประกัน (ไม่เห็นการเงินและตั้งค่า)
 */

/** path ที่เฉพาะเจ้าของ (owner) เท่านั้นที่เข้าได้ (พนักงานเข้า /settings ได้สำหรับเปลี่ยนรหัส/การแจ้งเตือน) */
export const ROUTES_OWNER_ONLY: string[] = ["/finance", "/admin"];

/** subject id ใน sidebar ที่เฉพาะเจ้าของเท่านั้นที่เห็น */
export const SUBJECT_IDS_OWNER_ONLY: string[] = ["finance", "admin"];

/** เช็คว่า path นี้ต้องเป็น owner เท่านั้นหรือไม่ */
export function isRouteOwnerOnly(pathname: string): boolean {
  return ROUTES_OWNER_ONLY.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

/** เช็คว่า role นี้เข้า path ได้หรือไม่ */
export function canAccessRoute(pathname: string, role: UserRole): boolean {
  if (role === "owner") return true;
  return !isRouteOwnerOnly(pathname);
}

/** เช็คว่า role นี้เห็น subject นี้ใน sidebar หรือไม่ */
export function canAccessSubject(subjectId: string, role: UserRole): boolean {
  if (role === "owner") return true;
  return !SUBJECT_IDS_OWNER_ONLY.includes(subjectId);
}
