import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVICE_MODELS, DEVICE_ISSUES, DEVICE_TYPES } from "@/lib/config";
import type { DeviceType } from "@/lib/types";

interface NewLeadPayload {
  customer_name: string;
  contact_number: string;
  email?: string;
  device_type: DeviceType;
  device_model: string;
  issue_reported: string;
  lead_source?: string;
  priority?: number;
  // UTM & Attribution params
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page_url?: string;
  referrer_url?: string;
}

// Round-robin auto-assignment logic
async function getNextAvailableTelecaller(supabase: ReturnType<typeof createAdminClient>) {
  // Get all active telecallers
  const { data: telecallers } = await supabase
    .from("staff")
    .select("id, full_name")
    .eq("role", "sales_executive")
    .eq("is_active", true);

  if (!telecallers || telecallers.length === 0) {
    // Fallback to managers if no telecallers
    const { data: managers } = await supabase
      .from("staff")
      .select("id")
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(1);

    return managers?.[0]?.id || null;
  }

  // Get lead counts for each telecaller (last 24 hours for fair distribution)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const telecallerCounts: { id: string; count: number }[] = [];

  for (const telecaller of telecallers) {
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", telecaller.id)
      .gte("created_at", oneDayAgo);

    telecallerCounts.push({
      id: telecaller.id,
      count: count || 0,
    });
  }

  // Sort by count (ascending) and pick the one with fewest leads
  telecallerCounts.sort((a, b) => a.count - b.count);

  return telecallerCounts[0]?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    const body: NewLeadPayload = await request.json();

    // Validate required fields
    const requiredFields = [
      "customer_name",
      "contact_number",
      "device_type",
      "device_model",
      "issue_reported",
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof NewLeadPayload]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate device_type
    if (!DEVICE_TYPES.includes(body.device_type as typeof DEVICE_TYPES[number])) {
      return NextResponse.json(
        {
          error: `Invalid device_type. Must be one of: ${DEVICE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate device_model against config
    const validModels = DEVICE_MODELS[body.device_type as keyof typeof DEVICE_MODELS];
    if (!validModels.includes(body.device_model as never)) {
      return NextResponse.json(
        {
          error: `Invalid device_model for ${body.device_type}. Valid models: ${validModels.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate issue_reported against config
    const validIssues = DEVICE_ISSUES[body.device_type as keyof typeof DEVICE_ISSUES];
    if (!validIssues.includes(body.issue_reported as never)) {
      return NextResponse.json(
        {
          error: `Invalid issue_reported for ${body.device_type}. Valid issues: ${validIssues.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate contact_number (basic validation for Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = body.contact_number.replace(/\D/g, "").slice(-10);
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid contact number. Must be a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check for duplicate lead (same phone number in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, customer_name")
      .eq("contact_number", cleanPhone)
      .gte("created_at", oneDayAgo)
      .limit(1)
      .single();

    if (existingLead) {
      return NextResponse.json(
        {
          error: "Duplicate lead",
          message: `A lead with this phone number already exists (${existingLead.customer_name})`,
          existing_lead_id: existingLead.id,
        },
        { status: 409 }
      );
    }

    // Get next available telecaller using round-robin
    const nextTelecaller = await getNextAvailableTelecaller(supabase);

    // Determine priority based on issue type
    let priority = body.priority || 3;
    if (["Logic Board", "Face ID", "Not Powering On", "Liquid Damage"].includes(body.issue_reported)) {
      priority = 2; // High priority for complex repairs
    }

    // Insert the lead
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        customer_name: body.customer_name.trim(),
        contact_number: cleanPhone,
        email: body.email?.trim() || null,
        device_type: body.device_type,
        device_model: body.device_model,
        issue_reported: body.issue_reported,
        lead_source: body.lead_source || "LP-1",
        status: "new",
        assigned_to: nextTelecaller,
        priority,
        // UTM & Attribution
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_term: body.utm_term || null,
        utm_content: body.utm_content || null,
        landing_page_url: body.landing_page_url || null,
        referrer_url: body.referrer_url || null,
      })
      .select(`
        *,
        staff:assigned_to (full_name)
      `)
      .single();

    if (error) {
      console.error("Error inserting lead:", error);
      return NextResponse.json(
        { error: "Failed to create lead", details: error.message },
        { status: 500 }
      );
    }

    const staffData = lead.staff as { full_name: string } | null;

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        data: {
          id: lead.id,
          customer_name: lead.customer_name,
          device: `${lead.device_type} ${lead.device_model}`,
          issue: lead.issue_reported,
          status: lead.status,
          priority: lead.priority,
          assigned_to: staffData?.full_name || "Unassigned",
          created_at: lead.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/new-lead",
    method: "POST",
    required_fields: [
      "customer_name",
      "contact_number",
      "device_type",
      "device_model",
      "issue_reported",
    ],
    optional_fields: [
      "email",
      "lead_source",
      "priority",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "landing_page_url",
      "referrer_url",
    ],
    device_types: DEVICE_TYPES,
    features: [
      "Auto-assignment (round-robin to telecallers)",
      "Duplicate detection (24-hour window)",
      "Smart priority assignment",
      "Phone number validation (Indian)",
      "UTM parameter tracking for campaign attribution",
    ],
  });
}
