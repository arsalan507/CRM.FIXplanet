"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityAction, ActivityEntity } from "@/lib/activity-logger";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action_type: ActivityAction;
  entity_type: ActivityEntity;
  entity_id: string | null;
  entity_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { full_name: string };
}

export interface ActivityFilters {
  user_id?: string;
  action_type?: ActivityAction;
  entity_type?: ActivityEntity;
  entity_id?: string;
  from_date?: string;
  to_date?: string;
}

export async function getActivityLogs(
  filters?: ActivityFilters,
  limit: number = 20,
  offset: number = 0
) {
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select(`
      *,
      user:user_id (full_name)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters?.action_type) {
    query = query.eq("action_type", filters.action_type);
  }
  if (filters?.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }
  if (filters?.entity_id) {
    query = query.eq("entity_id", filters.entity_id);
  }
  if (filters?.from_date) {
    query = query.gte("created_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("created_at", filters.to_date);
  }

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ActivityLog[], count };
}

export async function getRecentActivity(limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      *,
      user:user_id (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ActivityLog[] };
}

export async function getEntityActivity(entityType: ActivityEntity, entityId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      *,
      user:user_id (full_name)
    `)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ActivityLog[] };
}

export async function getActivityStats(daysBack: number = 7) {
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  // Get total actions
  const { count: totalActions } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromDate.toISOString());

  // Get actions by type
  const { data: actionsByType } = await supabase
    .from("activity_logs")
    .select("action_type")
    .gte("created_at", fromDate.toISOString());

  const actionCounts: Record<string, number> = {};
  actionsByType?.forEach((item) => {
    actionCounts[item.action_type] = (actionCounts[item.action_type] || 0) + 1;
  });

  // Get most active users
  const { data: userActivity } = await supabase
    .from("activity_logs")
    .select(`
      user_id,
      user:user_id (full_name)
    `)
    .gte("created_at", fromDate.toISOString());

  const userCounts: Record<string, { name: string; count: number }> = {};
  userActivity?.forEach((item) => {
    if (item.user_id) {
      if (!userCounts[item.user_id]) {
        const userName = Array.isArray(item.user)
          ? (item.user[0] as { full_name: string })?.full_name
          : (item.user as { full_name: string } | null)?.full_name || "Unknown";
        userCounts[item.user_id] = {
          name: userName,
          count: 0,
        };
      }
      userCounts[item.user_id].count++;
    }
  });

  const mostActiveUsers = Object.entries(userCounts)
    .map(([id, data]) => ({ user_id: id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get activity by day
  const { data: dailyActivity } = await supabase
    .from("activity_logs")
    .select("created_at")
    .gte("created_at", fromDate.toISOString());

  const dailyCounts: Record<string, number> = {};
  dailyActivity?.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split("T")[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  const activityByDay = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get activity by hour (for heatmap)
  const hourCounts: Record<number, number> = {};
  dailyActivity?.forEach((item) => {
    const hour = new Date(item.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const activityByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourCounts[i] || 0,
  }));

  return {
    success: true,
    data: {
      totalActions: totalActions || 0,
      actionsByType: Object.entries(actionCounts).map(([type, count]) => ({ type, count })),
      mostActiveUsers,
      activityByDay,
      activityByHour,
    },
  };
}

export async function exportActivityLogs(filters?: ActivityFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select(`
      *,
      user:user_id (full_name)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters?.action_type) {
    query = query.eq("action_type", filters.action_type);
  }
  if (filters?.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }
  if (filters?.from_date) {
    query = query.gte("created_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("created_at", filters.to_date);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Generate CSV
  const headers = [
    "Date",
    "Time",
    "User",
    "Action",
    "Entity Type",
    "Entity Name",
    "Details",
  ];

  const rows = (data || []).map((log) => {
    const date = new Date(log.created_at);
    return [
      date.toLocaleDateString("en-IN"),
      date.toLocaleTimeString("en-IN"),
      (log.user as { full_name: string } | null)?.full_name || "System",
      log.action_type.replace(/_/g, " "),
      log.entity_type,
      log.entity_name || "-",
      JSON.stringify(log.new_value || log.metadata || {}),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return { success: true, data: csvContent };
}
