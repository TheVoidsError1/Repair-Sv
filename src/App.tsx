import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RepairsProvider } from "@/contexts/RepairsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import RepairBill from "./pages/RepairBill";
import RepairNew from "./pages/RepairNew";
import Repairs from "./pages/Repairs";
import Settings from "./pages/Settings";
import Warranty from "./pages/Warranty";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RepairsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/subjects" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/repairs/new" element={<RepairNew />} />
            <Route path="/repairs/bill" element={<RepairBill />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/warranty" element={<Warranty />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </RepairsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
