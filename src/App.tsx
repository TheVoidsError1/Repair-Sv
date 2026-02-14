import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RepairsProvider } from "@/contexts/RepairsContext";
import { WarrantyProvider } from "@/contexts/WarrantyContext";
import { canAccessRoute } from "@/lib/roleConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { SessionExpiryHandler } from "@/components/SessionExpiryHandler";
import Dashboard from "./pages/Dashboard";
import Repairs from "./pages/Repairs";
import RepairNew from "./pages/RepairNew";
import RepairBill from "./pages/RepairBill";
import RepairOrderBill from "./pages/RepairOrderBill";
import RepairReceipt from "./pages/RepairReceipt";
import Inventory from "./pages/Inventory";
import Warranty from "./pages/Warranty";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/Admin/AdminUsers";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SystemManagement from "./pages/SystemManagement";
import Register from "./pages/Register";
import AccountManagement from "./pages/AccountManagement";
import RepairItemsManagement from "./pages/RepairItemsManagement";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, currentUser } = useAuth();
  if (isAuthenticated) {
    // Staff redirect to repairs, owner to dashboard
    const role = currentUser?.role ?? "staff";
    if (role === "owner") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/repairs" replace />;
  }
  return <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** ตรวจสิทธิ์ตาม role — พนักงานเข้า path เฉพาะเจ้าของไม่ได้ จะ redirect ไปหน้าแรกที่เข้าถึงได้ */
function RoleProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const role = currentUser?.role ?? "staff";
  if (!canAccessRoute(location.pathname, role)) {
    // Staff redirect to repairs, owner to dashboard
    if (role === "owner") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/repairs" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SessionExpiryHandler />
            <RepairsProvider>
              <WarrantyProvider>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/dashboard" element={<RoleProtectedRoute><Dashboard /></RoleProtectedRoute>} />
                  <Route path="/repairs" element={<ProtectedRoute><Repairs /></ProtectedRoute>} />
                  <Route path="/repairs/new" element={<ProtectedRoute><RepairNew /></ProtectedRoute>} />
                  <Route path="/repairs/bill" element={<ProtectedRoute><RepairBill /></ProtectedRoute>} />
                  <Route path="/repairs/bill/order" element={<ProtectedRoute><RepairOrderBill /></ProtectedRoute>} />
                  <Route path="/repairs/bill/receipt" element={<ProtectedRoute><RepairReceipt /></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                  <Route path="/warranty" element={<ProtectedRoute><Warranty /></ProtectedRoute>} />
                  <Route path="/finance" element={<RoleProtectedRoute><Finance /></RoleProtectedRoute>} />
                  <Route path="/settings" element={<RoleProtectedRoute><Settings /></RoleProtectedRoute>} />
                  <Route path="/admin/users" element={<RoleProtectedRoute><AdminUsers /></RoleProtectedRoute>} />
                  <Route path="/admin" element={<RoleProtectedRoute><Navigate to="/system" replace /></RoleProtectedRoute>} />
                  <Route path="/system" element={<RoleProtectedRoute><SystemManagement /></RoleProtectedRoute>} />
                  <Route path="/system/register" element={<RoleProtectedRoute><Register /></RoleProtectedRoute>} />
                  <Route path="/system/account" element={<RoleProtectedRoute><AccountManagement /></RoleProtectedRoute>} />
                  <Route path="/system/repair-items" element={<RoleProtectedRoute><RepairItemsManagement /></RoleProtectedRoute>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                </Routes>
              </WarrantyProvider>
            </RepairsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
