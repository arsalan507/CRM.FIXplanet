"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatPhoneNumber, formatDateTime, formatCurrency, formatDuration } from "@/lib/utils";
import { createCustomer, deleteCustomer, getCustomerById, updateCustomer } from "@/app/actions/customers";
import { createLead } from "@/app/actions/leads";
import type { Customer, Lead, UserRole } from "@/lib/types";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  Smartphone,
  IndianRupee,
  Eye,
  Trash2,
  Loader2,
  History,
  MessageSquare,
  FileText,
  Calendar,
  Edit,
  Clock,
} from "lucide-react";

interface CustomersPageClientProps {
  customers: Customer[];
  currentUserRole: UserRole;
}

interface CallNoteWithDetails {
  id: string;
  lead_id: string;
  note: string;
  call_duration: number | null;
  outcome: string | null;
  created_at: string;
  staff?: { full_name: string };
  lead?: { device_type: string; device_model: string };
}

interface CustomerWithDetails extends Customer {
  leads?: Lead[];
  callNotes?: CallNoteWithDetails[];
  stats?: {
    totalRepairs: number;
    completedRepairs: number;
    totalSpent: number;
  };
}

export function CustomersPageClient({
  customers: initialCustomers,
  currentUserRole,
}: CustomersPageClientProps) {
  const searchParams = useSearchParams();
  const [customers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    contact_number: "",
    email: "",
    address: "",
    city: "Bengaluru",
  });

  const [editData, setEditData] = useState({
    customer_name: "",
    contact_number: "",
    email: "",
    address: "",
    city: "",
  });

  // Check for view param on load
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId) {
      const customer = customers.find(c => c.id === viewId);
      if (customer) {
        handleViewCustomer(customer);
      }
    }
  }, [searchParams, customers]);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    const name = customer.customer_name || "";
    const phone = customer.contact_number || "";
    const email = customer.email || "";
    return (
      name.toLowerCase().includes(query) ||
      phone.includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  const handleViewCustomer = async (customer: Customer) => {
    setIsLoading(true);
    setIsDetailOpen(true);

    const result = await getCustomerById(customer.id);
    if (result.success && result.data) {
      setSelectedCustomer(result.data as CustomerWithDetails);
      setEditData({
        customer_name: result.data.customer_name || "",
        contact_number: result.data.contact_number || "",
        email: result.data.email || "",
        address: result.data.address || "",
        city: result.data.city || "",
      });
    } else {
      setSelectedCustomer(customer as CustomerWithDetails);
    }
    setIsLoading(false);
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.customer_name.trim() || !newCustomer.contact_number.trim()) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createCustomer({
        customer_name: newCustomer.customer_name,
        contact_number: newCustomer.contact_number,
        email: newCustomer.email || undefined,
        address: newCustomer.address || undefined,
        city: newCustomer.city || undefined,
      });

      if (result.success) {
        toast({ title: "Success", description: "Customer created successfully" });
        setIsCreateOpen(false);
        setNewCustomer({ customer_name: "", contact_number: "", email: "", address: "", city: "Bengaluru" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer) return;

    startTransition(async () => {
      const result = await updateCustomer(selectedCustomer.id, {
        customer_name: editData.customer_name,
        contact_number: editData.contact_number,
        email: editData.email || undefined,
        address: editData.address || undefined,
        city: editData.city || undefined,
      });

      if (result.success) {
        toast({ title: "Success", description: "Customer updated" });
        setIsEditMode(false);
        handleViewCustomer(selectedCustomer);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleDeleteCustomer = (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    startTransition(async () => {
      const result = await deleteCustomer(id);
      if (result.success) {
        toast({ title: "Success", description: "Customer deleted" });
        setIsDetailOpen(false);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleCreateNewLead = () => {
    if (!selectedCustomer) return;

    startTransition(async () => {
      const result = await createLead({
        customer_name: selectedCustomer.customer_name,
        contact_number: selectedCustomer.contact_number,
        email: selectedCustomer.email || undefined,
        device_type: "iPhone",
        device_model: "iPhone 15",
        issue_reported: "Screen Replacement",
        lead_source: "Returning Customer",
      });

      if (result.success) {
        toast({ title: "Success", description: "New lead created for this customer" });
        window.location.href = "/leads";
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  // Get all call notes from API response
  const getAllCallNotes = (): CallNoteWithDetails[] => {
    if (!selectedCustomer?.callNotes) return [];
    return selectedCustomer.callNotes;
  };

  const canManage = ["super_admin", "operation_manager"].includes(currentUserRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Customers</h1>
          <p className="text-sm text-gray-500">
            Manage your customer database ({customers.length} total)
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="border-black">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-black"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-black">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-black bg-gray-50">
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Lifetime Value</TableHead>
                <TableHead className="font-semibold">Joined</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                    {searchQuery ? "No customers match your search" : "No customers yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-black hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                          {(customer.customer_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-black">{customer.customer_name}</p>
                          {customer.city && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {customer.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <a
                          href={`tel:${customer.contact_number}`}
                          className="text-sm flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {formatPhoneNumber(customer.contact_number || "")}
                        </a>
                        {customer.email && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <IndianRupee className="h-4 w-4" />
                        {formatCurrency(customer.lifetime_value || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(customer.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                        className="border-black"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enhanced Customer Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Profile
              </span>
              {selectedCustomer && (
                <Badge className="bg-green-100 text-green-800 border-0">
                  Member since {formatDateTime(selectedCustomer.created_at).split(",")[0]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Header */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
                  {(selectedCustomer.customer_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <Input
                        value={editData.customer_name}
                        onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })}
                        className="border-black font-bold text-lg"
                        placeholder="Customer Name"
                      />
                      <Input
                        value={editData.contact_number}
                        onChange={(e) => setEditData({ ...editData, contact_number: e.target.value })}
                        className="border-black"
                        placeholder="Phone"
                      />
                      <Input
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        placeholder="Email"
                        className="border-black"
                      />
                      <Input
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        placeholder="Address"
                        className="border-black"
                      />
                      <Input
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                        placeholder="City"
                        className="border-black"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-black">{selectedCustomer.customer_name}</h2>
                      <div className="mt-2 space-y-1">
                        <a
                          href={`tel:${selectedCustomer.contact_number}`}
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {formatPhoneNumber(selectedCustomer.contact_number || "")}
                        </a>
                        {selectedCustomer.email && (
                          <p className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {selectedCustomer.email}
                          </p>
                        )}
                        {(selectedCustomer.address || selectedCustomer.city) && (
                          <p className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {[selectedCustomer.address, selectedCustomer.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-black flex items-center justify-end gap-1">
                    <IndianRupee className="h-6 w-6" />
                    {formatCurrency(selectedCustomer.stats?.totalSpent || selectedCustomer.lifetime_value || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Lifetime Value</p>
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <Badge variant="outline">{selectedCustomer.stats?.totalRepairs || selectedCustomer.total_repairs || 0} Repairs</Badge>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      {selectedCustomer.stats?.completedRepairs || 0} Completed
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="repairs" className="w-full">
                <TabsList className="bg-gray-100 w-full justify-start">
                  <TabsTrigger value="repairs" className="flex items-center gap-1">
                    <History className="h-4 w-4" />
                    Repair History
                  </TabsTrigger>
                  <TabsTrigger value="communications" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Communications
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Invoices
                  </TabsTrigger>
                </TabsList>

                {/* Repair History Tab */}
                <TabsContent value="repairs" className="mt-4">
                  {selectedCustomer.leads && selectedCustomer.leads.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCustomer.leads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-3 w-3 rounded-full ${
                              lead.status === "won" ? "bg-green-500" :
                              lead.status === "lost" ? "bg-red-500" :
                              "bg-yellow-500"
                            }`} />
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-gray-400" />
                                {lead.device_type} {lead.device_model}
                              </p>
                              <p className="text-sm text-gray-500">{lead.issue_reported}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                lead.status === "won" ? "bg-green-100 text-green-800" :
                                lead.status === "lost" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {lead.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(lead.created_at)}
                            </p>
                            {lead.staff?.full_name && (
                              <p className="text-xs text-gray-400">by {lead.staff.full_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No repair history found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Communications Tab */}
                <TabsContent value="communications" className="mt-4">
                  {getAllCallNotes().length > 0 ? (
                    <div className="space-y-3">
                      {getAllCallNotes().map((note) => (
                        <div
                          key={note.id}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {note.staff?.full_name || "Staff"}
                                </p>
                                {note.lead && (
                                  <p className="text-xs text-gray-500">
                                    {note.lead.device_type} {note.lead.device_model}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <p>{formatDateTime(note.created_at)}</p>
                              {note.call_duration && (
                                <p className="flex items-center gap-1 justify-end mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(note.call_duration)}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{note.note}</p>
                          {note.outcome && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {note.outcome}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No communication logs found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="mt-4">
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Invoice system coming in Phase 5</p>
                    <p className="text-sm mt-1">Invoices and payments will be tracked here</p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewLead}
                  disabled={isPending}
                  className="border-black"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Lead
                </Button>
                {canManage && (
                  <>
                    {isEditMode ? (
                      <>
                        <Button size="sm" onClick={handleUpdateCustomer} disabled={isPending}>
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Save Changes
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)} className="border-black">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)} className="border-black">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Info
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="border-black">
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Customer Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Customer name"
                value={newCustomer.customer_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                placeholder="10-digit mobile number"
                value={newCustomer.contact_number}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact_number: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="customer@email.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Full address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="border-black"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                placeholder="City"
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                className="border-black"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-black">
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
