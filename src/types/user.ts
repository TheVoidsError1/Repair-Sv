export type UserRole = "owner" | "staff";

export interface User {
  id: string;
  username: string;
  /** เก็บเป็น plain text เฉพาะสำหรับ demo; ใน production ควร hash */
  password: string;
  name: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin: string | null;
}

export interface AuthSession {
  username: string;
  loginAt: string;
}
