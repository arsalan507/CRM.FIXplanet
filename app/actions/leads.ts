"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import type { LeadStatus } from "@/lib/types";

export async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
  const supabase = await createClient();

  // First get the lead data for potential conversion
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  const oldStatus = lead?.status;

  // Prepare update object with timestamp tracking
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Auto-track turnaround timestamps based on status changes
  const now = new Date().toISOString();

  // Track first contact when moving from "new" to "contacted"
  if (oldStatus === "new" && newStatus === "contacted" && !lead?.first_contact_at) {
    updateData.first_contact_at = now;
  }

  // Track repair start when status changes to "in_repair"
  if (newStatus === "in_repair" && !lead?.repair_started_at) {
    updateData.repair_started_at = now;
  }

  // Track repair completion when moving from "in_repair" to won/completed
  if (oldStatus === "in_repair" && (newStatus === "won" || newStatus === "completed") && !lead?.repair_completed_at) {
    updateData.repair_completed_at = now;
  }

  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "lead_status_changed",
    entity_type: "lead",
    entity_id: leadId,
    entity_name: lead?.customer_name,
    old_value: { status: oldStatus },
    new_value: { status: newStatus },
  });

  // Auto-convert to customer when status = "won"
  if (newStatus === "won" && lead) {
    await autoConvertLeadToCustomer(lead);
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/customers");
  revalidatePath("/opportunities");
  return { success: true, converted: newStatus === "won" };
}

// Auto-convert lead to customer when won
async function autoConvertLeadToCustomer(lead: {
  id: string;
  customer_name: string;
  contact_number: string;
  email?: string | null;
  device_type: string;
  device_model: string;
  issue_reported: string;
  quoted_amount?: number;
}) {
  const supabase = await createClient();

  // Check if customer already exists for this lead
  const { data: existingByLead } = await supabase
    .from("customers")
    .select("id, lifetime_value, total_repairs")
    .eq("lead_id", lead.id)
    .single();

  if (existingByLead) {
    // Customer already linked, just update lifetime value
    await supabase
      .from("customers")
      .update({
        lifetime_value: (existingByLead.lifetime_value || 0) + (lead.quoted_amount || 0),
        total_repairs: (existingByLead.total_repairs || 0) + 1,
      })
      .eq("id", existingByLead.id);
    return;
  }

  // Check if customer exists by phone number
  const { data: existingCustomerByPhone } = await supabase
    .from("customers")
    .select("id, lifetime_value, total_repairs")
    .eq("contact_number", lead.contact_number)
    .single();

  if (existingCustomerByPhone) {
    // Update existing customer's lifetime value and link to this lead
    await supabase
      .from("customers")
      .update({
        lead_id: lead.id,
        lifetime_value: (existingCustomerByPhone.lifetime_value || 0) + (lead.quoted_amount || 0),
        total_repairs: (existingCustomerByPhone.total_repairs || 0) + 1,
      })
      .eq("id", existingCustomerByPhone.id);
  } else {
    // Create new customer
    const { error: createError } = await supabase
      .from("customers")
      .insert({
        lead_id: lead.id,
        customer_name: lead.customer_name,
        contact_number: lead.contact_number,
        email: lead.email || null,
        lifetime_value: lead.quoted_amount || 0,
        total_repairs: 1,
      });

    if (createError) {
      console.error("Failed to create customer:", createError);
    }
  }
}

// Manual convert lead to customer
export async function convertLeadToCustomer(leadId: string) {
  const supabase = await createClient();

  // Get lead data
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: "Lead not found" };
  }

  // Check if customer already exists for this lead
  const { data: existingByLead } = await supabase
    .from("customers")
    .select("id")
    .eq("lead_id", leadId)
    .single();

  if (existingByLead) {
    return { success: false, error: "Lead is already linked to a customer" };
  }

  // Check if customer exists by phone
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, total_repairs")
    .eq("contact_number", lead.contact_number)
    .single();

  let customerId: string;

  if (existingCustomer) {
    // Update existing customer to link this lead
    customerId = existingCustomer.id;
    await supabase
      .from("customers")
      .update({
        lead_id: leadId,
        total_repairs: (existingCustomer.total_repairs || 0) + 1,
      })
      .eq("id", customerId);
  } else {
    // Create new customer
    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert({
        lead_id: leadId,
        customer_name: lead.customer_name,
        contact_number: lead.contact_number,
        email: lead.email || null,
        lifetime_value: 0,
        total_repairs: 1,
      })
      .select()
      .single();

    if (createError || !newCustomer) {
      return { success: false, error: createError?.message || "Failed to create customer" };
    }
    customerId = newCustomer.id;
  }

  // Log activity
  await logActivity({
    action_type: "customer_created",
    entity_type: "customer",
    entity_id: customerId,
    entity_name: lead.customer_name,
    metadata: { lead_id: leadId, converted_from_lead: true },
  });

  revalidatePath("/leads");
  revalidatePath("/customers");
  return { success: true, customerId };
}

export async function assignLead(leadId: string, staffId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: staffId, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLead(
  leadId: string,
  data: {
    customer_name?: string;
    contact_number?: string;
    email?: string;
    device_type?: string;
    device_model?: string;
    issue_reported?: string;
    priority?: number;
    status?: LeadStatus;
    assigned_to?: string | null;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();

  // Check user role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user?.id)
    .single();

  if (staff?.role !== "super_admin") {
    return { success: false, error: "Only super admins can delete leads" };
  }

  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createLead(data: {
  customer_name: string;
  contact_number: string;
  email?: string;
  device_type: string;
  device_model: string;
  issue_reported: string;
  lead_source?: string;
  priority?: number;
  assigned_to?: string | null;
}) {
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      ...data,
      status: "new",
      priority: data.priority || 3,
      lead_source: data.lead_source || "Manual",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "lead_created",
    entity_type: "lead",
    entity_id: lead.id,
    entity_name: data.customer_name,
    new_value: { device: `${data.device_type} ${data.device_model}`, issue: data.issue_reported },
    metadata: { source: data.lead_source || "Manual" },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, data: lead };
}

export async function addCallNote(
  leadId: string,
  noteData: {
    note: string;
    call_duration?: number;
    outcome?: string;
  }
) {
  const supabase = await createClient();

  // Get current staff ID
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user?.id)
    .single();

  if (!staff) {
    return { success: false, error: "Staff member not found" };
  }

  // Get lead info for activity log and timestamp tracking
  const { data: lead } = await supabase
    .from("leads")
    .select("customer_name, first_contact_at")
    .eq("id", leadId)
    .single();

  const { error } = await supabase.from("call_notes").insert({
    lead_id: leadId,
    staff_id: staff.id,
    note: noteData.note,
    call_duration: noteData.call_duration,
    outcome: noteData.outcome,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: noteData.call_duration ? "call_made" : "note_added",
    entity_type: "lead",
    entity_id: leadId,
    entity_name: lead?.customer_name,
    new_value: { outcome: noteData.outcome, duration: noteData.call_duration },
    user_id: staff.id,
  });

  // Update the lead's updated_at timestamp and track first contact if this is a call
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // If this is a call and first_contact_at not set, set it now
  if (noteData.call_duration && !lead?.first_contact_at) {
    updateData.first_contact_at = new Date().toISOString();
  }

  await supabase.from("leads").update(updateData).eq("id", leadId);

  revalidatePath("/leads");
  return { success: true };
}

export async function getLeadWithNotes(leadId: string) {
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(
      `
      *,
      staff:assigned_to (id, full_name, email)
    `
    )
    .eq("id", leadId)
    .single();

  if (leadError) {
    return { success: false, error: leadError.message };
  }

  const { data: notes, error: notesError } = await supabase
    .from("call_notes")
    .select(
      `
      *,
      staff:staff_id (id, full_name)
    `
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (notesError) {
    return { success: false, error: notesError.message };
  }

  return { success: true, data: { lead, notes } };
}

export async function getCustomerByLeadId(leadId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, customer_name")
    .eq("lead_id", leadId)
    .single();

  return { success: true, data: customer };
}

export async function getStaffList() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("is_active", true)
    .in("role", ["sell_executive", "technician", "operation_manager", "admin", "super_admin"])
    .order("full_name");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getNewLeadsCount(staffId?: string, role?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  // Sell executives and technicians only see their assigned leads
  if (role && ["sell_executive", "technician"].includes(role) && staffId) {
    query = query.eq("assigned_to", staffId);
  }

  const { count, error } = await query;

  if (error) {
    return { success: false, error: error.message, count: 0 };
  }

  return { success: true, count: count || 0 };
}

// ============================================
// PHASE 5 SIMPLIFIED: LINEAR WORKFLOW ACTIONS
// ============================================

export async function acceptLead(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      acceptance_status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "lead_updated",
    entity_type: "lead",
    entity_id: leadId,
    metadata: { action: "accepted" },
  });

  revalidatePath("/leads");
  return { success: true, data };
}

export async function rejectLead(
  leadId: string,
  reason: string,
  remarks?: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      acceptance_status: "rejected",
      rejection_reason: reason,
      rejection_remarks: remarks,
      rejected_at: new Date().toISOString(),
      status: "lost",
    })
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "lead_updated",
    entity_type: "lead",
    entity_id: leadId,
    metadata: { action: "rejected", reason, remarks },
  });

  revalidatePath("/leads");
  return { success: true, data };
}

export async function generateInvoiceFromLead(
  leadId: string,
  invoiceData: {
    parts_cost: number;
    labor_cost: number;
    other_charges: number;
    gst_included: boolean;
    payment_method: string;
    payment_status: "pending" | "paid";
  }
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  // Get lead details
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*, customer:customers(*)")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: "Lead not found" };
  }

  // Calculate totals
  const subtotal =
    invoiceData.parts_cost + invoiceData.labor_cost + invoiceData.other_charges;
  const gst_amount = invoiceData.gst_included ? (subtotal * 18) / 100 : 0;
  const total_amount = subtotal + gst_amount;

  // Generate invoice number
  const { data: invoiceNumber, error: invoiceNumberError } = await supabase.rpc(
    "generate_invoice_number"
  );

  if (invoiceNumberError || !invoiceNumber) {
    return { success: false, error: "Failed to generate invoice number" };
  }

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      lead_id: leadId,
      customer_id: lead.customer?.id,
      customer_name: lead.customer_name,
      customer_phone: lead.contact_number,
      customer_email: lead.email,
      device_type: lead.device_type,
      device_model: lead.device_model,
      issue: lead.issue_reported,
      parts_cost: invoiceData.parts_cost,
      labor_cost: invoiceData.labor_cost,
      other_charges: invoiceData.other_charges,
      subtotal,
      gst_included: invoiceData.gst_included,
      gst_amount,
      total_amount,
      payment_method: invoiceData.payment_method,
      payment_status: invoiceData.payment_status,
      paid_at:
        invoiceData.payment_status === "paid"
          ? new Date().toISOString()
          : null,
      created_by: staff?.id,
    })
    .select()
    .single();

  if (invoiceError) {
    return { success: false, error: invoiceError.message };
  }

  // Update lead with invoice_id and mark as delivered
  const { error: updateLeadError } = await supabase
    .from("leads")
    .update({
      invoice_id: invoice.id,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateLeadError) {
    // Rollback invoice creation if lead update fails
    await supabase.from("invoices").delete().eq("id", invoice.id);
    console.error("Lead update error:", updateLeadError);
    return { success: false, error: `Failed to update lead status: ${updateLeadError.message}` };
  }

  // Create opportunity with closed_won status
  await supabase.from("opportunities").insert({
    lead_id: leadId,
    customer_name: lead.customer_name,
    contact_number: lead.contact_number,
    device_info: `${lead.device_type} ${lead.device_model}`,
    issue: lead.issue_reported,
    stage: "closed_won",
    expected_revenue: total_amount,
    actual_revenue: total_amount,
    assigned_to: lead.assigned_to,
    priority: lead.priority,
  });

  // Update customer lifetime_value if customer exists
  if (lead.customer?.id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("lifetime_value")
      .eq("id", lead.customer.id)
      .single();

    if (customer) {
      await supabase
        .from("customers")
        .update({
          lifetime_value: (customer.lifetime_value || 0) + total_amount,
          total_repairs: supabase.rpc("increment", { row_id: lead.customer.id }),
        })
        .eq("id", lead.customer.id);
    }
  }

  // Log activity
  await logActivity({
    action_type: "invoice_generated",
    entity_type: "invoice",
    entity_id: invoice.id,
    metadata: {
      invoice_number: invoiceNumber,
      lead_id: leadId,
      total_amount,
      payment_status: invoiceData.payment_status,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");

  return {
    success: true,
    data: {
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      total_amount,
    },
  };
}
