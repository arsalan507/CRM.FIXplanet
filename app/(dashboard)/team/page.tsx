import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeamPageClient } from "./client";
import { getStaffWithMetrics, getTeamPerformance } from "@/app/actions/staff";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
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

  const currentUserRole = (currentStaff?.role as UserRole) || "sell_executive";

  // Only managers and super_admins can view team performance
  if (!["super_admin", "operation_manager"].includes(currentUserRole)) {
    redirect("/dashboard");
  }

  // Get staff with metrics
  const staffResult = await getStaffWithMetrics();
  const leaderboardResult = await getTeamPerformance("month");

  return (
    <TeamPageClient
      staffWithMetrics={staffResult.success ? staffResult.data || [] : []}
      leaderboard={leaderboardResult.success ? leaderboardResult.data || [] : []}
      currentUserRole={currentUserRole}
    />
  );
}
