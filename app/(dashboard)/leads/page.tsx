import { createClient } from "@/lib/supabase/server";
import { LeadsPageClient } from "./client";
import type { Lead, Staff, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();

  // Get current user and their role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("id, role")
    .eq("auth_user_id", user?.id)
    .single();

  const currentUserRole = (currentStaff?.role as UserRole) || "sales_executive";
  const currentStaffId = currentStaff?.id;

  // Build query based on role - filter by workflow_status = 'new' or null
  let leadsQuery = supabase
    .from("leads")
    .select(
      `
      *,
      staff:assigned_to (
        id,
        full_name,
        email
      ),
      invoice:invoices!invoice_id (
        *
      ),
      remarks:lead_remarks (
        id,
        remark,
        created_at,
        staff:staff_id (
          full_name
        )
      )
    `
    )
    .or("workflow_status.eq.new,workflow_status.is.null")
    .order("created_at", { ascending: false });

  // Telecallers only see their assigned leads
  if (currentUserRole === "sales_executive" && currentStaffId) {
    leadsQuery = leadsQuery.eq("assigned_to", currentStaffId);
  }

  const { data: leads, error } = await leadsQuery;

  if (error) {
    console.error("Error fetching leads:", error);
  }

  // Get staff list for assignment dropdown
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("is_active", true)
    .in("role", ["sales_executive", "manager", "super_admin"])
    .order("full_name");

  return (
    <LeadsPageClient
      leads={(leads as Lead[]) || []}
      staffList={(staffList as Staff[]) || []}
      currentUserRole={currentUserRole}
      pageTitle="Enquiry"
      pageDescription={
        currentUserRole === "sales_executive"
          ? "Manage your assigned leads"
          : "Manage and track all incoming repair requests"
      }
      showNewLeadButton={true}
    />
  );
}
