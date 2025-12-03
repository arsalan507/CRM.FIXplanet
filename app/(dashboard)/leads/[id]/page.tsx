import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LeadDetailClient from "./client";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch lead with all related data
  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      staff:assigned_to(id, full_name, email, role)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching lead:", error);
    notFound();
  }

  if (!lead) {
    notFound();
  }

  // Fetch remarks for this lead (will be empty until lead_remarks table is created)
  const { data: remarks, error: remarksError } = await supabase
    .from("lead_remarks")
    .select(
      `
      *,
      staff:staff_id(id, full_name, email, role)
    `
    )
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  // Ignore error if table doesn't exist yet
  if (remarksError && remarksError.code !== "42P01") {
    console.error("Error fetching remarks:", remarksError);
  }

  return <LeadDetailClient lead={lead} remarks={remarks || []} />;
}
