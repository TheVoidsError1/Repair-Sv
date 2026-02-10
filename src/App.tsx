import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RepairsProvider } from "@/contexts/RepairsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RepairsProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
