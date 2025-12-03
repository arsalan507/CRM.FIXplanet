import { createClient } from "@/lib/supabase/server";
import { OpportunitiesPageClient } from "./client";
import { getOpportunities, getOpportunityStats } from "@/app/actions/opportunities";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const supabase = await createClient();

  // Get current user role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user?.id)
    .single();

  const currentUserRole = (currentStaff?.role as UserRole) || "telecaller";

  // Get opportunities and stats
  const opportunitiesResult = await getOpportunities();
  const statsResult = await getOpportunityStats();

  return (
    <OpportunitiesPageClient
      opportunities={opportunitiesResult.success ? opportunitiesResult.data || [] : []}
      stats={statsResult.success ? statsResult.data : null}
      currentUserRole={currentUserRole}
    />
  );
}
