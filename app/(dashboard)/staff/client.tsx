"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { createStaff, updateStaff, toggleStaffActive, deleteStaff } from "@/app/actions/staff";
import type { Staff, UserRole } from "@/lib/types";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

interface StaffPageClientProps {
  staff: Staff[];
  currentUserRole: UserRole;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super admin" },
  { value: "manager", label: "Manager" },
  { value: "sales_executive", label: "Sales executive" },
  { value: "field_executive", label: "Field executive" },
  { value: "technician", label: "Technician" },
];

const PERMISSIONS: { key: string; label: string }[] = [
  // Currently, permissions are role-based only
  // Add specific permissions here if needed in the future
];

export function StaffPageClient({ staff: initialStaff, currentUserRole }: StaffPageClientProps) {
  const [staff] = useState<Staff[]>(initialStaff);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "sales_executive" as UserRole,
    phone: "",
    employee_id: "",
    password: "",
    permissions: {} as Record<string, boolean>,
  });

  const activeCount = staff.filter((s) => s.is_active).length;
  const inactiveCount = staff.filter((s) => !s.is_active).length;

  const handleCreate = () => {
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({ title: "Error", description: "Name, email and password are required", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      // Auto-generate a simple employee ID based on name and timestamp
      // Format: First 3 letters of name + last 4 digits of timestamp
      const namePrefix = formData.full_name.trim().substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-4);
      const autoEmployeeId = `${namePrefix}${timestamp}`;

      const result = await createStaff({
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || undefined,
        employee_id: autoEmployeeId,
        password: formData.password,
        permissions: formData.permissions,
      });

      if (result.success) {
        toast({ title: "Success", description: "Staff member created" });
        setIsCreateOpen(false);
        setFormData({ full_name: "", email: "", role: "sales_executive", phone: "", employee_id: "", password: "", permissions: {} });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleUpdate = () => {
    if (!editingStaff) return;

    startTransition(async () => {
      const result = await updateStaff(editingStaff.id, {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || undefined,
      });

      if (result.success) {
        toast({ title: "Success", description: "Staff member updated" });
        setEditingStaff(null);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleStaffActive(id, !currentStatus);
      if (result.success) {
        toast({
          title: "Success",
          description: `Staff member ${!currentStatus ? "activated" : "deactivated"}`,
        });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteStaff(id);
      if (result.success) {
        toast({ title: "Success", description: "Staff member deleted" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const openEditModal = (member: Staff) => {
    setFormData({
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      phone: member.phone || "",
      employee_id: member.employee_id || "",
      password: "",
      permissions: (member.permissions || {}) as Record<string, boolean>,
    });
    setEditingStaff(member);
  };

  const togglePermission = (key: string) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      technician: "bg-green-100 text-green-800",
      sell_executive: "bg-orange-100 text-orange-800",
      operation_manager: "bg-cyan-100 text-cyan-800",
    };
    return (
      <Badge className={`${colors[role] || "bg-gray-100 text-gray-800"} capitalize border-0`}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (currentUserRole === "super_admin") return true;
    if (currentUserRole === "manager" && targetRole !== "super_admin") return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Staff Management</h1>
          <p className="text-sm text-gray-500">
            Manage staff accounts, roles and permissions
          </p>
        </div>
        {currentUserRole === "super_admin" && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-3xl font-bold text-black">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-3xl font-bold text-gray-400">{inactiveCount}</p>
              </div>
              <UserX className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card className="border-black">
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-black bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Emp ID</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member) => (
                  <TableRow key={member.id} className="border-black">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{member.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{member.email}</TableCell>
                    <TableCell className="text-gray-600">{member.phone || "-"}</TableCell>
                    <TableCell className="text-gray-600">{member.employee_id || "-"}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={() => handleToggleActive(member.id, member.is_active)}
                          disabled={isPending || !canManageRole(member.role)}
                        />
                        <span className={member.is_active ? "text-green-600" : "text-gray-400"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageRole(member.role) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {currentUserRole === "super_admin" && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id, member.full_name)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="enter name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>email *</Label>
              <Input
                type="email"
                placeholder="enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input
                placeholder="enter mobile"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>password *</Label>
              <Input
                type="password"
                placeholder="enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Roll *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {PERMISSIONS.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-4">Permissions</h3>
              <div className="grid grid-cols-4 gap-4">
                {PERMISSIONS.map((perm) => (
                  <div key={perm.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-${perm.key}`}
                      checked={formData.permissions[perm.key] || false}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    <label htmlFor={`create-${perm.key}`} className="text-sm cursor-pointer">
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button onClick={handleCreate} disabled={isPending} className="bg-teal-500 hover:bg-teal-600">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
              >
                <SelectTrigger className="border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((role) => canManageRole(role.value)).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingStaff(null)} className="border-black">
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
