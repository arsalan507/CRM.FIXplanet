"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";

export type OpportunityStage = "new" | "qualified" | "pickup" | "in_repair" | "closed_won" | "closed_lost";

export interface DateRange {
  from: string; // ISO date string
  to: string;   // ISO date string
}

export type DateFilterField = "created_at" | "updated_at";

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
  expected_close_date?: string;
  closed_at?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  lead?: {
    id: string;
    customer_name: string;
    contact_number: string;
    device_type: string;
    device_model: string;
    issue_reported: string;
    status: string;
    priority: number;
  };
  staff?: {
    full_name: string;
  };
}

export async function getOpportunities(
  stage?: OpportunityStage,
  dateRange?: DateRange,
  dateField: DateFilterField = "created_at"
) {
  const supabase = await createClient();

  // Get leads that are in the pipeline (interested, quoted, or won/lost)
  let query = supabase
    .from("leads")
    .select(`
      *,
      staff:assigned_to (full_name)
    `)
    .in("status", ["interested", "quoted", "won", "lost"])
    .order("created_at", { ascending: false });

  // Apply date range filter
  if (dateRange) {
    query = query
      .gte(dateField, dateRange.from)
      .lte(dateField, dateRange.to);
  }

  const { data: leads, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Map leads to opportunities format
  const opportunities = (leads || []).map((lead) => {
    let opportunityStage: OpportunityStage = "new";

    switch (lead.status) {
      case "interested":
        opportunityStage = "qualified";
        break;
      case "quoted":
        opportunityStage = "pickup";
        break;
      case "won":
        opportunityStage = "closed_won";
        break;
      case "lost":
        opportunityStage = "closed_lost";
        break;
    }

    return {
      id: lead.id,
      lead_id: lead.id,
      customer_name: lead.customer_name,
      contact_number: lead.contact_number,
      device_info: `${lead.device_type} ${lead.device_model}`,
      issue: lead.issue_reported,
      stage: opportunityStage,
      expected_revenue: lead.quoted_amount || 0,
      actual_revenue: lead.status === "won" ? lead.quoted_amount : undefined,
      assigned_to: lead.assigned_to,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      priority: lead.priority,
      staff: lead.staff,
    };
  });

  // Filter by stage if provided
  const filteredOpportunities = stage
    ? opportunities.filter(opp => opp.stage === stage)
    : opportunities;

  return { success: true, data: filteredOpportunities };
}

export async function getOpportunityStats(
  dateRange?: DateRange,
  dateField: DateFilterField = "created_at"
) {
  const supabase = await createClient();

  // Get all pipeline leads
  let query = supabase
    .from("leads")
    .select("status, quoted_amount, created_at, updated_at")
    .in("status", ["interested", "quoted", "won", "lost"]);

  // Apply date range filter
  if (dateRange) {
    query = query
      .gte(dateField, dateRange.from)
      .lte(dateField, dateRange.to);
  }

  const { data: leads } = await query;

  const stats = {
    totalOpportunities: leads?.length || 0,
    qualified: leads?.filter(l => l.status === "interested").length || 0,
    pickup: leads?.filter(l => l.status === "quoted").length || 0,
    won: leads?.filter(l => l.status === "won").length || 0,
    lost: leads?.filter(l => l.status === "lost").length || 0,
    expectedRevenue: leads?.filter(l => l.status !== "lost").reduce((sum, l) => sum + (l.quoted_amount || 0), 0) || 0,
    actualRevenue: leads?.filter(l => l.status === "won").reduce((sum, l) => sum + (l.quoted_amount || 0), 0) || 0,
    winRate: 0,
    avgDealValue: 0,
  };

  const closedDeals = stats.won + stats.lost;
  stats.winRate = closedDeals > 0 ? Math.round((stats.won / closedDeals) * 100) : 0;
  stats.avgDealValue = stats.totalOpportunities > 0
    ? Math.round(stats.expectedRevenue / stats.totalOpportunities)
    : 0;

  return { success: true, data: stats };
}

export async function getComparativeStats(
  currentRange: DateRange,
  previousRange: DateRange,
  dateField: DateFilterField = "created_at"
) {
  const [currentResult, previousResult] = await Promise.all([
    getOpportunityStats(currentRange, dateField),
    getOpportunityStats(previousRange, dateField),
  ]);

  if (!currentResult.success || !previousResult.success) {
    return { success: false, error: "Failed to fetch stats" };
  }

  const current = currentResult.data;
  const previous = previousResult.data;

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const comparison = {
    totalOpportunities: {
      current: current.totalOpportunities,
      previous: previous.totalOpportunities,
      change: calculateChange(current.totalOpportunities, previous.totalOpportunities),
    },
    winRate: {
      current: current.winRate,
      previous: previous.winRate,
      change: current.winRate - previous.winRate, // Absolute difference for rates
    },
    avgDealValue: {
      current: current.avgDealValue,
      previous: previous.avgDealValue,
      change: calculateChange(current.avgDealValue, previous.avgDealValue),
    },
    revenue: {
      current: current.actualRevenue,
      previous: previous.actualRevenue,
      change: calculateChange(current.actualRevenue, previous.actualRevenue),
    },
  };

  return { success: true, data: comparison };
}

// Utility function - not a server action
// This is called client-side to calculate the previous period
export async function getPreviousPeriod(currentRange: DateRange): Promise<DateRange> {
  const from = new Date(currentRange.from);
  const to = new Date(currentRange.to);
  const duration = to.getTime() - from.getTime();

  const previousTo = new Date(from.getTime() - 1); // Day before current range starts
  const previousFrom = new Date(previousTo.getTime() - duration);

  return {
    from: previousFrom.toISOString(),
    to: previousTo.toISOString(),
  };
}

export async function updateOpportunityStage(leadId: string, newStage: OpportunityStage) {
  const supabase = await createClient();

  // Get current lead state for activity log
  const { data: lead } = await supabase
    .from("leads")
    .select("customer_name, status")
    .eq("id", leadId)
    .single();

  const oldStage = lead?.status;

  // Map opportunity stage back to lead status
  let newStatus: string;
  switch (newStage) {
    case "qualified":
      newStatus = "interested";
      break;
    case "pickup":
    case "in_repair":
      newStatus = "quoted";
      break;
    case "closed_won":
      newStatus = "won";
      break;
    case "closed_lost":
      newStatus = "lost";
      break;
    default:
      newStatus = "interested";
  }

  const { error } = await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Determine the correct action type
  let actionType: "opportunity_moved" | "opportunity_won" | "opportunity_lost" = "opportunity_moved";
  if (newStage === "closed_won") {
    actionType = "opportunity_won";
  } else if (newStage === "closed_lost") {
    actionType = "opportunity_lost";
  }

  // Log activity
  await logActivity({
    action_type: actionType,
    entity_type: "opportunity",
    entity_id: leadId,
    entity_name: lead?.customer_name,
    old_value: { stage: oldStage },
    new_value: { stage: newStage },
  });

  revalidatePath("/opportunities");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateQuotedAmount(leadId: string, amount: number) {
  const supabase = await createClient();

  // Get current lead for activity log
  const { data: lead } = await supabase
    .from("leads")
    .select("customer_name, quoted_amount")
    .eq("id", leadId)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ quoted_amount: amount })
    .eq("id", leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity - using opportunity_created for quote updates (since we create opportunity with a quote)
  await logActivity({
    action_type: "opportunity_created",
    entity_type: "opportunity",
    entity_id: leadId,
    entity_name: lead?.customer_name,
    old_value: lead?.quoted_amount ? { quoted_amount: lead.quoted_amount } : undefined,
    new_value: { quoted_amount: amount },
  });

  revalidatePath("/opportunities");
  revalidatePath("/leads");
  return { success: true };
}

export async function getPipelineMetrics() {
  const supabase = await createClient();

  // Get monthly data for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: leads } = await supabase
    .from("leads")
    .select("status, quoted_amount, created_at")
    .in("status", ["won", "lost"])
    .gte("created_at", sixMonthsAgo.toISOString());

  // Group by month
  const monthlyData: Record<string, { won: number; lost: number; revenue: number }> = {};

  leads?.forEach((lead) => {
    const date = new Date(lead.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { won: 0, lost: 0, revenue: 0 };
    }

    if (lead.status === "won") {
      monthlyData[monthKey].won++;
      monthlyData[monthKey].revenue += lead.quoted_amount || 0;
    } else {
      monthlyData[monthKey].lost++;
    }
  });

  // Convert to array sorted by month
  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      ...data,
    }));

  return { success: true, data: chartData };
}

export async function exportOpportunitiesToCSV(
  dateRange?: DateRange,
  dateField: DateFilterField = "created_at"
) {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(`
      customer_name,
      contact_number,
      email,
      device_type,
      device_model,
      issue_reported,
      status,
      quoted_amount,
      created_at,
      updated_at,
      staff:assigned_to (full_name)
    `)
    .in("status", ["interested", "quoted", "won", "lost"])
    .order("created_at", { ascending: false });

  if (dateRange) {
    query = query
      .gte(dateField, dateRange.from)
      .lte(dateField, dateRange.to);
  }

  const { data: leads, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Map status to stage
  const statusToStage: Record<string, string> = {
    interested: "Qualified",
    quoted: "Pickup Scheduled",
    won: "Closed Won",
    lost: "Closed Lost",
  };

  // Generate CSV content
  const headers = [
    "Customer Name",
    "Contact Number",
    "Email",
    "Device",
    "Issue",
    "Stage",
    "Value (INR)",
    "Created Date",
    "Updated Date",
    "Assigned To",
  ];

  const rows = (leads || []).map((lead) => {
    // Handle staff which might be an object or null (cast via unknown for type safety)
    const staffObj = lead.staff as unknown as { full_name: string } | null;
    const assignedTo = staffObj?.full_name || "Unassigned";

    return [
      lead.customer_name,
      lead.contact_number,
      lead.email || "",
      `${lead.device_type} ${lead.device_model}`,
      lead.issue_reported.replace(/,/g, ";"), // Escape commas
      statusToStage[lead.status] || lead.status,
      lead.quoted_amount?.toString() || "0",
      new Date(lead.created_at).toLocaleDateString("en-IN"),
      new Date(lead.updated_at).toLocaleDateString("en-IN"),
      assignedTo,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  return { success: true, data: csvContent };
}

