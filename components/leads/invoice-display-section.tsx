"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Send, Eye, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SimplifiedInvoice } from "@/lib/types";

interface InvoiceDisplaySectionProps {
  invoice: SimplifiedInvoice;
}

export function InvoiceDisplaySection({ invoice }: InvoiceDisplaySectionProps) {
  const router = useRouter();

  const handleViewInvoice = () => {
    router.push(`/invoices/${invoice.id}`);
  };

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  };

  const handleSendSMS = () => {
    toast.info("SMS integration coming soon!");
  };

  return (
    <Card className="border-green-600 bg-green-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Invoice Generated - Lead Delivered!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Invoice Summary */}
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-lg font-bold text-black">
                  {invoice.invoice_number}
                </p>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">DELIVERED</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Invoice Date</p>
                <p className="font-medium">
                  {new Date(invoice.invoice_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-bold text-green-600">
                  {formatCurrency(invoice.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">
                  {invoice.payment_method || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Payment Status</p>
                <Badge
                  variant={invoice.payment_status === "paid" ? "default" : "secondary"}
                  className={
                    invoice.payment_status === "paid"
                      ? "bg-green-600"
                      : "bg-yellow-500"
                  }
                >
                  {invoice.payment_status}
                </Badge>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Parts Cost:</span>
                <span>{formatCurrency(invoice.parts_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labor Cost:</span>
                <span>{formatCurrency(invoice.labor_cost)}</span>
              </div>
              {invoice.other_charges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Charges:</span>
                  <span>{formatCurrency(invoice.other_charges)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.gst_included && (
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%):</span>
                  <span>{formatCurrency(invoice.gst_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300">
                <span>Total:</span>
                <span className="text-green-600">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={handleViewInvoice}
              variant="outline"
              className="border-black hover:bg-gray-100"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="border-black hover:bg-gray-100"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={handleSendSMS}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Invoice SMS
            </Button>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Success!</strong> This lead has been marked as DELIVERED, an
                opportunity has been created, and the customer's lifetime value has
                been updated.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
