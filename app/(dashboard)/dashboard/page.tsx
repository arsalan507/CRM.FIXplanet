import { createClient } from "@/lib/supabase/server";
import { EnhancedStatsCards } from "@/components/charts/enhanced-stats-cards";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time";
import { LeadsByDeviceChart } from "@/components/charts/leads-by-device";
import { IssueBreakdownChart } from "@/components/charts/issue-breakdown";
import { TeamPerformanceTable } from "@/components/charts/team-performance";
import { ActivityFeed } from "@/components/charts/activity-feed";
import { TurnaroundMetrics } from "@/components/analytics/turnaround-metrics";
import { LeadSourceChart } from "@/components/analytics/lead-source-chart";
import { DeviceDistribution } from "@/components/analytics/device-distribution";
import { IssueBreakdown } from "@/components/analytics/issue-breakdown";
import { RevenueMetrics } from "@/components/analytics/revenue-metrics";
import {
  getDashboardMetrics,
  getLeadsOverTime,
  getDeviceDistribution,
  getIssueBreakdown,
  getTeamPerformance,
  getRecentActivity,
} from "@/lib/dashboard";
import {
  getTurnaroundMetrics,
  getLeadSourceStats,
  getDeviceDistributionStats,
  getIssueBreakdownStats,
} from "@/app/actions/analytics";
import { getRevenueMetrics } from "@/app/actions/invoices";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user and their staff record
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, role")
    .eq("auth_user_id", user?.id)
    .single();

  const staffId = staff?.id;
  const role = staff?.role as UserRole | undefined;

  // Fetch all dashboard data in parallel
  const [
    metrics,
    leadsOverTime,
    deviceDistribution,
    issueBreakdown,
    teamPerformance,
    recentActivity,
    turnaroundMetrics,
    leadSourceStats,
    deviceDistributionStats,
    issueBreakdownStats,
    revenueMetrics,
  ] = await Promise.all([
    getDashboardMetrics(supabase, staffId, role),
    getLeadsOverTime(supabase, staffId, role),
    getDeviceDistribution(supabase, staffId, role),
    getIssueBreakdown(supabase, staffId, role),
    role === "super_admin" || role === "manager"
      ? getTeamPerformance(supabase)
      : Promise.resolve([]),
    getRecentActivity(supabase, staffId, role),
    getTurnaroundMetrics(30),
    getLeadSourceStats(30),
    getDeviceDistributionStats(30),
    getIssueBreakdownStats(30),
    getRevenueMetrics(30),
  ]);

  const showTeamPerformance = role === "super_admin" || role === "manager";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {role === "telecaller"
              ? "Your personal performance overview"
              : "Overview of your repair business"}
          </p>
        </div>
        {role && (
          <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-gray-100 rounded">
            {role.replace("_", " ")} view
          </span>
        )}
      </div>

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards metrics={metrics} />

      {/* Turnaround Metrics */}
      {turnaroundMetrics.success && turnaroundMetrics.data && (
        <TurnaroundMetrics
          avgRepairTime={turnaroundMetrics.data.avgRepairTime}
          avgResponseTime={turnaroundMetrics.data.avgResponseTime}
          overdueRepairs={turnaroundMetrics.data.overdueRepairs}
          repairsCompleted={turnaroundMetrics.data.repairsCompleted}
          fastestRepairTime={turnaroundMetrics.data.fastestRepairTime}
          slowestRepairTime={turnaroundMetrics.data.slowestRepairTime}
        />
      )}

      {/* Revenue Metrics */}
      {revenueMetrics.success && revenueMetrics.data && (
        <RevenueMetrics
          totalRevenue={revenueMetrics.data.totalRevenue || 0}
          pendingAmount={revenueMetrics.data.pendingAmount || 0}
          paidInvoices={revenueMetrics.data.paidInvoices || 0}
          pendingInvoices={revenueMetrics.data.pendingInvoices || 0}
          avgInvoiceValue={revenueMetrics.data.avgInvoiceValue || 0}
          daysBack={30}
        />
      )}

      {/* Analytics Row - Lead Sources & Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leadSourceStats.success && leadSourceStats.data && (
          <LeadSourceChart data={leadSourceStats.data} daysBack={30} />
        )}
        {deviceDistributionStats.success && deviceDistributionStats.data && (
          <DeviceDistribution data={deviceDistributionStats.data} daysBack={30} />
        )}
      </div>

      {/* Issue Breakdown */}
      {issueBreakdownStats.success && issueBreakdownStats.data && (
        <IssueBreakdown data={issueBreakdownStats.data} daysBack={30} />
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsOverTimeChart data={leadsOverTime} />
        <LeadsByDeviceChart data={deviceDistribution} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssueBreakdownChart data={issueBreakdown} />
        {showTeamPerformance ? (
          <TeamPerformanceTable data={teamPerformance} />
        ) : (
          <ActivityFeed
            initialActivities={recentActivity}
            staffId={staffId}
            role={role}
          />
        )}
      </div>

      {/* Activity Feed (for managers/admins who see team performance) */}
      {showTeamPerformance && (
        <ActivityFeed
          initialActivities={recentActivity}
          staffId={staffId}
          role={role}
        />
      )}
    </div>
  );
}
