import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to extract UTM parameters from URL
function extractUTMParams(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get("utm_source"),
      utm_medium: urlObj.searchParams.get("utm_medium"),
      utm_campaign: urlObj.searchParams.get("utm_campaign"),
      utm_term: urlObj.searchParams.get("utm_term"),
      utm_content: urlObj.searchParams.get("utm_content"),
      gclid: urlObj.searchParams.get("gclid"),
      fbclid: urlObj.searchParams.get("fbclid"),
    };
  } catch {
    return {};
  }
}

// Helper function to normalize phone numbers
function normalizePhone(phone: string): string {
  if (!phone) return "";

  // Remove all non-numeric characters
  let normalized = phone.replace(/\D/g, "");

  // Remove +91 prefix if present
  if (normalized.startsWith("91") && normalized.length === 12) {
    normalized = normalized.substring(2);
  }

  return normalized;
}

// Helper function to normalize device type
function normalizeDeviceType(device: string): "iPhone" | "Apple Watch" | "MacBook" | "iPad" {
  const deviceLower = device.toLowerCase();

  if (deviceLower.includes("iwatch") || deviceLower.includes("watch")) {
    return "Apple Watch";
  }
  if (deviceLower.includes("iphone")) {
    return "iPhone";
  }
  if (deviceLower.includes("macbook") || deviceLower.includes("mac")) {
    return "MacBook";
  }
  if (deviceLower.includes("ipad")) {
    return "iPad";
  }

  // Default to iPhone if unclear
  return "iPhone";
}

// Helper function to extract lead source identifier
function extractLeadSource(source?: string, landingPage?: string): string {
  if (source) {
    // Extract LP-X pattern from source
    const lpMatch = source.match(/LP-\d+/i);
    if (lpMatch) return lpMatch[0].toUpperCase();

    // Return cleaned source name
    return source.substring(0, 50); // Limit to 50 chars
  }

  if (landingPage) {
    // Try to extract from URL path
    const urlMatch = landingPage.match(/\/lp-\d+/i);
    if (urlMatch) return urlMatch[0].substring(1).toUpperCase();
  }

  return "LP-1"; // Default
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify API Key
    const apiKey = request.headers.get("X-API-Key") || request.headers.get("x-api-key");
    const validApiKey = process.env.LEAD_WEBHOOK_API_KEY;

    console.log("[Lead Webhook] Received API Key length:", apiKey?.length);
    console.log("[Lead Webhook] Valid API Key length:", validApiKey?.length);
    console.log("[Lead Webhook] Keys match:", apiKey === validApiKey);

    if (!validApiKey) {
      console.error("[Lead Webhook] LEAD_WEBHOOK_API_KEY not configured in environment");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (apiKey !== validApiKey) {
      console.warn("[Lead Webhook] Invalid API key attempt");
      console.warn("[Lead Webhook] Received key starts with:", apiKey?.substring(0, 10));
      console.warn("[Lead Webhook] Expected key starts with:", validApiKey?.substring(0, 10));
      console.warn("[Lead Webhook] Received key ends with:", apiKey?.substring(apiKey.length - 10));
      console.warn("[Lead Webhook] Expected key ends with:", validApiKey?.substring(validApiKey.length - 10));
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid API key" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    console.log("[Lead Webhook] Received data:", JSON.stringify(body, null, 2));

    // 3. Extract and map fields (flexible field names)
    const customerName = body.name || body.customer_name || body.customerName;
    const phone = body.phone || body.contact_number || body.contactNumber || body.mobile;
    const device = body.device || body.device_type || body.deviceType;
    const model = body.model || body.device_model || body.deviceModel;
    const issue = body.issue || body.issue_reported || body.issueReported;
    const email = body.email || null;
    const source = body.source || body.lead_source || body.leadSource;
    const landingPage = body.landingPage || body.landing_page_url || body.landingPageUrl || body.url;

    // 4. Validate required fields
    const missingFields = [];
    if (!customerName) missingFields.push("name");
    if (!phone) missingFields.push("phone");
    if (!device) missingFields.push("device");
    if (!model) missingFields.push("model");
    if (!issue) missingFields.push("issue");

    if (missingFields.length > 0) {
      console.error("[Lead Webhook] Missing required fields:", missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          received_fields: Object.keys(body)
        },
        { status: 400 }
      );
    }

    // 5. Normalize and process data
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || normalizedPhone.length !== 10) {
      console.error("[Lead Webhook] Invalid phone number:", phone, "→", normalizedPhone);
      return NextResponse.json(
        { success: false, error: "Invalid phone number format. Expected 10 digits." },
        { status: 400 }
      );
    }

    const deviceType = normalizeDeviceType(device);
    const leadSource = extractLeadSource(source, landingPage);
    const utmParams = landingPage ? extractUTMParams(landingPage) : {};

    console.log("[Lead Webhook] Normalized data:", {
      customerName,
      phone: normalizedPhone,
      deviceType,
      model,
      issue,
      leadSource,
      utmParams
    });

    // 6. Check for duplicate (same phone in last 24 hours)
    const supabase = await createClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: existingLead, error: checkError } = await supabase
      .from("leads")
      .select("id, customer_name, created_at")
      .eq("contact_number", normalizedPhone)
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("[Lead Webhook] Error checking duplicates:", checkError);
      // Continue anyway - don't fail on duplicate check error
    }

    if (existingLead) {
      console.log("[Lead Webhook] Duplicate lead found (within 24h):", existingLead.id);

      // Update existing lead instead of creating new one
      const { data: updatedLead, error: updateError } = await supabase
        .from("leads")
        .update({
          device_type: deviceType,
          device_model: model,
          issue_reported: issue,
          lead_source: leadSource,
          landing_page_url: landingPage || null,
          utm_source: utmParams.utm_source || null,
          utm_medium: utmParams.utm_medium || null,
          utm_campaign: utmParams.utm_campaign || null,
          utm_term: utmParams.utm_term || null,
          utm_content: utmParams.utm_content || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLead.id)
        .select()
        .single();

      if (updateError) {
        console.error("[Lead Webhook] Error updating duplicate lead:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to update existing lead", details: updateError.message },
          { status: 500 }
        );
      }

      console.log("[Lead Webhook] Updated existing lead:", updatedLead.id, "in", Date.now() - startTime, "ms");

      return NextResponse.json(
        {
          success: true,
          message: "Lead updated successfully (duplicate within 24h)",
          lead_id: updatedLead.id,
          duplicate: true,
        },
        { status: 200 }
      );
    }

    // 7. Create new lead
    const leadData = {
      customer_name: customerName.trim(),
      contact_number: normalizedPhone,
      email: email ? email.trim().toLowerCase() : null,
      device_type: deviceType,
      device_model: model.trim(),
      issue_reported: issue.trim(),
      lead_source: leadSource,
      landing_page_url: landingPage || null,
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_term: utmParams.utm_term || null,
      utm_content: utmParams.utm_content || null,
      workflow_status: "new",
      status: "new",
      priority: 3,
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("[Lead Webhook] Creating lead:", leadData);

    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (createError) {
      console.error("[Lead Webhook] Error creating lead:", createError);
      return NextResponse.json(
        { success: false, error: "Failed to create lead", details: createError.message },
        { status: 500 }
      );
    }

    console.log("[Lead Webhook] ✅ Lead created successfully:", newLead.id, "in", Date.now() - startTime, "ms");

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        lead_id: newLead.id,
        duplicate: false,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[Lead Webhook] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    },
  });
}
