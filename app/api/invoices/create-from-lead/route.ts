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

    // Get staff record for created_by field
    const { data: staffData } = await supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

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
      total,
      terms,
    } = body;

    // Generate invoice number
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(5, "0")}`;

    // Calculate parts_cost (sum of all line items)
    const parts_cost = lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);

    // Create invoice using SimplifiedInvoice format
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
        parts_cost: parts_cost,
        labor_cost: 0,
        other_charges: 0,
        subtotal: subtotal,
        gst_included: taxRate > 0,
        gst_amount: taxAmount,
        total_amount: total,
        payment_status: 'pending',
        paid_at: null,
        pdf_url: null,
        terms_conditions: terms,
        invoice_date: new Date().toISOString(),
        created_by: staffData?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
