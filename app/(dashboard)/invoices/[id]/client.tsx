"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice, Payment, Staff } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  DollarSign,
  Loader2,
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { recordPayment } from "@/app/actions/invoices";
import { toast } from "sonner";

interface InvoiceDetailClientProps {
  invoice: Invoice;
  payments: Payment[];
  currentStaff: Staff | null;
}

export function InvoiceDetailClient({
  invoice,
  payments,
  currentStaff,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentNotes, setPaymentNotes] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "pending":
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amountDue = invoice.payment_status === 'paid' ? 0 : invoice.total_amount;
    if (amount > amountDue) {
      toast.error("Payment amount cannot exceed due amount");
      return;
    }

    setPaymentLoading(true);

    const result = await recordPayment({
      invoice_id: invoice.id,
      amount,
      payment_method: paymentMethod as any,
      transaction_id: transactionId || undefined,
      payment_date: paymentDate,
      notes: paymentNotes || undefined,
    });

    if (result.success) {
      toast.success("Payment recorded successfully");
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setTransactionId("");
      setPaymentNotes("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to record payment");
    }

    setPaymentLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/invoices")}
            className="border border-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-black">
                {invoice.invoice_number}
              </h1>
              {getStatusBadge(invoice.payment_status)}
            </div>
            <p className="text-sm text-gray-500">
              Created on {formatDate(invoice.invoice_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
            }}
            className="border-black"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("SMS sending coming soon")}
            className="border-black"
          >
            <Send className="mr-2 h-4 w-4" />
            Send SMS
          </Button>
          {invoice.payment_status !== "paid" && (
            <Button
              onClick={() => setPaymentModalOpen(true)}
              className="bg-black hover:bg-gray-800"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{invoice.customer_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{invoice.customer_phone}</span>
              </div>
              {invoice.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{invoice.customer_email}</span>
                </div>
              )}
              {invoice.customer_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{invoice.customer_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Line Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left py-3 font-semibold">Description</th>
                    <th className="text-center py-3 font-semibold w-20">Qty</th>
                    <th className="text-right py-3 font-semibold w-32">Rate</th>
                    <th className="text-right py-3 font-semibold w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3">Parts Cost</td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-right">
                      {formatCurrency(invoice.parts_cost)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(invoice.parts_cost)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3">Labor Cost</td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-right">
                      {formatCurrency(invoice.labor_cost)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(invoice.labor_cost)}
                    </td>
                  </tr>
                  {invoice.other_charges > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-3">Other Charges</td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right">
                        {formatCurrency(invoice.other_charges)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(invoice.other_charges)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={3} className="py-2 text-right font-medium">
                      Subtotal:
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                  </tr>
                  {invoice.gst_included && (
                    <tr>
                      <td colSpan={3} className="py-2 text-right">
                        GST (18%):
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(invoice.gst_amount)}
                      </td>
                    </tr>
                  )}
                  {invoice.discount_amount && invoice.discount_amount > 0 && (
                    <tr className="text-green-600">
                      <td colSpan={3} className="py-2 text-right">
                        Discount:
                      </td>
                      <td className="py-2 text-right">
                        -{formatCurrency(invoice.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-black">
                    <td colSpan={3} className="py-3 text-right font-bold text-lg">
                      Total:
                    </td>
                    <td className="py-3 text-right font-bold text-lg">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes and Terms - Not included in simplified schema */}
            {false && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Notes:
                  </p>
                  <p className="text-sm text-gray-600">Simplified invoice schema</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Terms &amp; Conditions:
                  </p>
                  <p className="text-sm text-gray-600">
                    {invoice.terms_conditions}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Payment Summary & History */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Amount Paid:</span>
                <span className="font-semibold">
                  {formatCurrency(invoice.amount_paid)}
                </span>
              </div>
              <div className="flex justify-between text-red-600 pt-3 border-t border-gray-200">
                <span className="font-semibold">Amount Due:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(invoice.amount_due || 0)}
                </span>
              </div>

              {invoice.due_date && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(invoice.due_date)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-black p-6">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No payments recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-lg">
                        {formatCurrency(payment.amount)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize border-black"
                      >
                        {payment.payment_method}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(payment.payment_date)}</span>
                      </div>
                      {payment.transaction_id && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>Txn: {payment.transaction_id}</span>
                        </div>
                      )}
                      {payment.received_by_staff && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            By: {payment.received_by_staff.full_name}
                          </span>
                        </div>
                      )}
                      {payment.notes && (
                        <p className="mt-2 text-gray-700">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                max={invoice.amount_due || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 border-black"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Due amount: {formatCurrency(invoice.amount_due || 0)}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">
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
              <Label htmlFor="paymentDate">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1 border-black"
                required
              />
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1 border-black"
                placeholder="Enter transaction ID"
              />
            </div>

            <div>
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="mt-1 border-black"
                placeholder="Any additional notes"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
                disabled={paymentLoading}
                className="border-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={paymentLoading}
                className="bg-black hover:bg-gray-800"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
