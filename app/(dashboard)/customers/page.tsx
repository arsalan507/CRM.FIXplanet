import { createClient } from "@/lib/supabase/server";
import { CustomersPageClient } from "./client";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
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

  // Get customers with their leads
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <CustomersPageClient
      customers={customers || []}
      currentUserRole={currentUserRole}
    />
  );
}
