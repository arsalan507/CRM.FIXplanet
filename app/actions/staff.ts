"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/types";

export async function getStaffList(includeInactive = false) {
  const supabase = await createClient();

  let query = supabase
    .from("staff")
    .select("*")
    .order("full_name");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getStaffById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getStaffWithMetrics() {
  const supabase = await createClient();

  // Get all staff
  const { data: staffList, error: staffError } = await supabase
    .from("staff")
    .select("*")
    .order("full_name");

  if (staffError) {
    return { success: false, error: staffError.message };
  }

  // Get metrics for each staff member
  const staffWithMetrics = await Promise.all(
    (staffList || []).map(async (staff) => {
      // Get total leads assigned
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", staff.id);

      // Get won leads (conversions)
      const { count: wonLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", staff.id)
        .eq("status", "won");

      // Get lost leads
      const { count: lostLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", staff.id)
        .eq("status", "lost");

      // Get call notes with duration
      const { data: callNotes } = await supabase
        .from("call_notes")
        .select("call_duration")
        .eq("staff_id", staff.id)
        .not("call_duration", "is", null);

      const totalCallDuration = callNotes?.reduce((sum, note) => sum + (note.call_duration || 0), 0) || 0;
      const avgCallDuration = callNotes && callNotes.length > 0 ? totalCallDuration / callNotes.length : 0;

      const conversionRate = totalLeads && totalLeads > 0 ? ((wonLeads || 0) / totalLeads) * 100 : 0;

      return {
        ...staff,
        metrics: {
          totalLeads: totalLeads || 0,
          wonLeads: wonLeads || 0,
          lostLeads: lostLeads || 0,
          conversionRate: Math.round(conversionRate * 10) / 10,
          totalCalls: callNotes?.length || 0,
          avgCallDuration: Math.round(avgCallDuration),
        },
      };
    })
  );

  return { success: true, data: staffWithMetrics };
}

export async function createStaff(data: {
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  employee_id?: string;
  password: string;
  permissions: Record<string, boolean>;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Create auth user with email and password
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: true, // Email is pre-confirmed, user can login immediately
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    // 2. Create staff record linked to auth user
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .insert({
        auth_user_id: authData.user.id,
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        phone: data.phone?.trim() || null,
        employee_id: data.employee_id?.trim() || null,
        permissions: data.permissions,
        is_active: true,
      })
      .select()
      .single();

    if (staffError) {
      // Rollback: delete auth user if staff creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: staffError.message };
    }

    revalidatePath("/staff");
    return { success: true, data: staff };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create staff member" };
  }
}

export async function updateStaff(
  id: string,
  data: {
    full_name?: string;
    email?: string;
    role?: UserRole;
    phone?: string;
    employee_id?: string;
    permissions?: Record<string, boolean>;
    is_active?: boolean;
  }
) {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (data.full_name) updateData.full_name = data.full_name.trim();
  if (data.email) updateData.email = data.email.trim().toLowerCase();
  if (data.role) updateData.role = data.role;
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.employee_id !== undefined) updateData.employee_id = data.employee_id?.trim() || null;
  if (data.permissions) updateData.permissions = data.permissions;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { error } = await supabase
    .from("staff")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/staff");
  revalidatePath("/team");
  return { success: true };
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/staff");
  return { success: true };
}

export async function deleteStaff(id: string) {
  const supabase = createAdminClient();

  // Get the staff record to find the auth_user_id
  const { data: staff } = await supabase
    .from("staff")
    .select("auth_user_id")
    .eq("id", id)
    .single();

  // First, unassign any leads assigned to this staff
  await supabase
    .from("leads")
    .update({ assigned_to: null })
    .eq("assigned_to", id);

  // Delete from staff table (this will cascade delete due to ON DELETE CASCADE)
  const { error } = await supabase.from("staff").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Delete from auth.users if auth_user_id exists
  if (staff?.auth_user_id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(staff.auth_user_id);
    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Don't fail the whole operation if auth deletion fails
    }
  }

  revalidatePath("/staff");
  return { success: true };
}

export async function getTeamPerformance(period: "today" | "week" | "month" | "all" = "month") {
  const supabase = await createClient();

  let startDate: string | null = null;
  const now = new Date();

  switch (period) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      break;
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString();
      break;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString();
      break;
    case "all":
    default:
      startDate = null;
  }

  // Get sales executives and managers
  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .in("role", ["sales_executive", "manager"])
    .eq("is_active", true);

  const leaderboard = await Promise.all(
    (staff || []).map(async (member) => {
      let leadsQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", member.id);

      let wonQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", member.id)
        .eq("status", "won");

      if (startDate) {
        leadsQuery = leadsQuery.gte("created_at", startDate);
        wonQuery = wonQuery.gte("created_at", startDate);
      }

      const [{ count: totalLeads }, { count: wonLeads }] = await Promise.all([
        leadsQuery,
        wonQuery,
      ]);

      const conversionRate = totalLeads && totalLeads > 0
        ? ((wonLeads || 0) / totalLeads) * 100
        : 0;

      return {
        id: member.id,
        name: member.full_name,
        role: member.role,
        totalLeads: totalLeads || 0,
        wonLeads: wonLeads || 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    })
  );

  // Sort by conversion rate, then by total leads
  leaderboard.sort((a, b) => {
    if (b.conversionRate !== a.conversionRate) {
      return b.conversionRate - a.conversionRate;
    }
    return b.totalLeads - a.totalLeads;
  });

  return { success: true, data: leaderboard };
}
