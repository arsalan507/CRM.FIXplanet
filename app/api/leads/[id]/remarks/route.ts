import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get staff record for the authenticated user
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: "Staff record not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { remark, status_changed_to, follow_up_date } = body;

    if (!remark || !remark.trim()) {
      return NextResponse.json(
        { error: "Remark is required" },
        { status: 400 }
      );
    }

    // Insert remark
    const { data: newRemark, error: remarkError } = await supabase
      .from("lead_remarks")
      .insert({
        lead_id: params.id,
        staff_id: staff.id,
        remark: remark.trim(),
        status_changed_to: status_changed_to || null,
      })
      .select()
      .single();

    if (remarkError) {
      console.error("Error inserting remark:", remarkError);
      return NextResponse.json(
        { error: "Failed to add remark" },
        { status: 500 }
      );
    }

    // If status was changed or follow_up_date was set, update the lead
    if (status_changed_to || follow_up_date) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (status_changed_to) {
        updateData.workflow_status = status_changed_to;
      }

      if (follow_up_date) {
        updateData.follow_up_date = follow_up_date;
      }

      const { error: leadUpdateError } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", params.id);

      if (leadUpdateError) {
        console.error("Error updating lead:", leadUpdateError);
        // Note: We don't fail the request here since the remark was added
      }
    }

    return NextResponse.json(
      { success: true, remark: newRemark },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in remarks API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
