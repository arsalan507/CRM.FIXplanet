export type UserRole = "super_admin" | "admin" | "technician" | "sell_executive" | "operation_manager";
export type LeadStatus = "new" | "contacted" | "interested" | "quoted" | "won" | "lost" | "in_repair" | "completed" | "delivered";
export type LeadWorkflowStatus = "new" | "Order" | "Not Interested" | "Follow Up";
export type DeviceType = "iPhone" | "Apple Watch" | "MacBook" | "iPad";
export type OpportunityStage = "new" | "qualified" | "pickup" | "in_repair" | "closed_won" | "closed_lost";

export interface StaffPermissions extends Record<string, boolean | undefined> {
  search?: boolean;
  follow_up?: boolean;
  decline?: boolean;
  report?: boolean;
  add_source?: boolean;
  enquiry_form?: boolean;
  booking?: boolean;
  order?: boolean;
  not_repairable?: boolean;
  enquiry_not_verify?: boolean;
  add_lead_status?: boolean;
  enquiry?: boolean;
  invoice?: boolean;
  not_interested?: boolean;
  user?: boolean;
  add_products?: boolean;
}

export interface Staff {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  employee_id?: string | null;
  permissions?: StaffPermissions;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metrics?: StaffMetrics;
}

export interface StaffMetrics {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalCalls: number;
  avgCallDuration: number;
}

export interface Lead {
  id: string;
  customer_name: string;
  contact_number: string;
  email: string | null;
  alternate_mobile?: string | null;
  area?: string | null;
  pincode?: string | null;
  device_type: DeviceType;
  device_model: string;
  issue_reported: string;
  lead_source: string;
  status: LeadStatus;
  workflow_status?: LeadWorkflowStatus; // new, Booking, Order, Not Interested, Follow Up, Decline, Not Repairable
  follow_up_date?: string | null;
  assigned_to: string | null;
  priority: number;
  quoted_amount?: number;
  created_at: string;
  updated_at: string;
  // Turnaround time tracking
  first_contact_at?: string | null;
  pickup_completed_at?: string | null;
  repair_started_at?: string | null;
  repair_completed_at?: string | null;
  delivered_at?: string | null;
  // UTM & source attribution
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_page_url?: string | null;
  referrer_url?: string | null;
  // Acceptance workflow
  acceptance_status?: "pending" | "accepted" | "rejected";
  rejection_reason?: string | null;
  rejection_remarks?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  invoice_id?: string | null;
  staff?: Staff | { full_name: string };
  customer?: Customer;
  invoice?: SimplifiedInvoice;
  remarks?: LeadRemark[];
}

export interface CallNote {
  id: string;
  lead_id: string;
  staff_id: string;
  note: string;
  call_duration: number | null;
  outcome: string | null;
  created_at: string;
  staff?: Staff;
}

export interface LeadRemark {
  id: string;
  lead_id: string;
  staff_id: string;
  remark: string;
  status_changed_to: LeadWorkflowStatus | null;
  created_at: string;
  staff?: Staff;
}

export interface Customer {
  id: string;
  lead_id: string | null;
  customer_name: string;
  contact_number: string;
  email: string | null;
  address: string | null;
  city: string | null;
  total_repairs: number;
  lifetime_value: number;
  created_at: string;
  leads?: Lead[];
}

export interface Opportunity {
  id: string;
  lead_id: string;
  customer_name: string;
  contact_number: string;
  device_info: string;
  issue: string;
  stage: OpportunityStage;
  expected_revenue: number;
  actual_revenue?: number;
  assigned_to?: string;
  priority: number;
  created_at: string;
  staff?: { full_name: string };
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  inProgress: number;
  completed: number;
  conversion_rate: number;
}

export interface LeadsByStatus {
  status: LeadStatus;
  count: number;
}

export interface LeadsByDevice {
  device_type: DeviceType;
  count: number;
}

// Phase 5 SIMPLIFIED: Invoice Types

export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "partial";

export interface SimplifiedInvoice {
  id: string;
  invoice_number: string;
  lead_id: string | null;
  customer_id: string | null;

  // Customer Info (snapshot)
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;

  // Device Info (snapshot)
  device_type: string;
  device_model: string;
  issue: string;

  // Pricing (Simple)
  parts_cost: number;
  labor_cost: number;
  other_charges: number;
  subtotal: number;
  gst_included: boolean;
  gst_amount: number;
  total_amount: number;

  // Payment
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  paid_at: string | null;

  // PDF
  pdf_url: string | null;

  // Metadata
  invoice_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  created_by_staff?: Staff;
  lead?: Lead;
  customer?: Customer;
}

// Legacy complex types (keep for backward compatibility)
export type RepairStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PartsUsed {
  part: string;
  cost: number;
  quantity: number;
}

export interface Repair {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  device_type: string;
  device_model: string;
  issue: string;
  diagnosis: string | null;
  repair_notes: string | null;
  parts_used: PartsUsed[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  status: RepairStatus;
  technician_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  technician?: Staff;
  customer?: Customer;
  lead?: Lead;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  repair_id: string | null;
  customer_id: string | null;
  lead_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  // For SimplifiedInvoice compatibility
  device_type?: string;
  device_model?: string;
  issue?: string;
  parts_cost?: number;
  labor_cost?: number;
  other_charges?: number;
  gst_included?: boolean;
  gst_amount?: number;
  payment_method?: PaymentMethod | null;
  paid_at?: string | null;
  // Regular Invoice fields
  items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  amount_due: number | null;
  notes: string | null;
  terms_conditions: string | null;
  invoice_date: string;
  due_date: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  repair?: Repair;
  customer?: Customer;
  payments?: Payment[];
  created_by_staff?: Staff;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  payment_date: string;
  notes: string | null;
  received_by: string | null;
  created_at: string;
  invoice?: Invoice;
  received_by_staff?: Staff;
}

export interface PartsInventory {
  id: string;
  part_name: string;
  device_type: string | null;
  compatible_models: string[];
  category: string | null;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  min_stock_level: number;
  supplier: string | null;
  supplier_contact: string | null;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}
