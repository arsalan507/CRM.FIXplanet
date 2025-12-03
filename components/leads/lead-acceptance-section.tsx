"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { acceptLead, rejectLead } from "@/app/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LeadAcceptanceSectionProps {
  leadId: string;
  customerName: string;
}

const REJECTION_REASONS = [
  { value: "not_interested", label: "Not Interested" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "duplicate", label: "Duplicate Lead" },
  { value: "price_issue", label: "Price Issue" },
  { value: "other", label: "Other" },
];

export function LeadAcceptanceSection({
  leadId,
  customerName,
}: LeadAcceptanceSectionProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionRemarks, setRejectionRemarks] = useState("");

  const handleAccept = async () => {
    setAccepting(true);
    const result = await acceptLead(leadId);

    if (result.success) {
      toast.success("Lead accepted successfully!");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to accept lead");
    }
    setAccepting(false);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason) {
      toast.error("Please select a rejection reason");
      return;
    }

    setRejecting(true);
    const result = await rejectLead(leadId, rejectionReason, rejectionRemarks);

    if (result.success) {
      toast.success("Lead rejected");
      setShowRejectModal(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reject lead");
    }
    setRejecting(false);
  };

  return (
    <>
      <Card className="border-yellow-400 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Action Required: Accept or Reject Lead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Review the lead details for <strong>{customerName}</strong> and
            decide whether to accept or reject this lead.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Accept Lead
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowRejectModal(true)}
              variant="destructive"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Reject Lead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Reject Lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">
                Reason for Rejection <span className="text-red-500">*</span>
              </Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger className="mt-1 border-black">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="remarks">Additional Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="mt-1 border-black"
                placeholder="Any additional notes about this rejection..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={rejecting}
                className="border-black"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={rejecting || !rejectionReason}
                variant="destructive"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
