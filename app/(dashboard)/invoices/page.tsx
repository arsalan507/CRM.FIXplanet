import { createClient } from "@/lib/supabase/server";
import { getInvoices, getRevenueMetrics } from "@/app/actions/invoices";
import { InvoicesClient } from "./client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvoicesPage() {
  const supabase = await createClient();

  // Get current user and their staff record
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("auth_user_id", user?.id)
    .single();

  // Fetch invoices and revenue metrics in parallel
  const [invoicesResult, revenueResult] = await Promise.all([
    getInvoices(),
    getRevenueMetrics(30),
  ]);

  const invoices = invoicesResult.success ? invoicesResult.data || [] : [];
  const revenueMetrics = revenueResult.success ? revenueResult.data : null;

  return (
    <InvoicesClient
      initialInvoices={invoices}
      revenueMetrics={revenueMetrics}
      currentStaff={staff}
    />
  );
}
