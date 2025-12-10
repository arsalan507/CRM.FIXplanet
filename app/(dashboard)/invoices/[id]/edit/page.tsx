import { createClient } from "@/lib/supabase/server";
import { getInvoiceById } from "@/app/actions/invoices";
import { InvoiceEditClient } from "./client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface InvoiceEditPageProps {
  params: { id: string };
}

export default async function InvoiceEditPage({
  params,
}: InvoiceEditPageProps) {
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

  // Fetch invoice
  const invoiceResult = await getInvoiceById(params.id);

  if (!invoiceResult.success || !invoiceResult.data) {
    notFound();
  }

  return (
    <InvoiceEditClient
      invoice={invoiceResult.data}
      currentStaff={staff}
    />
  );
}
