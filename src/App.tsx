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
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** ตรวจสิทธิ์ตาม role — พนักงานเข้า path เฉพาะเจ้าของไม่ได้ จะ redirect ไปแดชบอร์ด */
function RoleProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const role = currentUser?.role ?? "staff";
  if (!canAccessRoute(location.pathname, role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RepairsProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/repairs/new" element={<RepairNew />} />
              <Route path="/repairs/bill" element={<RepairBill />} />
              <Route path="/repairs/bill/order" element={<RepairOrderBill />} />
              <Route path="/repairs/bill/receipt" element={<RepairReceipt />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/warranty" element={<Warranty />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RepairsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
