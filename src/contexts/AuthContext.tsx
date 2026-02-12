import type { AuthSession, User } from "@/types/user";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

const STORAGE_USERS = "macfix_users";
const STORAGE_AUTH = "macfix_auth";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) return getDefaultUsers();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultUsers();
  } catch {
    return getDefaultUsers();
  }
}

function getDefaultUsers(): User[] {
  return [
    {
      id: "1",
      username: "admin",
      password: "admin123",
      name: "Admin User",
      role: "owner",
      status: "active",
      lastLogin: null,
    },
    {
      id: "2",
      username: "tom",
      password: "staff123",
      name: "Tom Technician",
      role: "staff",
      status: "active",
      lastLogin: null,
    },
    {
      id: "3",
      username: "anna",
      password: "staff123",
      name: "Anna Support",
      role: "staff",
      status: "active",
      lastLogin: null,
    },
    {
      id: "4",
      username: "mike",
      password: "staff123",
      name: "Mike Manager",
      role: "staff",
      status: "inactive",
      lastLogin: null,
    },
  ];
}

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso ?? "—";
  }
}

type AuthContextType = {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  loginFromApi: (userData: { email: string; username?: string; firstName?: string; lastName?: string; name?: string; role?: "owner" | "staff" }) => void;
  logout: () => void;
  addUser: (user: Omit<User, "id" | "lastLogin">) => { success: boolean; error?: string };
  updateUser: (id: string, data: Partial<Omit<User, "id" | "username">>) => void;
  deleteUser: (id: string) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  formatLastLogin: (iso: string | null) => string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function persistUsers(users: User[]) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getInitialCurrentUser(): User | null {
  const session = loadSession();
  if (!session) return null;
  const userList = loadUsers();
  return userList.find((u) => u.username === session.username) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [session, setSession] = useState<AuthSession | null>(loadSession);
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialCurrentUser);

  useEffect(() => {
    persistUsers(users);
  }, [users]);

  useEffect(() => {
    if (!session) {
      setCurrentUser(null);
      return;
    }
    const user = users.find((u) => u.username === session.username);
    setCurrentUser(user ?? null);
  }, [session, users]);

  const login = useCallback(
    (username: string, password: string) => {
      const u = users.find(
        (x) => x.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!u) {
        return { success: false, error: "invalid_credentials" };
      }
      if (u.password !== password) {
        return { success: false, error: "invalid_credentials" };
      }
      if (u.status !== "active") {
        return { success: false, error: "account_inactive" };
      }
      const now = new Date().toISOString();
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, lastLogin: now } : x
        )
      );
      const newSession: AuthSession = { username: u.username, loginAt: now };
      localStorage.setItem(STORAGE_AUTH, JSON.stringify(newSession));
      setSession(newSession);
      return { success: true };
    },
    [users]
  );

  const loginFromApi = useCallback(
    (userData: { email: string; username?: string; firstName?: string; lastName?: string; name?: string; role?: "owner" | "staff" }) => {
      // ใช้ email เป็น username ถ้าไม่มี username
      const username = userData.username || userData.email;
      const name = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || username;
      const role = userData.role || "staff";
      const now = new Date().toISOString();
      
      // เช็คว่ามี user นี้ใน users array หรือไม่
      let user = users.find((u) => u.username.toLowerCase() === username.toLowerCase() || u.username.toLowerCase() === userData.email.toLowerCase());
      
      if (!user) {
        // ถ้ายังไม่มี ให้สร้าง user ใหม่
        const newUser: User = {
          id: String(Date.now()),
          username,
          password: "", // ไม่เก็บ password จาก API
          name,
          role,
          status: "active",
          lastLogin: now,
        };
        // เพิ่ม user ใหม่
        setUsers((prev) => [...prev, newUser]);
        // สร้าง session และ set currentUser
        const newSession: AuthSession = { username: newUser.username, loginAt: now };
        localStorage.setItem(STORAGE_AUTH, JSON.stringify(newSession));
        setSession(newSession);
        setCurrentUser(newUser);
      } else {
        // อัพเดท lastLogin
        const updatedUser = { ...user, lastLogin: now };
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user!.id ? updatedUser : u
          )
        );
        // สร้าง session และ set currentUser
        const newSession: AuthSession = { username: updatedUser.username, loginAt: now };
        localStorage.setItem(STORAGE_AUTH, JSON.stringify(newSession));
        setSession(newSession);
        setCurrentUser(updatedUser);
      }
    },
    [users]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_AUTH);
    setSession(null);
  }, []);

  const addUser = useCallback(
    (data: Omit<User, "id" | "lastLogin">) => {
      const exists = users.some(
        (u) => u.username.toLowerCase() === data.username.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: "username_exists" };
      }
      const id = String(Date.now());
      setUsers((prev) => [
        ...prev,
        {
          ...data,
          id,
          lastLogin: null,
          username: data.username.trim(),
        },
      ]);
      return { success: true };
    },
    [users]
  );

  const updateUser = useCallback((id: string, data: Partial<Omit<User, "id" | "username">>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...data } : u))
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      logout();
    }
  }, [currentUser?.id, logout]);

  const value: AuthContextType = {
    users,
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    loginFromApi,
    logout,
    addUser,
    updateUser,
    deleteUser,
    setUsers,
    formatLastLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
