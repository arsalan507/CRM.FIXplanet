"use server";

import { createClient } from "@/lib/supabase/server";

export interface TurnaroundMetrics {
  avgRepairTime: number; // in hours
  avgResponseTime: number; // in hours
  fastestRepairTime: number | null; // in hours
  slowestRepairTime: number | null; // in hours
  repairsCompleted: number;
  overdueRepairs: number;
}

export interface OverdueRepair {
  id: string;
  customer_name: string;
  device_type: string;
  device_model: string;
  repair_started_at: string;
  hours_in_repair: number;
}

export interface LeadSourceStats {
  source: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_revenue: number;
}

export interface UTMCampaignStats {
  campaign: string;
  source: string;
  medium: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_revenue: number;
}

export interface DeviceDistribution {
  device_type: string;
  total_count: number;
  completed_count: number;
  avg_repair_value: number;
}

export interface IssueBreakdown {
  issue: string;
  total_count: number;
  avg_quoted_amount: number;
  avg_repair_time_hours: number | null;
}

/**
 * Get turnaround time metrics
 */
export async function getTurnaroundMetrics(daysBack: number = 30) {
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  // Get completed repairs with timestamps
  const { data: completedRepairs } = await supabase
    .from("leads")
    .select("repair_started_at, repair_completed_at, created_at, first_contact_at")
    .not("repair_started_at", "is", null)
    .not("repair_completed_at", "is", null)
    .gte("created_at", fromDate.toISOString());

  // Calculate avg repair time
  let totalRepairTime = 0;
  let repairCount = 0;
  let fastestRepair: number | null = null;
  let slowestRepair: number | null = null;

  completedRepairs?.forEach((repair) => {
    const started = new Date(repair.repair_started_at);
    const completed = new Date(repair.repair_completed_at);
    const hours = (completed.getTime() - started.getTime()) / (1000 * 60 * 60);

    totalRepairTime += hours;
    repairCount++;

    if (fastestRepair === null || hours < fastestRepair) {
      fastestRepair = hours;
    }
    if (slowestRepair === null || hours > slowestRepair) {
      slowestRepair = hours;
    }
  });

  // Calculate avg response time
  let totalResponseTime = 0;
  let responseCount = 0;

  completedRepairs?.forEach((repair) => {
    if (repair.first_contact_at) {
      const created = new Date(repair.created_at);
      const contacted = new Date(repair.first_contact_at);
      const hours = (contacted.getTime() - created.getTime()) / (1000 * 60 * 60);

      if (hours >= 0) {
        // Only count positive times
        totalResponseTime += hours;
        responseCount++;
      }
    }
  });

  // Get overdue repairs count
  const { count: overdueCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_repair")
    .not("repair_started_at", "is", null)
    .is("repair_completed_at", null)
    .lt("repair_started_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  return {
    success: true,
    data: {
      avgRepairTime: repairCount > 0 ? Math.round(totalRepairTime / repairCount) : 0,
      avgResponseTime: responseCount > 0 ? Math.round((totalResponseTime / responseCount) * 10) / 10 : 0,
      fastestRepairTime: fastestRepair ? Math.round(fastestRepair * 10) / 10 : null,
      slowestRepairTime: slowestRepair ? Math.round(slowestRepair * 10) / 10 : null,
      repairsCompleted: repairCount,
      overdueRepairs: overdueCount || 0,
    } as TurnaroundMetrics,
  };
}

/**
 * Get list of overdue repairs
 */
export async function getOverdueRepairs() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, customer_name, device_type, device_model, repair_started_at")
    .eq("status", "in_repair")
    .not("repair_started_at", "is", null)
    .is("repair_completed_at", null)
    .lt("repair_started_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order("repair_started_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const overdueRepairs: OverdueRepair[] =
    data?.map((lead) => {
      const started = new Date(lead.repair_started_at);
      const hoursInRepair = (Date.now() - started.getTime()) / (1000 * 60 * 60);

      return {
        ...lead,
        hours_in_repair: Math.round(hoursInRepair * 10) / 10,
      };
    }) || [];

  return { success: true, data: overdueRepairs };
}

/**
 * Get lead source performance stats
 */
export async function getLeadSourceStats(daysBack: number = 30) {
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  const { data: leads } = await supabase
    .from("leads")
    .select("lead_source, status, quoted_amount")
    .gte("created_at", fromDate.toISOString());

  if (!leads) {
    return { success: true, data: [] };
  }

  // Group by source
  const sourceMap = new Map<string, LeadSourceStats>();

  leads.forEach((lead) => {
    const source = lead.lead_source || "Unknown";

    if (!sourceMap.has(source)) {
      sourceMap.set(source, {
        source,
        total_leads: 0,
        converted_leads: 0,
        conversion_rate: 0,
        total_revenue: 0,
      });
    }

    const stats = sourceMap.get(source)!;
    stats.total_leads++;

    if (lead.status === "won") {
      stats.converted_leads++;
      stats.total_revenue += lead.quoted_amount || 0;
    }
  });

  // Calculate conversion rates
  const result: LeadSourceStats[] = Array.from(sourceMap.values()).map((stats) => ({
    ...stats,
    conversion_rate: stats.total_leads > 0 ? Math.round((stats.converted_leads / stats.total_leads) * 100) : 0,
  }));

  return {
    success: true,
    data: result.sort((a, b) => b.total_leads - a.total_leads),
  };
}

/**
 * Get UTM campaign performance stats
 */
export async function getUTMCampaignStats(daysBack: number = 30) {
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  const { data: leads } = await supabase
    .from("leads")
    .select("utm_campaign, utm_source, utm_medium, status, quoted_amount")
    .gte("created_at", fromDate.toISOString())
    .not("utm_campaign", "is", null);

  if (!leads || leads.length === 0) {
    return { success: true, data: [] };
  }

  // Group by campaign
  const campaignMap = new Map<string, UTMCampaignStats>();

  leads.forEach((lead) => {
    const campaign = lead.utm_campaign || "Unknown Campaign";
    const source = lead.utm_source || "Unknown";
    const medium = lead.utm_medium || "Unknown";
    const key = `${campaign}-${source}-${medium}`;

    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        campaign,
        source,
        medium,
        total_leads: 0,
        converted_leads: 0,
        conversion_rate: 0,
        total_revenue: 0,
      });
    }

    const stats = campaignMap.get(key)!;
    stats.total_leads++;

    if (lead.status === "won") {
      stats.converted_leads++;
      stats.total_revenue += lead.quoted_amount || 0;
    }
  });

  // Calculate conversion rates
  const result: UTMCampaignStats[] = Array.from(campaignMap.values()).map((stats) => ({
    ...stats,
    conversion_rate: stats.total_leads > 0 ? Math.round((stats.converted_leads / stats.total_leads) * 100) : 0,
  }));

  return {
    success: true,
    data: result.sort((a, b) => b.total_leads - a.total_leads),
  };
}

/**
 * Get device type distribution
 */
export async function getDeviceDistributionStats(daysBack: number = 30) {
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  const { data: leads } = await supabase
    .from("leads")
    .select("device_type, status, quoted_amount")
    .gte("created_at", fromDate.toISOString());

  if (!leads) {
    return { success: true, data: [] };
  }

  // Group by device type
  const deviceMap = new Map<string, DeviceDistribution>();

  leads.forEach((lead) => {
    const device = lead.device_type;

    if (!deviceMap.has(device)) {
      deviceMap.set(device, {
        device_type: device,
        total_count: 0,
        completed_count: 0,
        avg_repair_value: 0,
      });
    }

    const stats = deviceMap.get(device)!;
    stats.total_count++;

    if (lead.status === "won" && lead.quoted_amount) {
      stats.completed_count++;
      stats.avg_repair_value += lead.quoted_amount;
    }
  });

  // Calculate averages
  const result: DeviceDistribution[] = Array.from(deviceMap.values()).map((stats) => ({
    ...stats,
    avg_repair_value: stats.completed_count > 0 ? Math.round(stats.avg_repair_value / stats.completed_count) : 0,
  }));

  return {
    success: true,
    data: result.sort((a, b) => b.total_count - a.total_count),
  };
}

/**
 * Get issue breakdown stats
 */
export async function getIssueBreakdownStats(daysBack: number = 30) {
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  const { data: leads } = await supabase
    .from("leads")
    .select("issue_reported, quoted_amount, repair_started_at, repair_completed_at")
    .gte("created_at", fromDate.toISOString());

  if (!leads) {
    return { success: true, data: [] };
  }

  // Group by issue
  const issueMap = new Map<
    string,
    {
      total_count: number;
      total_amount: number;
      total_repair_time: number;
      repair_count: number;
    }
  >();

  leads.forEach((lead) => {
    const issue = lead.issue_reported;

    if (!issueMap.has(issue)) {
      issueMap.set(issue, {
        total_count: 0,
        total_amount: 0,
        total_repair_time: 0,
        repair_count: 0,
      });
    }

    const stats = issueMap.get(issue)!;
    stats.total_count++;

    if (lead.quoted_amount) {
      stats.total_amount += lead.quoted_amount;
    }

    if (lead.repair_started_at && lead.repair_completed_at) {
      const started = new Date(lead.repair_started_at);
      const completed = new Date(lead.repair_completed_at);
      const hours = (completed.getTime() - started.getTime()) / (1000 * 60 * 60);
      stats.total_repair_time += hours;
      stats.repair_count++;
    }
  });

  // Calculate averages
  const result: IssueBreakdown[] = Array.from(issueMap.entries())
    .map(([issue, stats]) => ({
      issue,
      total_count: stats.total_count,
      avg_quoted_amount: stats.total_count > 0 ? Math.round(stats.total_amount / stats.total_count) : 0,
      avg_repair_time_hours:
        stats.repair_count > 0 ? Math.round((stats.total_repair_time / stats.repair_count) * 10) / 10 : null,
    }))
    .sort((a, b) => b.total_count - a.total_count)
    .slice(0, 15);

  return { success: true, data: result };
}

/**
 * Global search across leads, customers, and opportunities
 */
export async function globalSearch(query: string) {
  if (!query || query.length < 2) {
    return { success: true, data: { leads: [], customers: [], total: 0 } };
  }

  const supabase = await createClient();
  const searchTerm = `%${query}%`;

  // Search leads
  const { data: leads } = await supabase
    .from("leads")
    .select("id, customer_name, contact_number, device_type, device_model, issue_reported, status")
    .or(`customer_name.ilike.${searchTerm},contact_number.ilike.${searchTerm},device_model.ilike.${searchTerm}`)
    .limit(10);

  // Search customers
  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_name, contact_number, email, city")
    .or(`customer_name.ilike.${searchTerm},contact_number.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .limit(10);

  return {
    success: true,
    data: {
      leads: leads || [],
      customers: customers || [],
      total: (leads?.length || 0) + (customers?.length || 0),
    },
  };
}
