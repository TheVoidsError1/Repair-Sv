import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Shield,
  Bell,
  Globe,
  Lock,
  Plus,
  Edit,
  Trash2,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@repairpro.com",
    role: "owner",
    status: "active",
    lastLogin: "2024-01-15 09:30",
  },
  {
    id: 2,
    name: "Tom Technician",
    email: "tom@repairpro.com",
    role: "staff",
    status: "active",
    lastLogin: "2024-01-15 08:45",
  },
  {
    id: 3,
    name: "Anna Support",
    email: "anna@repairpro.com",
    role: "staff",
    status: "active",
    lastLogin: "2024-01-14 17:00",
  },
  {
    id: 4,
    name: "Mike Manager",
    email: "mike@repairpro.com",
    role: "staff",
    status: "inactive",
    lastLogin: "2024-01-10 14:20",
  },
];

const Settings = () => {
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    lowStock: true,
    newRepair: true,
    warrantyExpiry: false,
  });
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  return (
    <MainLayout language={language as "en" | "th"}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Manage your system settings, users, and preferences.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Language</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  User Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage staff accounts and permissions
                </p>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new staff account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Enter full name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter email" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsUserDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsUserDialogOpen(false)}>
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-6 space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <span
                          className={cn(
                            "status-badge text-xs",
                            user.role === "owner"
                              ? "status-in-progress"
                              : "status-completed"
                          )}
                        >
                          {user.role === "owner" ? "Owner" : "Staff"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Last login</p>
                      <p className="text-sm text-foreground">{user.lastLogin}</p>
                    </div>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        user.status === "active"
                          ? "bg-status-completed"
                          : "bg-muted-foreground"
                      )}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Language Settings
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose your preferred language for the interface
            </p>
            <div className="grid gap-4 max-w-md">
              <div className="grid gap-2">
                <Label>Display Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="th">ไทย (Thai)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Notification Preferences
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure how you receive notifications
            </p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-medium text-foreground mb-4">
                  Notification Types
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">Low Stock Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        When inventory falls below minimum
                      </p>
                    </div>
                    <Switch
                      checked={notifications.lowStock}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, lowStock: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">New Repair Orders</p>
                      <p className="text-xs text-muted-foreground">
                        When a new repair is created
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newRepair}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newRepair: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">Warranty Expiry</p>
                      <p className="text-xs text-muted-foreground">
                        Before warranty period ends
                      </p>
                    </div>
                    <Switch
                      checked={notifications.warrantyExpiry}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          warrantyExpiry: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Security Settings
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Manage your account security
            </p>
            <div className="space-y-6 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="gap-2">
                <Lock className="w-4 h-4" />
                Update Password
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add an extra layer of security to your account
            </p>
            <Button variant="outline" className="gap-2">
              <Shield className="w-4 h-4" />
              Enable 2FA
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Settings;
