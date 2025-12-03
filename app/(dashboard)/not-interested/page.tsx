import { createClient } from "@/lib/supabase/server";
import { LeadsPageClient } from "../leads/client";
import type { Lead, Staff, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotInterestedPage() {
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

  const currentUserRole = (currentStaff?.role as UserRole) || "sell_executive";
  const currentStaffId = currentStaff?.id;

  // Build query based on role - filter by workflow_status = 'Not Interested'
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
      )
    `
    )
    .eq("workflow_status", "Not Interested")
    .order("created_at", { ascending: false });

  // Telecallers only see their assigned leads
  if (currentUserRole === "sell_executive" && currentStaffId) {
    leadsQuery = leadsQuery.eq("assigned_to", currentStaffId);
  }

  const { data: leads, error } = await leadsQuery;

  if (error) {
    console.error("Error fetching not interested leads:", error);
  }

  // Get staff list for assignment dropdown
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("is_active", true)
    .in("role", ["sell_executive", "operation_manager", "super_admin"])
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Not Interested</h1>
        <p className="text-muted-foreground">
          Leads that are not interested in the service
        </p>
      </div>
      <LeadsPageClient
        leads={(leads as Lead[]) || []}
        staffList={(staffList as Staff[]) || []}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
