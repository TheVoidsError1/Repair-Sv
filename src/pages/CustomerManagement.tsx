import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api";
import { ArrowLeft, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  lineId?: string;
  lineIdRes?: string;
  createdAt: string;
  updatedAt: string;
}

const CustomerManagement = () => {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // โหลดข้อมูลลูกค้า
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCustomers();
      if (response.status === "success" && response.data) {
        setCustomers(response.data);
      } else {
        toast.error(
          response.message ||
            (language === "th"
              ? "ไม่สามารถโหลดข้อมูลลูกค้าได้"
              : "Failed to load customers")
        );
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า"
          : "Error loading customers"
      );
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาลูกค้า
  const searchCustomers = async () => {
    if (!searchTerm.trim()) {
      loadCustomers();
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.searchCustomers(searchTerm);
      if (response.status === "success" && response.data) {
        setCustomers(response.data);
      } else {
        toast.error(
          response.message ||
            (language === "th"
              ? "ไม่สามารถค้นหาลูกค้าได้"
              : "Failed to search customers")
        );
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      toast.error(
        language === "th"
          ? "เกิดข้อผิดพลาดในการค้นหา"
          : "Error searching customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // กรองข้อมูลตาม searchTerm (client-side filtering)
  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName =
      customer.fullName ||
      `${customer.firstName} ${customer.lastName || ""}`.trim();
    return (
      customer.firstName?.toLowerCase().includes(term) ||
      customer.lastName?.toLowerCase().includes(term) ||
      fullName.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCustomers();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/system">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === "th" ? "ดูข้อมูลลูกค้า" : "Customer Management"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "th"
                ? "ดูและค้นหาข้อมูลลูกค้าทั้งหมด"
                : "View and search all customer information"}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-card rounded-xl border border-border p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  language === "th"
                    ? "ค้นหาด้วยชื่อหรือเบอร์โทรศัพท์..."
                    : "Search by name or phone..."
                }
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value.trim()) {
                    loadCustomers();
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="default">
              {language === "th" ? "ค้นหา" : "Search"}
            </Button>
            {searchTerm && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  loadCustomers();
                }}
              >
                {language === "th" ? "ล้าง" : "Clear"}
              </Button>
            )}
          </form>
        </div>

        {/* Customer List */}
        <div className="bg-card rounded-xl border border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {language === "th" ? "กำลังโหลด..." : "Loading..."}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {language === "th"
                  ? "ไม่พบข้อมูลลูกค้า"
                  : "No customers found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {language === "th" ? "ชื่อ-นามสกุล" : "Name"}
                    </TableHead>
                    <TableHead>
                      {language === "th" ? "เบอร์โทรศัพท์" : "Phone"}
                    </TableHead>
                    <TableHead>
                      {language === "th" ? "LINE ID" : "LINE ID"}
                    </TableHead>
                    <TableHead>
                      {language === "th" ? "วันที่สร้าง" : "Created At"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const fullName =
                      customer.fullName ||
                      `${customer.firstName} ${customer.lastName || ""}`.trim();
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {fullName || customer.firstName}
                        </TableCell>
                        <TableCell>
                          {customer.phone || (
                            <span className="text-muted-foreground">
                              {language === "th" ? "-" : "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.lineIdRes || customer.lineId ? (
                            <span className="text-green-600 dark:text-green-400">
                              {customer.lineIdRes || customer.lineId}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {language === "th" ? "-" : "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(customer.createdAt).toLocaleDateString(
                            language === "th" ? "th-TH" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {!loading && filteredCustomers.length > 0 && (
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-sm text-muted-foreground text-center">
                {language === "th"
                  ? `พบทั้งหมด ${filteredCustomers.length} รายการ`
                  : `Total ${filteredCustomers.length} customers`}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CustomerManagement;
