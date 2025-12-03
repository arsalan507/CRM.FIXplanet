"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import { revalidatePath } from "next/cache";
import type {
  Invoice,
  Payment,
  Repair,
  PartsInventory,
  InvoiceLineItem,
  PartsUsed,
} from "@/lib/types";

// ============================================
// INVOICE CRUD OPERATIONS
// ============================================

export async function getInvoices(filters?: {
  payment_status?: string;
  customer_name?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.payment_status) {
      query = query.eq("payment_status", filters.payment_status);
    }

    if (filters?.customer_name) {
      query = query.ilike("customer_name", `%${filters.customer_name}%`);
    }

    if (filters?.from_date) {
      query = query.gte("invoice_date", filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte("invoice_date", filters.to_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invoices:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Invoice[] };
  } catch (error) {
    console.error("Exception in getInvoices:", error);
    return { success: false, error: "Failed to fetch invoices" };
  }
}

export async function getInvoiceById(invoiceId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error) {
      console.error("Error fetching invoice:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Invoice };
  } catch (error) {
    console.error("Exception in getInvoiceById:", error);
    return { success: false, error: "Failed to fetch invoice" };
  }
}

export async function createInvoice(invoiceData: {
  repair_id?: string;
  customer_id?: string;
  lead_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  items: InvoiceLineItem[];
  tax_rate: number;
  discount_amount?: number;
  notes?: string;
  terms_conditions?: string;
  due_date?: string;
}) {
  try {
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

    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
    const tax_amount = (subtotal * invoiceData.tax_rate) / 100;
    const discount_amount = invoiceData.discount_amount || 0;
    const total_amount = subtotal + tax_amount - discount_amount;

    // Generate invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc("generate_invoice_number");

    if (invoiceNumberError || !invoiceNumberData) {
      console.error("Error generating invoice number:", invoiceNumberError);
      return { success: false, error: "Failed to generate invoice number" };
    }

    // Create invoice
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumberData,
        repair_id: invoiceData.repair_id,
        customer_id: invoiceData.customer_id,
        lead_id: invoiceData.lead_id,
        customer_name: invoiceData.customer_name,
        customer_phone: invoiceData.customer_phone,
        customer_email: invoiceData.customer_email,
        customer_address: invoiceData.customer_address,
        items: invoiceData.items,
        subtotal,
        tax_rate: invoiceData.tax_rate,
        tax_amount,
        discount_amount,
        total_amount,
        payment_status: "pending",
        amount_paid: 0,
        amount_due: total_amount,
        notes: invoiceData.notes,
        terms_conditions: invoiceData.terms_conditions,
        due_date: invoiceData.due_date,
        created_by: staff?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
      action_type: "invoice_created",
      entity_type: "invoice",
      entity_id: invoice.id,
      metadata: {
        invoice_number: invoiceNumberData,
        customer_name: invoiceData.customer_name,
        total_amount,
      },
    });

    revalidatePath("/invoices");
    return { success: true, data: invoice };
  } catch (error) {
    console.error("Exception in createInvoice:", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

export async function updateInvoice(
  invoiceId: string,
  updates: {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    items?: InvoiceLineItem[];
    tax_rate?: number;
    discount_amount?: number;
    notes?: string;
    terms_conditions?: string;
    due_date?: string;
  }
) {
  try {
    const supabase = await createClient();

    // If items changed, recalculate totals
    let calculatedFields = {};
    if (updates.items) {
      const subtotal = updates.items.reduce((sum, item) => sum + item.amount, 0);
      const tax_rate = updates.tax_rate || 18;
      const tax_amount = (subtotal * tax_rate) / 100;
      const discount_amount = updates.discount_amount || 0;
      const total_amount = subtotal + tax_amount - discount_amount;

      calculatedFields = {
        subtotal,
        tax_amount,
        total_amount,
      };
    }

    const { data, error } = await supabase
      .from("invoices")
      .update({
        ...updates,
        ...calculatedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice:", error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
      action_type: "invoice_updated",
      entity_type: "invoice",
      entity_id: invoiceId,
      metadata: { invoice_number: data.invoice_number },
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Exception in updateInvoice:", error);
    return { success: false, error: "Failed to update invoice" };
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const supabase = await createClient();

    // Get invoice details for logging
    const { data: invoice } = await supabase
      .from("invoices")
      .select("invoice_number, customer_name")
      .eq("id", invoiceId)
      .single();

    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);

    if (error) {
      console.error("Error deleting invoice:", error);
      return { success: false, error: error.message };
    }

    // Log activity
    if (invoice) {
      await logActivity({
        action_type: "invoice_deleted",
        entity_type: "invoice",
        entity_id: invoiceId,
        metadata: {
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
        },
      });
    }

    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    console.error("Exception in deleteInvoice:", error);
    return { success: false, error: "Failed to delete invoice" };
  }
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

export async function recordPayment(paymentData: {
  invoice_id: string;
  amount: number;
  payment_method: "cash" | "upi" | "card" | "bank_transfer";
  transaction_id?: string;
  payment_date: string;
  notes?: string;
}) {
  try {
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

    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", paymentData.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: paymentData.invoice_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id,
        payment_date: paymentData.payment_date,
        notes: paymentData.notes,
        received_by: staff?.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
      return { success: false, error: paymentError.message };
    }

    // Update invoice amount_paid
    const newAmountPaid = invoice.amount_paid + paymentData.amount;
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
      })
      .eq("id", paymentData.invoice_id);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      return { success: false, error: updateError.message };
    }

    // Log activity
    await logActivity({
      action_type: "payment_recorded",
      entity_type: "payment",
      entity_id: payment.id,
      metadata: {
        invoice_number: invoice.invoice_number,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
      },
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${paymentData.invoice_id}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error("Exception in recordPayment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

export async function getPaymentsByInvoice(invoiceId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        received_by_staff:staff!payments_received_by_fkey(id, full_name, email)
      `
      )
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Payment[] };
  } catch (error) {
    console.error("Exception in getPaymentsByInvoice:", error);
    return { success: false, error: "Failed to fetch payments" };
  }
}

// ============================================
// REPAIR OPERATIONS
// ============================================

export async function createRepair(repairData: {
  lead_id?: string;
  customer_id?: string;
  device_type: string;
  device_model: string;
  issue: string;
  diagnosis?: string;
  repair_notes?: string;
  parts_used?: PartsUsed[];
  labor_cost: number;
  parts_cost: number;
  technician_id?: string;
}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("repairs")
      .insert({
        ...repairData,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating repair:", error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
      action_type: "repair_started",
      entity_type: "repair",
      entity_id: data.id,
      metadata: {
        device_type: repairData.device_type,
        device_model: repairData.device_model,
      },
    });

    revalidatePath("/repairs");
    return { success: true, data };
  } catch (error) {
    console.error("Exception in createRepair:", error);
    return { success: false, error: "Failed to create repair" };
  }
}

export async function updateRepairStatus(
  repairId: string,
  status: "pending" | "in_progress" | "completed" | "cancelled",
  updates?: {
    diagnosis?: string;
    repair_notes?: string;
    parts_used?: PartsUsed[];
    labor_cost?: number;
    parts_cost?: number;
  }
) {
  try {
    const supabase = await createClient();

    const now = new Date().toISOString();
    const updateData: any = {
      status,
      ...updates,
    };

    // Track timestamps
    if (status === "in_progress") {
      updateData.started_at = now;
    } else if (status === "completed") {
      updateData.completed_at = now;
    }

    const { data, error } = await supabase
      .from("repairs")
      .update(updateData)
      .eq("id", repairId)
      .select()
      .single();

    if (error) {
      console.error("Error updating repair:", error);
      return { success: false, error: error.message };
    }

    // Log activity
    let actionType: "repair_started" | "repair_completed" | "repair_updated" = "repair_updated";
    if (status === "in_progress") actionType = "repair_started";
    if (status === "completed") actionType = "repair_completed";

    await logActivity({
      action_type: actionType,
      entity_type: "repair",
      entity_id: repairId,
      metadata: { status },
    });

    revalidatePath("/repairs");
    revalidatePath(`/repairs/${repairId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Exception in updateRepairStatus:", error);
    return { success: false, error: "Failed to update repair" };
  }
}

export async function getRepairs(filters?: {
  status?: string;
  technician_id?: string;
  customer_id?: string;
  limit?: number;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("repairs")
      .select(
        `
        *,
        technician:staff!repairs_technician_id_fkey(id, full_name, email),
        customer:customers(*),
        lead:leads(*)
      `
      )
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.technician_id) {
      query = query.eq("technician_id", filters.technician_id);
    }

    if (filters?.customer_id) {
      query = query.eq("customer_id", filters.customer_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching repairs:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Repair[] };
  } catch (error) {
    console.error("Exception in getRepairs:", error);
    return { success: false, error: "Failed to fetch repairs" };
  }
}

// ============================================
// PARTS INVENTORY OPERATIONS
// ============================================

export async function getPartsInventory(filters?: {
  device_type?: string;
  category?: string;
  low_stock?: boolean;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("parts_inventory")
      .select("*")
      .order("part_name", { ascending: true });

    if (filters?.device_type) {
      query = query.eq("device_type", filters.device_type);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.low_stock) {
      query = query.lte("quantity_in_stock", supabase.rpc("min_stock_level"));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching parts inventory:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PartsInventory[] };
  } catch (error) {
    console.error("Exception in getPartsInventory:", error);
    return { success: false, error: "Failed to fetch parts inventory" };
  }
}

export async function getLowStockItems() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_low_stock_items");

    if (error) {
      console.error("Error fetching low stock items:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PartsInventory[] };
  } catch (error) {
    console.error("Exception in getLowStockItems:", error);
    return { success: false, error: "Failed to fetch low stock items" };
  }
}

export async function updatePartStock(partId: string, quantity_in_stock: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("parts_inventory")
      .update({
        quantity_in_stock,
        last_restocked_at: new Date().toISOString(),
      })
      .eq("id", partId)
      .select()
      .single();

    if (error) {
      console.error("Error updating part stock:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/inventory");
    return { success: true, data };
  } catch (error) {
    console.error("Exception in updatePartStock:", error);
    return { success: false, error: "Failed to update part stock" };
  }
}

// ============================================
// REVENUE METRICS
// ============================================

export async function getRevenueMetrics(daysBack: number = 30) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_revenue_metrics", {
      days_back: daysBack,
    });

    if (error) {
      console.error("Error fetching revenue metrics:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception in getRevenueMetrics:", error);
    return { success: false, error: "Failed to fetch revenue metrics" };
  }
}

export async function getInvoiceAgingReport() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .in("payment_status", ["pending", "partial"])
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching aging report:", error);
      return { success: false, error: error.message };
    }

    // Group by aging buckets
    const now = new Date();
    const aging = {
      current: [] as Invoice[],
      overdue_1_30: [] as Invoice[],
      overdue_31_60: [] as Invoice[],
      overdue_60_plus: [] as Invoice[],
    };

    data.forEach((invoice: Invoice) => {
      if (!invoice.due_date) {
        aging.current.push(invoice);
        return;
      }

      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        aging.current.push(invoice);
      } else if (daysOverdue <= 30) {
        aging.overdue_1_30.push(invoice);
      } else if (daysOverdue <= 60) {
        aging.overdue_31_60.push(invoice);
      } else {
        aging.overdue_60_plus.push(invoice);
      }
    });

    return { success: true, data: aging };
  } catch (error) {
    console.error("Exception in getInvoiceAgingReport:", error);
    return { success: false, error: "Failed to fetch aging report" };
  }
}
