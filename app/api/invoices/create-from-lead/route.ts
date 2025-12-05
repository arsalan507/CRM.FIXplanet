import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      leadId,
      customerName,
      customerPhone,
      customerEmail,
      deviceType,
      deviceModel,
      issue,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      total,
      notes,
      terms,
    } = body;

    // Generate invoice number
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(5, "0")}`;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        lead_id: leadId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        device_type: deviceType,
        device_model: deviceModel,
        issue: issue,
        items: lineItems,
        subtotal: subtotal,
        gst_included: taxRate > 0,
        gst_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: total,
        notes: notes,
        terms_conditions: terms,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }

    // Update lead with invoice_id
    const { error: updateError } = await supabase
      .from("leads")
      .update({ invoice_id: invoice.id })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error updating lead:", updateError);
    }

    return NextResponse.json(
      { success: true, invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in invoice creation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
