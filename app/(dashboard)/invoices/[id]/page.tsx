import { createClient } from "@/lib/supabase/server";
import { getInvoiceById, getPaymentsByInvoice } from "@/app/actions/invoices";
import { InvoiceDetailClient } from "./client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface InvoiceDetailPageProps {
  params: { id: string };
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const supabase = await createClient();

  // Get current user and their staff record
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, role, full_name")
    .eq("auth_user_id", user?.id)
    .single();

  // Fetch invoice and payments
  const [invoiceResult, paymentsResult] = await Promise.all([
    getInvoiceById(params.id),
    getPaymentsByInvoice(params.id),
  ]);

  if (!invoiceResult.success || !invoiceResult.data) {
    notFound();
  }

  const payments = paymentsResult.success ? paymentsResult.data || [] : [];

  return (
    <InvoiceDetailClient
      invoice={invoiceResult.data}
      payments={payments}
      currentStaff={staff}
    />
  );
}
