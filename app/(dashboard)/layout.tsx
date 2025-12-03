import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardProviders } from "@/components/providers/dashboard-providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get staff data
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!staff || !staff.is_active) {
    redirect("/login");
  }

  return (
    <DashboardProviders staff={staff}>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar staff={staff} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header staff={staff} />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </DashboardProviders>
  );
}
