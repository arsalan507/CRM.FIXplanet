"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Receipt } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_TERMS = `Terms and condition
1. Delivery dates may be delayed due to the unavailability of spare parts and software.
2. All estimated costs are approximate and subject to change upon completion of the job.
3. All items taken for repair are at the customer's risk.
4. The company will make every effort to complete the job on time, but will not be held responsible for any delays due to unavoidable circumstances.
5. The company is not liable for damage to semi-defective parts during servicing, as certain parts may become damaged due to their fragility.
6. The company is not responsible for goods not collected within 30 days from the date of the job card.
7. If the job is not completed or the estimate is not approved, a minimum service charge of Rs. 299/-* will be applicable.
8. Devices damaged by liquids cannot be returned in the same condition after being opened.
9. For any warranty claims after 3 days, customers are advised to visit our service center. Onsite service for warranty claims will incur a minimum fee of Rs. 299/-.
10. Warranty, if applicable, is valid for the period specified from the date of this invoice. The warranty will be considered void in the event of any physical, pressure or water damage to the device. Service charges are not covered under warranty.
11. This is a computer-generated invoice; no signature is required.`;

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InlineInvoiceFormProps {
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deviceType: string;
  deviceModel: string;
  issue: string;
  onSuccess?: () => void;
}

export function InlineInvoiceForm({
  leadId,
  customerName,
  customerPhone,
  customerEmail,
  deviceType,
  deviceModel,
  issue,
  onSuccess,
}: InlineInvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 },
  ]);
  const [showTax, setShowTax] = useState(false);
  const [taxRate, setTaxRate] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate amounts
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const taxAmount = showTax ? (subtotal * taxRate) / 100 : 0;
  const total = subtotal + taxAmount - discountAmount;

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleGenerateInvoice = async () => {
    // Validation
    if (lineItems.some((item) => !item.description.trim())) {
      toast.error("Please fill in all item descriptions");
      return;
    }

    if (lineItems.some((item) => item.rate <= 0)) {
      toast.error("Please enter valid rates for all items");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/invoices/create-from-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          customerName,
          customerPhone,
          customerEmail,
          deviceType,
          deviceModel,
          issue,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
          subtotal,
          taxRate: showTax ? taxRate : 0,
          taxAmount,
          discountAmount,
          total,
          terms,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      const data = await response.json();

      toast.success("Invoice generated successfully!");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Generate Invoice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Line Items</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg"
              >
                <div className="col-span-5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, "description", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(
                        item.id,
                        "quantity",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Rate (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.rate}
                    onChange={(e) =>
                      updateLineItem(
                        item.id,
                        "rate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    value={(item.quantity * item.rate).toFixed(2)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="h-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-base font-semibold">Pricing</Label>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>

            {!showTax ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTax(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tax
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs flex-1">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                    className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTax(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Discount Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) =>
                  setDiscountAmount(parseFloat(e.target.value) || 0)
                }
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-2">
          <Label htmlFor="terms" className="text-base font-semibold">
            Terms & Conditions
          </Label>
          <Textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={12}
            className="font-mono text-xs"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateInvoice}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? "Generating..." : "Generate Invoice"}
        </Button>
      </CardContent>
    </Card>
  );
}
