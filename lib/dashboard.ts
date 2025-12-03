import { SupabaseClient } from "@supabase/supabase-js";
import type { LeadStatus, DeviceType, UserRole } from "./types";

export interface DashboardMetrics {
  totalLeads: number;
  totalLeadsTrend: number; // percentage change from last 7 days
  conversionRate: number;
  conversionRateTrend: number;
  activeRepairs: number;
  activeRepairsTrend: number;
  newLeadsToday: number;
  newLeadsTodayTrend: number;
}

export interface LeadsOverTime {
  date: string;
  newLeads: number;
  convertedLeads: number;
}

export interface IssueBreakdown {
  issue: string;
  count: number;
}

export interface TeamPerformance {
  id: string;
  name: string;
  assignedLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export interface ActivityItem {
  id: string;
  type: "lead_created" | "status_changed" | "call_made" | "lead_assigned";
  description: string;
  timestamp: string;
  leadId?: string;
  staffName?: string;
}

export async function getDashboardMetrics(
  supabase: SupabaseClient,
  staffId?: string,
  role?: UserRole
): Promise<DashboardMetrics> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Build base query filter based on role
  let baseFilter = supabase.from("leads").select("*", { count: "exact" });
  if (role === "telecaller" && staffId) {
    baseFilter = baseFilter.eq("assigned_to", staffId);
  }

  // Total leads
  const { count: totalLeads } = await baseFilter;

  // Leads in last 7 days
  let last7DaysQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .gte("created_at", sevenDaysAgo.toISOString());
  if (role === "telecaller" && staffId) {
    last7DaysQuery = last7DaysQuery.eq("assigned_to", staffId);
  }
  const { count: last7Days } = await last7DaysQuery;

  // Leads 7-14 days ago
  let prev7DaysQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString());
  if (role === "telecaller" && staffId) {
    prev7DaysQuery = prev7DaysQuery.eq("assigned_to", staffId);
  }
  const { count: prev7Days } = await prev7DaysQuery;

  // Calculate trend
  const totalLeadsTrend =
    prev7Days && prev7Days > 0
      ? Math.round(((last7Days || 0) - prev7Days) / prev7Days * 100)
      : 0;

  // Conversion rate (completed + delivered / total)
  let convertedQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .in("status", ["completed", "delivered"]);
  if (role === "telecaller" && staffId) {
    convertedQuery = convertedQuery.eq("assigned_to", staffId);
  }
  const { count: convertedLeads } = await convertedQuery;

  const conversionRate =
    totalLeads && totalLeads > 0
      ? Math.round((convertedLeads || 0) / totalLeads * 100)
      : 0;

  // Previous period conversion for trend
  let prevConvertedQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .in("status", ["completed", "delivered"])
    .lt("created_at", sevenDaysAgo.toISOString());
  if (role === "telecaller" && staffId) {
    prevConvertedQuery = prevConvertedQuery.eq("assigned_to", staffId);
  }
  const { count: prevConverted } = await prevConvertedQuery;

  let prevTotalQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .lt("created_at", sevenDaysAgo.toISOString());
  if (role === "telecaller" && staffId) {
    prevTotalQuery = prevTotalQuery.eq("assigned_to", staffId);
  }
  const { count: prevTotal } = await prevTotalQuery;

  const prevConversionRate =
    prevTotal && prevTotal > 0
      ? Math.round((prevConverted || 0) / prevTotal * 100)
      : 0;
  const conversionRateTrend = conversionRate - prevConversionRate;

  // Active repairs (in_repair status)
  let activeQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("status", "in_repair");
  if (role === "telecaller" && staffId) {
    activeQuery = activeQuery.eq("assigned_to", staffId);
  }
  const { count: activeRepairs } = await activeQuery;

  // Previous active repairs
  let prevActiveQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("status", "in_repair")
    .lt("updated_at", sevenDaysAgo.toISOString());
  if (role === "telecaller" && staffId) {
    prevActiveQuery = prevActiveQuery.eq("assigned_to", staffId);
  }
  const { count: prevActive } = await prevActiveQuery;

  const activeRepairsTrend =
    prevActive && prevActive > 0
      ? Math.round(((activeRepairs || 0) - prevActive) / prevActive * 100)
      : 0;

  // New leads today
  let todayQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .gte("created_at", today.toISOString());
  if (role === "telecaller" && staffId) {
    todayQuery = todayQuery.eq("assigned_to", staffId);
  }
  const { count: newLeadsToday } = await todayQuery;

  // Yesterday's leads for trend
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  let yesterdayQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .gte("created_at", yesterday.toISOString())
    .lt("created_at", today.toISOString());
  if (role === "telecaller" && staffId) {
    yesterdayQuery = yesterdayQuery.eq("assigned_to", staffId);
  }
  const { count: yesterdayLeads } = await yesterdayQuery;

  const newLeadsTodayTrend =
    yesterdayLeads && yesterdayLeads > 0
      ? Math.round(((newLeadsToday || 0) - yesterdayLeads) / yesterdayLeads * 100)
      : 0;

  return {
    totalLeads: totalLeads || 0,
    totalLeadsTrend,
    conversionRate,
    conversionRateTrend,
    activeRepairs: activeRepairs || 0,
    activeRepairsTrend,
    newLeadsToday: newLeadsToday || 0,
    newLeadsTodayTrend,
  };
}

export async function getLeadsOverTime(
  supabase: SupabaseClient,
  staffId?: string,
  role?: UserRole
): Promise<LeadsOverTime[]> {
  const days = 30;
  const result: LeadsOverTime[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    let newLeadsQuery = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .gte("created_at", date.toISOString())
      .lt("created_at", nextDate.toISOString());

    let convertedQuery = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .in("status", ["completed", "delivered"])
      .gte("updated_at", date.toISOString())
      .lt("updated_at", nextDate.toISOString());

    if (role === "telecaller" && staffId) {
      newLeadsQuery = newLeadsQuery.eq("assigned_to", staffId);
      convertedQuery = convertedQuery.eq("assigned_to", staffId);
    }

    const [{ count: newLeads }, { count: convertedLeads }] = await Promise.all([
      newLeadsQuery,
      convertedQuery,
    ]);

    result.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      newLeads: newLeads || 0,
      convertedLeads: convertedLeads || 0,
    });
  }

  return result;
}

export async function getIssueBreakdown(
  supabase: SupabaseClient,
  staffId?: string,
  role?: UserRole
): Promise<IssueBreakdown[]> {
  let query = supabase.from("leads").select("issue_reported");
  if (role === "telecaller" && staffId) {
    query = query.eq("assigned_to", staffId);
  }

  const { data } = await query;

  if (!data) return [];

  const counts = data.reduce((acc: Record<string, number>, lead) => {
    acc[lead.issue_reported] = (acc[lead.issue_reported] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function getTeamPerformance(
  supabase: SupabaseClient
): Promise<TeamPerformance[]> {
  // Get all telecallers
  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name")
    .in("role", ["telecaller", "manager"])
    .eq("is_active", true);

  if (!staff) return [];

  const result: TeamPerformance[] = [];

  for (const member of staff) {
    const { count: assignedLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("assigned_to", member.id);

    const { count: convertedLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("assigned_to", member.id)
      .in("status", ["completed", "delivered"]);

    const conversionRate =
      assignedLeads && assignedLeads > 0
        ? Math.round((convertedLeads || 0) / assignedLeads * 100)
        : 0;

    result.push({
      id: member.id,
      name: member.full_name,
      assignedLeads: assignedLeads || 0,
      convertedLeads: convertedLeads || 0,
      conversionRate,
    });
  }

  return result.sort((a, b) => b.conversionRate - a.conversionRate);
}

export async function getRecentActivity(
  supabase: SupabaseClient,
  staffId?: string,
  role?: UserRole,
  limit = 10
): Promise<ActivityItem[]> {
  // Get recent leads
  let leadsQuery = supabase
    .from("leads")
    .select(`
      id,
      customer_name,
      status,
      created_at,
      updated_at,
      staff:assigned_to (full_name)
    `)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (role === "telecaller" && staffId) {
    leadsQuery = leadsQuery.eq("assigned_to", staffId);
  }

  const { data: leads } = await leadsQuery;

  // Get recent call notes
  let notesQuery = supabase
    .from("call_notes")
    .select(`
      id,
      lead_id,
      created_at,
      outcome,
      staff:staff_id (full_name),
      lead:lead_id (customer_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (role === "telecaller" && staffId) {
    notesQuery = notesQuery.eq("staff_id", staffId);
  }

  const { data: notes } = await notesQuery;

  const activities: ActivityItem[] = [];

  // Process leads
  if (leads) {
    for (const lead of leads) {
      const staffData = lead.staff as unknown as { full_name: string } | null;

      // Check if it's a new lead (created today)
      const createdDate = new Date(lead.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (createdDate >= today) {
        activities.push({
          id: `lead-created-${lead.id}`,
          type: "lead_created",
          description: `New lead: ${lead.customer_name}`,
          timestamp: lead.created_at,
          leadId: lead.id,
          staffName: staffData?.full_name,
        });
      }

      // Add status change activity if status is not 'new'
      if (lead.status !== "new") {
        activities.push({
          id: `status-${lead.id}-${lead.updated_at}`,
          type: "status_changed",
          description: `${lead.customer_name} → ${lead.status.replace("_", " ")}`,
          timestamp: lead.updated_at,
          leadId: lead.id,
          staffName: staffData?.full_name,
        });
      }
    }
  }

  // Process call notes
  if (notes) {
    for (const note of notes) {
      const staffData = note.staff as unknown as { full_name: string } | null;
      const leadData = note.lead as unknown as { customer_name: string } | null;

      activities.push({
        id: `call-${note.id}`,
        type: "call_made",
        description: `Call with ${leadData?.customer_name || "Unknown"}${note.outcome ? `: ${note.outcome}` : ""}`,
        timestamp: note.created_at,
        leadId: note.lead_id,
        staffName: staffData?.full_name,
      });
    }
  }

  // Sort by timestamp and return top items
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function getDeviceDistribution(
  supabase: SupabaseClient,
  staffId?: string,
  role?: UserRole
): Promise<{ device_type: DeviceType; count: number }[]> {
  let query = supabase.from("leads").select("device_type");
  if (role === "telecaller" && staffId) {
    query = query.eq("assigned_to", staffId);
  }

  const { data } = await query;

  if (!data) return [];

  const counts = data.reduce((acc: Record<string, number>, lead) => {
    acc[lead.device_type] = (acc[lead.device_type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([device_type, count]) => ({
    device_type: device_type as DeviceType,
    count,
  }));
}

export async function getLeadsByStatus(
  supabase: SupabaseClient,
  staffId?: string,
  role?: UserRole
): Promise<{ status: LeadStatus; count: number }[]> {
  let query = supabase.from("leads").select("status");
  if (role === "telecaller" && staffId) {
    query = query.eq("assigned_to", staffId);
  }

  const { data } = await query;

  if (!data) return [];

  const counts = data.reduce((acc: Record<string, number>, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([status, count]) => ({
    status: status as LeadStatus,
    count,
  }));
}
