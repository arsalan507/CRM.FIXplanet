import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customer_name,
      contact_number,
      email,
      device_type,
      device_model,
      issue_reported,
      quoted_amount,
    } = body;

    // Update lead
    const { data: updatedLead, error } = await supabase
      .from("leads")
      .update({
        customer_name,
        contact_number,
        email,
        device_type,
        device_model,
        issue_reported,
        quoted_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating lead:", error);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, lead: updatedLead },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in lead update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
