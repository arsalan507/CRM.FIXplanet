import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StaffPageClient } from "./client";
import type { UserRole, Staff } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const supabase = await createClient();

  // Check if user has permission
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user?.id)
    .single();

  const currentUserRole = (currentStaff?.role as UserRole) || "sales_executive";

  if (!["super_admin", "admin"].includes(currentUserRole)) {
    redirect("/dashboard");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <StaffPageClient
      staff={(staff as Staff[]) || []}
      currentUserRole={currentUserRole}
    />
  );
}
