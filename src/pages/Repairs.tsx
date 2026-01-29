import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Eye, Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const repairs = [
  {
    id: "REP-001",
    customer: "John Doe",
    phone: "081-234-5678",
    device: "iPhone 14 Pro",
    issue: "Screen Replacement",
    status: "in-progress",
    technician: "Tom",
    createdAt: "2024-01-15",
    estimatedCost: 4500,
  },
  {
    id: "REP-002",
    customer: "Jane Smith",
    phone: "082-345-6789",
    device: "Samsung Galaxy S23",
    issue: "Battery Replacement",
    status: "pending",
    technician: "Unassigned",
    createdAt: "2024-01-15",
    estimatedCost: 1200,
  },
  {
    id: "REP-003",
    customer: "Mike Johnson",
    phone: "083-456-7890",
    device: "Google Pixel 7",
    issue: "Water Damage Repair",
    status: "completed",
    technician: "Anna",
    createdAt: "2024-01-14",
    estimatedCost: 3200,
  },
  {
    id: "REP-004",
    customer: "Sarah Williams",
    phone: "084-567-8901",
    device: "iPhone 13",
    issue: "Back Glass Repair",
    status: "completed",
    technician: "Tom",
    createdAt: "2024-01-14",
    estimatedCost: 2800,
  },
  {
    id: "REP-005",
    customer: "David Brown",
    phone: "085-678-9012",
    device: "OnePlus 11",
    issue: "Charging Port Replacement",
    status: "cancelled",
    technician: "Anna",
    createdAt: "2024-01-13",
    estimatedCost: 800,
  },
  {
    id: "REP-006",
    customer: "Emily Chen",
    phone: "086-789-0123",
    device: "iPhone 15 Pro Max",
    issue: "Speaker Not Working",
    status: "pending",
    technician: "Unassigned",
    createdAt: "2024-01-15",
    estimatedCost: 1500,
  },
];

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  "in-progress": "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const Repairs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.device.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Repair Management</h1>
            <p className="page-description">
              Manage all repair orders, track progress, and assign technicians.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Repair Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Repair Order</DialogTitle>
                <DialogDescription>
                  Enter customer and device details to create a new repair order.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input id="customer" placeholder="Enter customer name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="Enter phone number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="device">Device</Label>
                  <Input id="device" placeholder="e.g., iPhone 14 Pro" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issue">Issue Description</Label>
                  <Textarea
                    id="issue"
                    placeholder="Describe the repair issue..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="technician">Assign Technician</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tom">Tom</SelectItem>
                      <SelectItem value="anna">Anna</SelectItem>
                      <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, customer, or device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repairs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Issue</th>
                <th>Technician</th>
                <th>Est. Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.map((repair) => (
                <tr key={repair.id}>
                  <td className="font-medium text-foreground">{repair.id}</td>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">
                        {repair.customer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {repair.phone}
                      </p>
                    </div>
                  </td>
                  <td>{repair.device}</td>
                  <td>{repair.issue}</td>
                  <td>{repair.technician}</td>
                  <td>฿{repair.estimatedCost.toLocaleString()}</td>
                  <td>
                    <span
                      className={`status-badge ${statusStyles[repair.status]}`}
                    >
                      {statusLabels[repair.status]}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Repairs;
