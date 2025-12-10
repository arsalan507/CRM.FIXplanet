import { createClient } from "@/lib/supabase/server";
import { OpportunitiesPageClient } from "./client";
import type { UserRole, Lead, Staff } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const supabase = await createClient();

  // Get current user role
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

  // Get all leads with workflow_status (Order, Follow Up, Not Interested)
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
    .in("workflow_status", ["Order", "Follow Up", "Not Interested"])
    .order("created_at", { ascending: false });

  // Telecallers only see their assigned leads
  if (currentUserRole === "sales_executive" && currentStaffId) {
    leadsQuery = leadsQuery.eq("assigned_to", currentStaffId);
  }

  const { data: leads, error } = await leadsQuery;

  if (error) {
    console.error("Error fetching leads:", error);
  }

  // Get staff list
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("is_active", true)
    .order("full_name");

  // Calculate stats
  const allLeads = (leads as Lead[]) || [];
  const wonLeads = allLeads.filter(l => l.workflow_status === "Order");
  const lostLeads = allLeads.filter(l => l.workflow_status === "Not Interested");
  const pipelineLeads = allLeads.filter(l => l.workflow_status === "Follow Up");

  const totalPipeline = pipelineLeads.length;
  const won = wonLeads.length;
  const lost = lostLeads.length;
  const winRate = won + lost > 0 ? ((won / (won + lost)) * 100).toFixed(1) : "0";

  // Calculate revenue from invoices
  const revenueWon = wonLeads.reduce((sum, lead) => {
    if (lead.invoice && lead.invoice.total_amount) {
      return sum + parseFloat(lead.invoice.total_amount.toString());
    }
    return sum;
  }, 0);

  const pipelineValue = pipelineLeads.reduce((sum, lead) => {
    return sum + (lead.quoted_amount || 0);
  }, 0);

  const stats = {
    totalPipeline,
    won,
    lost,
    winRate: parseFloat(winRate),
    pipelineValue,
    revenueWon,
  };

  return (
    <OpportunitiesPageClient
      leads={allLeads}
      stats={stats}
      staffList={(staffList as Staff[]) || []}
      currentUserRole={currentUserRole}
    />
  );
}
