"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadRemark, LeadWorkflowStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  ArrowLeft,
  Smartphone,
  AlertCircle,
  FileText,
  Save,
  Edit,
} from "lucide-react";
import { InlineInvoiceForm } from "@/components/invoices/inline-invoice-form";

interface LeadDetailClientProps {
  lead: Lead;
  remarks: LeadRemark[];
}

export default function LeadDetailClient({
  lead: initialLead,
  remarks: initialRemarks,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [remarks, setRemarks] = useState<LeadRemark[]>(initialRemarks);
  const [newRemark, setNewRemark] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    LeadWorkflowStatus | ""
  >("");
  const [followUpDate, setFollowUpDate] = useState<string>(
    lead.follow_up_date || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable lead data
  const [editedLead, setEditedLead] = useState({
    customer_name: lead.customer_name,
    contact_number: lead.contact_number,
    email: lead.email || "",
    alternate_mobile: lead.alternate_mobile || "",
    area: lead.area || "",
    pincode: lead.pincode || "",
    device_type: lead.device_type,
    device_model: lead.device_model,
    issue_reported: lead.issue_reported,
  });

  const handleSaveLead = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedLead),
      });

      if (!response.ok) {
        throw new Error("Failed to update lead");
      }

      const updatedLead = await response.json();

      // Update local state with the new data
      setLead({
        ...lead,
        ...editedLead,
      });

      toast.success("Lead updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRemark = async () => {
    if (!newRemark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/leads/${lead.id}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remark: newRemark,
          status_changed_to: selectedStatus || null,
          follow_up_date: followUpDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add remark");
      }

      toast.success("Remark added successfully");
      setNewRemark("");
      setSelectedStatus("");
      setFollowUpDate("");
      router.refresh();
    } catch (error) {
      console.error("Error adding remark:", error);
      toast.error("Failed to add remark");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "Order":
        return "bg-green-100 text-green-800";
      case "Not Interested":
        return "bg-red-100 text-red-800";
      case "Follow Up":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOrderStatus = lead.workflow_status === "Order";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/leads")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.customer_name}</h1>
            <p className="text-muted-foreground">
              Lead ID: {lead.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeColor(lead.workflow_status || "new")}>
            {lead.workflow_status || "new"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Details - Editable */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lead Information</CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedLead({
                      customer_name: lead.customer_name,
                      contact_number: lead.contact_number,
                      email: lead.email || "",
                      alternate_mobile: lead.alternate_mobile || "",
                      area: lead.area || "",
                      pincode: lead.pincode || "",
                      device_type: lead.device_type,
                      device_model: lead.device_model,
                      issue_reported: lead.issue_reported,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveLead}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={editedLead.customer_name}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_number">Contact Number</Label>
                  <Input
                    id="contact_number"
                    value={editedLead.contact_number}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        contact_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedLead.email}
                    onChange={(e) =>
                      setEditedLead({ ...editedLead, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternate_mobile">Alternate Mobile</Label>
                  <Input
                    id="alternate_mobile"
                    value={editedLead.alternate_mobile}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        alternate_mobile: e.target.value,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={editedLead.area}
                    onChange={(e) =>
                      setEditedLead({ ...editedLead, area: e.target.value })
                    }
                    placeholder="e.g., Koramangala"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={editedLead.pincode}
                    onChange={(e) =>
                      setEditedLead({ ...editedLead, pincode: e.target.value })
                    }
                    placeholder="e.g., 560095"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device_type">Device Type</Label>
                  <Select
                    value={editedLead.device_type}
                    onValueChange={(value) =>
                      setEditedLead({ ...editedLead, device_type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iPhone">iPhone</SelectItem>
                      <SelectItem value="iPad">iPad</SelectItem>
                      <SelectItem value="MacBook">MacBook</SelectItem>
                      <SelectItem value="Apple Watch">Apple Watch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device_model">Device Model</Label>
                  <Input
                    id="device_model"
                    value={editedLead.device_model}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        device_model: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue_reported">Issue Reported</Label>
                  <Textarea
                    id="issue_reported"
                    value={editedLead.issue_reported}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        issue_reported: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contact:</span>
                  <span>{lead.contact_number}</span>
                </div>

                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{lead.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Alternate Mobile:</span>
                  {lead.alternate_mobile ? (
                    <a
                      href={`tel:${lead.alternate_mobile}`}
                      className="text-blue-600 hover:underline"
                    >
                      {lead.alternate_mobile}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Area:</span>
                  <span className={lead.area ? "" : "text-muted-foreground"}>
                    {lead.area || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Pincode:</span>
                  <span className={lead.pincode ? "" : "text-muted-foreground"}>
                    {lead.pincode || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Device:</span>
                  <span>
                    {lead.device_type} - {lead.device_model}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Issue:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lead.issue_reported}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Remark */}
        <Card>
          <CardHeader>
            <CardTitle>Add Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Remark</label>
              <Textarea
                placeholder="Add your remark here (e.g., 'Called the customer, will call back in 10 minutes')"
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Change Status (Optional)
              </label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as LeadWorkflowStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Order">Order</SelectItem>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_date">
                Follow Up Date (Optional)
              </Label>
              <Input
                id="follow_up_date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmitRemark}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Update"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Remarks Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {remarks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No remarks yet. Add the first update above.
            </p>
          ) : (
            <div className="space-y-4">
              {remarks.map((remark) => (
                <div
                  key={remark.id}
                  className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        {remark.staff &&
                        typeof remark.staff === "object" &&
                        "full_name" in remark.staff
                          ? remark.staff.full_name
                          : "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(remark.created_at), {
                          addSuffix: true,
                        })}{" "}
                        • {new Date(remark.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                    {remark.status_changed_to && (
                      <Badge
                        className={getStatusBadgeColor(
                          remark.status_changed_to
                        )}
                      >
                        → {remark.status_changed_to}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{remark.remark}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Form - Only show for Order status */}
      {isOrderStatus && (
        <InlineInvoiceForm
          leadId={lead.id}
          customerName={lead.customer_name}
          customerPhone={lead.contact_number}
          customerEmail={lead.email}
          deviceType={lead.device_type}
          deviceModel={lead.device_model}
          issue={lead.issue_reported}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
