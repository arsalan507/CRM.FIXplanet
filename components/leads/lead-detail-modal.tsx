"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime, formatPhoneNumber } from "@/lib/utils";
import { STATUS_COLORS, LEAD_STATUSES, DEVICE_MODELS, DEVICE_ISSUES } from "@/lib/config";
import {
  updateLead,
  addCallNote,
  getLeadWithNotes,
  convertLeadToCustomer,
  getCustomerByLeadId,
} from "@/app/actions/leads";
import type { Lead, Staff, LeadStatus, CallNote, UserRole } from "@/lib/types";
import {
  Phone,
  Mail,
  Smartphone,
  Clock,
  User,
  MessageSquare,
  Plus,
  Loader2,
  Save,
  X,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { LeadAcceptanceSection } from "./lead-acceptance-section";
import { InvoiceCreationSection } from "./invoice-creation-section";
import { InvoiceDisplaySection } from "./invoice-display-section";

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  currentUserRole: UserRole;
  mode: "view" | "edit";
}

interface CallNoteWithStaff extends Omit<CallNote, "staff"> {
  staff?: { full_name: string };
}

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  staffList,
  currentUserRole,
  mode: initialMode,
}: LeadDetailModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [notes, setNotes] = useState<CallNoteWithStaff[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAddNote, setShowAddNote] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<{ id: string; customer_name: string } | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    customer_name: "",
    contact_number: "",
    email: "",
    alternate_mobile: "",
    area: "",
    pincode: "",
    device_type: "",
    device_model: "",
    issue_reported: "",
    priority: 3,
    status: "new" as LeadStatus,
    assigned_to: "",
  });

  // Note form state
  const [noteForm, setNoteForm] = useState({
    note: "",
    call_duration: "",
    outcome: "",
  });

  const loadNotes = useCallback(async () => {
    if (!lead) return;
    setIsLoadingNotes(true);
    const result = await getLeadWithNotes(lead.id);
    if (result.success && result.data) {
      setNotes(result.data.notes as CallNoteWithStaff[]);
    }
    setIsLoadingNotes(false);
  }, [lead]);

  const loadCustomer = useCallback(async () => {
    if (!lead) return;
    const result = await getCustomerByLeadId(lead.id);
    if (result.success && result.data) {
      setLinkedCustomer(result.data);
    } else {
      setLinkedCustomer(null);
    }
  }, [lead]);

  useEffect(() => {
    if (lead) {
      setFormData({
        customer_name: lead.customer_name,
        contact_number: lead.contact_number,
        email: lead.email || "",
        alternate_mobile: lead.alternate_mobile || "",
        area: lead.area || "",
        pincode: lead.pincode || "",
        device_type: lead.device_type,
        device_model: lead.device_model,
        issue_reported: lead.issue_reported,
        priority: lead.priority,
        status: lead.status,
        assigned_to: lead.assigned_to || "",
      });
      loadNotes();
      loadCustomer();
    }
    setMode(initialMode);
  }, [lead, initialMode, loadNotes, loadCustomer]);

  const handleSave = () => {
    if (!lead) return;
    startTransition(async () => {
      const result = await updateLead(lead.id, {
        customer_name: formData.customer_name,
        contact_number: formData.contact_number,
        email: formData.email || undefined,
        alternate_mobile: formData.alternate_mobile || undefined,
        area: formData.area || undefined,
        pincode: formData.pincode || undefined,
        device_type: formData.device_type,
        device_model: formData.device_model,
        issue_reported: formData.issue_reported,
        priority: formData.priority,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
      });

      if (result.success) {
        toast({ title: "Lead updated", description: "Changes saved successfully" });
        setMode("view");
        onClose();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleAddNote = () => {
    if (!lead || !noteForm.note.trim()) return;
    startTransition(async () => {
      const result = await addCallNote(lead.id, {
        note: noteForm.note,
        call_duration: noteForm.call_duration ? parseInt(noteForm.call_duration) : undefined,
        outcome: noteForm.outcome || undefined,
      });

      if (result.success) {
        toast({ title: "Note added", description: "Call note saved successfully" });
        setNoteForm({ note: "", call_duration: "", outcome: "" });
        setShowAddNote(false);
        loadNotes();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: LeadStatus) => {
    const colors = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    return (
      <Badge className={`${colors.bg} ${colors.text} capitalize border-0`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const canEdit = ["super_admin", "operation_manager"].includes(currentUserRole);
  const deviceModels = DEVICE_MODELS[formData.device_type as keyof typeof DEVICE_MODELS] || [];
  const deviceIssues = DEVICE_ISSUES[formData.device_type as keyof typeof DEVICE_ISSUES] || [];

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{mode === "edit" ? "Edit Lead" : "Lead Details"}</span>
            <div className="flex items-center gap-2">
              {linkedCustomer ? (
                <Badge className="bg-green-100 text-green-800 border-0">
                  <User className="h-3 w-3 mr-1" />
                  Customer
                </Badge>
              ) : null}
              {getStatusBadge(formData.status)}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Convert to Customer Action */}
        {mode === "view" && !linkedCustomer && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm">
              <p className="font-medium text-blue-900">Convert this lead to a customer</p>
              <p className="text-blue-600 text-xs">Create a customer record to track repair history</p>
            </div>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                startTransition(async () => {
                  const result = await convertLeadToCustomer(lead.id);
                  if (result.success) {
                    toast({ title: "Success", description: "Lead converted to customer!" });
                    loadCustomer(); // Reload customer data
                  } else {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                  }
                });
              }}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              Convert to Customer
            </Button>
          </div>
        )}

        {/* Already a Customer - Link to view */}
        {mode === "view" && linkedCustomer && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm">
              <p className="font-medium text-green-900">This lead is linked to a customer</p>
              <p className="text-green-600 text-xs">View full customer profile and repair history</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-100"
              onClick={() => {
                onClose();
                window.location.href = `/customers?view=${linkedCustomer.id}`;
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Customer
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-black flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>

            {mode === "view" ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{lead.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <a href={`tel:${lead.contact_number}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {formatPhoneNumber(lead.contact_number)}
                  </a>
                </div>
                <div>
                  <p className="text-gray-500">Alternate Mobile</p>
                  {lead.alternate_mobile ? (
                    <a href={`tel:${lead.alternate_mobile}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhoneNumber(lead.alternate_mobile)}
                    </a>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{lead.email || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Area</p>
                  <p className="font-medium">{lead.area || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pincode</p>
                  <p className="font-medium">{lead.pincode || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lead Source</p>
                  <p className="font-medium">{lead.lead_source}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Mobile</Label>
                  <Input
                    value={formData.alternate_mobile}
                    onChange={(e) => setFormData({ ...formData, alternate_mobile: e.target.value })}
                    className="border-black"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-black"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="border-black"
                    placeholder="e.g., Koramangala"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="border-black"
                    placeholder="e.g., 560095"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Device Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-black flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Device Information
            </h3>

            {mode === "view" ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Device Type</p>
                  <p className="font-medium">{lead.device_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Model</p>
                  <p className="font-medium">{lead.device_model}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Issue Reported</p>
                  <p className="font-medium">{lead.issue_reported}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Select
                    value={formData.device_type}
                    onValueChange={(v) => setFormData({ ...formData, device_type: v, device_model: "", issue_reported: "" })}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DEVICE_MODELS).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={formData.device_model}
                    onValueChange={(v) => setFormData({ ...formData, device_model: v })}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceModels.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Issue</Label>
                  <Select
                    value={formData.issue_reported}
                    onValueChange={(v) => setFormData({ ...formData, issue_reported: v })}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceIssues.map((issue) => (
                        <SelectItem key={issue} value={issue}>{issue}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Assignment & Priority */}
          <div className="space-y-4">
            <h3 className="font-semibold text-black flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Assignment & Priority
            </h3>

            {mode === "view" ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Assigned To</p>
                  <p className="font-medium">{lead.staff?.full_name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Priority</p>
                  <p className="font-medium">
                    {["", "Critical", "High", "Medium", "Low", "Lowest"][lead.priority]}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDateTime(lead.created_at)}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select
                    value={formData.assigned_to || "__unassigned__"}
                    onValueChange={(v) => setFormData({ ...formData, assigned_to: v === "__unassigned__" ? "" : v })}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>{staff.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Critical</SelectItem>
                      <SelectItem value="2">High</SelectItem>
                      <SelectItem value="3">Medium</SelectItem>
                      <SelectItem value="4">Low</SelectItem>
                      <SelectItem value="5">Lowest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* PHASE 5: WORKFLOW STAGES */}

          {/* Stage 1: Acceptance Section - Show only if status is pending or null */}
          {lead && (!lead.acceptance_status || lead.acceptance_status === "pending") && (
            <>
              <LeadAcceptanceSection
                leadId={lead.id}
                customerName={lead.customer_name}
              />
              <Separator />
            </>
          )}

          {/* Stage 2: Invoice Creation - Show only if accepted, completed, and no invoice */}
          {lead &&
            lead.acceptance_status === "accepted" &&
            lead.status === "completed" &&
            !lead.invoice_id && (
              <>
                <InvoiceCreationSection
                  leadId={lead.id}
                  deviceModel={lead.device_model}
                  issue={lead.issue_reported}
                  onSuccess={onClose}
                />
                <Separator />
              </>
            )}

          {/* Stage 3: Invoice Display - Show only if invoice exists */}
          {lead && lead.invoice_id && lead.invoice && (
            <>
              <InvoiceDisplaySection invoice={lead.invoice} />
              <Separator />
            </>
          )}

          {/* Call Notes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Call Notes ({notes.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNote(!showAddNote)}
                className="border-black"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>

            {showAddNote && (
              <div className="space-y-3 p-4 border border-black rounded-lg bg-gray-50">
                <Textarea
                  placeholder="Enter call note..."
                  value={noteForm.note}
                  onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                  className="border-black"
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Duration (seconds)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 120"
                      value={noteForm.call_duration}
                      onChange={(e) => setNoteForm({ ...noteForm, call_duration: e.target.value })}
                      className="border-black"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Outcome</Label>
                    <Select
                      value={noteForm.outcome}
                      onValueChange={(v) => setNoteForm({ ...noteForm, outcome: v })}
                    >
                      <SelectTrigger className="border-black">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Connected">Connected</SelectItem>
                        <SelectItem value="No Answer">No Answer</SelectItem>
                        <SelectItem value="Callback">Callback Requested</SelectItem>
                        <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowAddNote(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddNote} disabled={isPending || !noteForm.note.trim()}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
                  </Button>
                </div>
              </div>
            )}

            {isLoadingNotes ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No call notes yet</p>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                    <p className="text-sm text-black">{note.note}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{note.staff?.full_name || "Unknown"}</span>
                      {note.outcome && (
                        <Badge variant="outline" className="text-xs">
                          {note.outcome}
                        </Badge>
                      )}
                      {note.call_duration && <span>{note.call_duration}s</span>}
                      <span>{formatDateTime(note.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {mode === "view" ? (
            <>
              <Button variant="outline" onClick={onClose} className="border-black">
                Close
              </Button>
              {canEdit && (
                <Button onClick={() => setMode("edit")}>
                  Edit Lead
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode("view")} className="border-black">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
