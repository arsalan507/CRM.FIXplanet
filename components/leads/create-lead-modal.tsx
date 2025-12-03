"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DEVICE_MODELS, DEVICE_ISSUES, LEAD_SOURCES } from "@/lib/config";
import { createLead } from "@/app/actions/leads";
import type { Staff } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
}

export function CreateLeadModal({ isOpen, onClose, staffList }: CreateLeadModalProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    contact_number: "",
    email: "",
    device_type: "",
    device_model: "",
    issue_reported: "",
    lead_source: "Manual",
    priority: "3",
    assigned_to: "",
  });

  const resetForm = () => {
    setFormData({
      customer_name: "",
      contact_number: "",
      email: "",
      device_type: "",
      device_model: "",
      issue_reported: "",
      lead_source: "Manual",
      priority: "3",
      assigned_to: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.contact_number || !formData.device_type || !formData.device_model || !formData.issue_reported) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await createLead({
        customer_name: formData.customer_name,
        contact_number: formData.contact_number.replace(/\D/g, "").slice(-10),
        email: formData.email || undefined,
        device_type: formData.device_type,
        device_model: formData.device_model,
        issue_reported: formData.issue_reported,
        lead_source: formData.lead_source,
        priority: parseInt(formData.priority),
        assigned_to: formData.assigned_to || undefined,
      });

      if (result.success) {
        toast({ title: "Lead created", description: "New lead has been added successfully" });
        resetForm();
        onClose();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const deviceModels = DEVICE_MODELS[formData.device_type as keyof typeof DEVICE_MODELS] || [];
  const deviceIssues = DEVICE_ISSUES[formData.device_type as keyof typeof DEVICE_ISSUES] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Enter name"
                className="border-black"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number *</Label>
              <Input
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="10-digit mobile"
                className="border-black"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@email.com"
              className="border-black"
            />
          </div>

          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Device Type *</Label>
              <Select
                value={formData.device_type}
                onValueChange={(v) => setFormData({ ...formData, device_type: v, device_model: "", issue_reported: "" })}
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DEVICE_MODELS).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <Select
                value={formData.device_model}
                onValueChange={(v) => setFormData({ ...formData, device_model: v })}
                disabled={!formData.device_type}
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {deviceModels.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Issue *</Label>
            <Select
              value={formData.issue_reported}
              onValueChange={(v) => setFormData({ ...formData, issue_reported: v })}
              disabled={!formData.device_type}
            >
              <SelectTrigger className="border-black">
                <SelectValue placeholder="Select issue" />
              </SelectTrigger>
              <SelectContent>
                {deviceIssues.map((issue) => (
                  <SelectItem key={issue} value={issue}>{issue}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select
                value={formData.lead_source}
                onValueChange={(v) => setFormData({ ...formData, lead_source: v })}
              >
                <SelectTrigger className="border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
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
              <Label>Assign To</Label>
              <Select
                value={formData.assigned_to || "__auto_assign__"}
                onValueChange={(v) => setFormData({ ...formData, assigned_to: v === "__auto_assign__" ? "" : v })}
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Auto-assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto_assign__">Auto-assign</SelectItem>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>{staff.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-black">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
