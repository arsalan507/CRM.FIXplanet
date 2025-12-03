import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type ActivityAction =
  | "lead_created" | "lead_updated" | "lead_status_changed" | "lead_assigned" | "lead_deleted"
  | "customer_created" | "customer_updated" | "customer_deleted"
  | "opportunity_created" | "opportunity_moved" | "opportunity_won" | "opportunity_lost"
  | "call_made" | "note_added"
  | "staff_added" | "staff_updated" | "staff_role_changed" | "staff_deactivated"
  | "invoice_generated" | "payment_received"
  | "login_success" | "login_failed"
  | "bulk_operation";

export type ActivityEntity =
  | "lead" | "customer" | "opportunity" | "staff" | "invoice" | "call_note" | "system";

export interface LogActivityParams {
  action_type: ActivityAction;
  entity_type: ActivityEntity;
  entity_id?: string;
  entity_name?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  user_id?: string; // Optional, will try to get from session if not provided
}

/**
 * Log an activity to the activity_logs table
 * Should be called in server actions after any data modification
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient();
    const headersList = await headers();

    // Get user agent and IP from headers
    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || undefined;

    // Get current user if not provided
    let userId = params.user_id;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get staff ID from auth user
        const { data: staff } = await supabase
          .from("staff")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        userId = staff?.id;
      }
    }

    // Insert activity log
    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      action_type: params.action_type,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      entity_name: params.entity_name,
      old_value: params.old_value,
      new_value: params.new_value,
      metadata: params.metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      // Log error but don't throw - activity logging shouldn't break the main operation
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    // Silent fail - activity logging is secondary to the main operation
    console.error("Activity logging error:", error);
  }
}

/**
 * Helper to format action type for display
 */
export function formatActionType(action: ActivityAction): string {
  const actionLabels: Record<ActivityAction, string> = {
    lead_created: "created a lead",
    lead_updated: "updated a lead",
    lead_status_changed: "changed lead status",
    lead_assigned: "assigned a lead",
    lead_deleted: "deleted a lead",
    customer_created: "created a customer",
    customer_updated: "updated a customer",
    customer_deleted: "deleted a customer",
    opportunity_created: "created an opportunity",
    opportunity_moved: "moved an opportunity",
    opportunity_won: "won an opportunity",
    opportunity_lost: "lost an opportunity",
    call_made: "made a call",
    note_added: "added a note",
    staff_added: "added staff member",
    staff_updated: "updated staff member",
    staff_role_changed: "changed staff role",
    staff_deactivated: "deactivated staff member",
    invoice_generated: "generated an invoice",
    payment_received: "received a payment",
    login_success: "logged in",
    login_failed: "failed login attempt",
    bulk_operation: "performed bulk operation",
  };
  return actionLabels[action] || action;
}

/**
 * Get icon name for action type
 */
export function getActionIcon(action: ActivityAction): string {
  const actionIcons: Record<ActivityAction, string> = {
    lead_created: "UserPlus",
    lead_updated: "Edit",
    lead_status_changed: "RefreshCw",
    lead_assigned: "UserCheck",
    lead_deleted: "Trash2",
    customer_created: "UserPlus",
    customer_updated: "Edit",
    customer_deleted: "Trash2",
    opportunity_created: "Target",
    opportunity_moved: "ArrowRight",
    opportunity_won: "Trophy",
    opportunity_lost: "XCircle",
    call_made: "Phone",
    note_added: "MessageSquare",
    staff_added: "UserPlus",
    staff_updated: "Edit",
    staff_role_changed: "Shield",
    staff_deactivated: "UserX",
    invoice_generated: "FileText",
    payment_received: "DollarSign",
    login_success: "LogIn",
    login_failed: "AlertCircle",
    bulk_operation: "Layers",
  };
  return actionIcons[action] || "Activity";
}

/**
 * Get color for action type
 */
export function getActionColor(action: ActivityAction): string {
  if (action.includes("created") || action.includes("added") || action === "opportunity_won" || action === "payment_received") {
    return "text-green-600 bg-green-100";
  }
  if (action.includes("deleted") || action === "opportunity_lost" || action === "login_failed" || action === "staff_deactivated") {
    return "text-red-600 bg-red-100";
  }
  if (action.includes("updated") || action.includes("changed") || action.includes("moved") || action.includes("assigned")) {
    return "text-blue-600 bg-blue-100";
  }
  if (action === "call_made" || action === "note_added") {
    return "text-purple-600 bg-purple-100";
  }
  return "text-gray-600 bg-gray-100";
}
