"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, CheckCircle } from "lucide-react";
import { generateInvoiceFromLead } from "@/app/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface InvoiceCreationSectionProps {
  leadId: string;
  deviceModel: string;
  issue: string;
  onSuccess?: () => void;
}

export function InvoiceCreationSection({
  leadId,
  deviceModel,
  issue,
  onSuccess,
}: InvoiceCreationSectionProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  // Form state
  const [partsCost, setPartsCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [otherCharges, setOtherCharges] = useState("0");
  const [gstIncluded, setGstIncluded] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("paid");

  // Calculated values
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Calculate totals whenever inputs change
  useEffect(() => {
    const parts = parseFloat(partsCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const other = parseFloat(otherCharges) || 0;

    const sub = parts + labor + other;
    const gst = gstIncluded ? (sub * 18) / 100 : 0;
    const tot = sub + gst;

    setSubtotal(sub);
    setGstAmount(gst);
    setTotal(tot);
  }, [partsCost, laborCost, otherCharges, gstIncluded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partsCost || parseFloat(partsCost) <= 0) {
      toast.error("Please enter parts cost");
      return;
    }
    if (!laborCost || parseFloat(laborCost) <= 0) {
      toast.error("Please enter labor cost");
      return;
    }

    setCreating(true);

    const result = await generateInvoiceFromLead(leadId, {
      parts_cost: parseFloat(partsCost),
      labor_cost: parseFloat(laborCost),
      other_charges: parseFloat(otherCharges) || 0,
      gst_included: gstIncluded,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    });

    if (result.success && result.data) {
      toast.success(
        `Invoice ${result.data.invoice_number} created successfully! Lead marked as DELIVERED.`
      );

      // Close the modal and refresh
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } else {
      toast.error(result.error || "Failed to generate invoice");
      setCreating(false);
    }
  };

  return (
    <Card className="border-green-400 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Repair Completed - Create Invoice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Repair Description */}
          <div>
            <Label>Repair Description</Label>
            <Input
              value={`${deviceModel} - ${issue}`}
              readOnly
              className="mt-1 bg-white border-black"
            />
          </div>

          {/* Costs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="parts_cost">
                Parts Cost (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="parts_cost"
                type="number"
                min="0"
                step="0.01"
                value={partsCost}
                onChange={(e) => setPartsCost(e.target.value)}
                className="mt-1 border-black"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="labor_cost">
                Labor Cost (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="labor_cost"
                type="number"
                min="0"
                step="0.01"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                className="mt-1 border-black"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="other_charges">Other Charges (₹)</Label>
              <Input
                id="other_charges"
                type="number"
                min="0"
                step="0.01"
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                className="mt-1 border-black"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* GST Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gst"
              checked={gstIncluded}
              onCheckedChange={(checked) => setGstIncluded(checked as boolean)}
            />
            <Label
              htmlFor="gst"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Include GST (18%)
            </Label>
          </div>

          {/* Totals Summary */}
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {gstIncluded && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-medium">{formatCurrency(gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_status">
                Payment Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentStatus}
                onValueChange={(value) => setPaymentStatus(value as "pending" | "paid")}
              >
                <SelectTrigger className="mt-1 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={creating || !partsCost || !laborCost}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Generate Invoice & Mark as Delivered
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-600">
            This will create an invoice, mark the lead as DELIVERED, create an opportunity,
            and update customer lifetime value.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
