"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";

export async function getCustomers(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select(`
      *,
      leads:lead_id (
        id,
        device_type,
        device_model,
        issue_reported,
        status,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,contact_number.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (customerError) {
    return { success: false, error: customerError.message };
  }

  // Get all leads for this customer by phone number or linked via customers.lead_id
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      *,
      staff:assigned_to (full_name)
    `)
    .eq("contact_number", customer.contact_number)
    .order("created_at", { ascending: false });

  // Get all call notes for these leads
  const leadIds = leads?.map((l) => l.id) || [];
  let callNotes: Array<{
    id: string;
    lead_id: string;
    note: string;
    call_duration: number | null;
    outcome: string | null;
    created_at: string;
    staff?: { full_name: string };
    lead?: { device_type: string; device_model: string };
  }> = [];

  if (leadIds.length > 0) {
    const { data: notes } = await supabase
      .from("call_notes")
      .select(`
        *,
        staff:staff_id (full_name),
        lead:lead_id (device_type, device_model)
      `)
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });
    callNotes = notes || [];
  }

  // Calculate stats
  const totalRepairs = customer.total_repairs || leads?.length || 0;
  const completedRepairs = leads?.filter((l) => l.status === "won").length || 0;

  return {
    success: true,
    data: {
      ...customer,
      leads: leads || [],
      callNotes,
      stats: {
        totalRepairs,
        completedRepairs,
        totalSpent: customer.lifetime_value || 0,
      },
    },
  };
}

export async function createCustomer(data: {
  customer_name: string;
  contact_number: string;
  email?: string;
  address?: string;
  city?: string;
}) {
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      customer_name: data.customer_name.trim(),
      contact_number: data.contact_number.replace(/\D/g, "").slice(-10),
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || "Bengaluru",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "customer_created",
    entity_type: "customer",
    entity_id: customer.id,
    entity_name: customer.customer_name,
    new_value: { contact_number: customer.contact_number, email: customer.email },
  });

  revalidatePath("/customers");
  return { success: true, data: customer };
}

export async function updateCustomer(
  id: string,
  data: {
    customer_name?: string;
    contact_number?: string;
    email?: string;
    address?: string;
    city?: string;
    lifetime_value?: number;
    total_repairs?: number;
  }
) {
  const supabase = await createClient();

  // Get current customer for activity log
  const { data: oldCustomer } = await supabase
    .from("customers")
    .select("customer_name")
    .eq("id", id)
    .single();

  const updateData: Record<string, unknown> = {};
  if (data.customer_name) updateData.customer_name = data.customer_name.trim();
  if (data.contact_number) updateData.contact_number = data.contact_number.replace(/\D/g, "").slice(-10);
  if (data.email !== undefined) updateData.email = data.email?.trim() || null;
  if (data.address !== undefined) updateData.address = data.address?.trim() || null;
  if (data.city !== undefined) updateData.city = data.city?.trim() || null;
  if (data.lifetime_value !== undefined) updateData.lifetime_value = data.lifetime_value;
  if (data.total_repairs !== undefined) updateData.total_repairs = data.total_repairs;

  const { error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "customer_updated",
    entity_type: "customer",
    entity_id: id,
    entity_name: oldCustomer?.customer_name || data.customer_name,
    new_value: updateData,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();

  // Get customer for activity log before deleting
  const { data: customer } = await supabase
    .from("customers")
    .select("customer_name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity({
    action_type: "customer_deleted",
    entity_type: "customer",
    entity_id: id,
    entity_name: customer?.customer_name,
  });

  revalidatePath("/customers");
  return { success: true };
}

// Convert a lead to a customer when status becomes "won"
export async function convertLeadToCustomer(leadId: string, totalAmount: number) {
  const supabase = await createClient();

  // Get the lead details
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: "Lead not found" };
  }

  // Check if customer already exists
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, lifetime_value, total_repairs")
    .eq("contact_number", lead.contact_number)
    .single();

  if (existingCustomer) {
    // Update existing customer's lifetime value
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        lifetime_value: (existingCustomer.lifetime_value || 0) + totalAmount,
        total_repairs: (existingCustomer.total_repairs || 0) + 1,
      })
      .eq("id", existingCustomer.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity for updating existing customer
    await logActivity({
      action_type: "customer_updated",
      entity_type: "customer",
      entity_id: existingCustomer.id,
      entity_name: lead.customer_name,
      metadata: { lead_id: leadId, converted_from_lead: true, amount_added: totalAmount },
    });

    revalidatePath("/customers");
    return { success: true, customerId: existingCustomer.id };
  }

  // Create new customer
  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      lead_id: leadId,
      customer_name: lead.customer_name,
      contact_number: lead.contact_number,
      email: lead.email,
      lifetime_value: totalAmount,
      total_repairs: 1,
    })
    .select()
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  // Log activity for new customer created from lead conversion
  await logActivity({
    action_type: "customer_created",
    entity_type: "customer",
    entity_id: newCustomer.id,
    entity_name: newCustomer.customer_name,
    metadata: { lead_id: leadId, converted_from_lead: true },
  });

  revalidatePath("/customers");
  return { success: true, customerId: newCustomer.id };
}
