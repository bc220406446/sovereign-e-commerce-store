import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/db/helpers";

export async function GET() {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const [{ data: admins }, { data: invites }] = await Promise.all([
      service.from("profiles").select("*").eq("role", "admin"),
      service.from("admin_invites").select("*").order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      admins: admins || [],
      invites: invites || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAdmin();
    const { email, role } = await req.json();
    const normalized = email.trim().toLowerCase();

    const service = createServiceClient();
    const { data: invite, error } = await service
      .from("admin_invites")
      .insert({
        email: normalized,
        role: role || "admin",
        status: "pending",
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(invite);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (type === "admin") {
      if (id === user.id) return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 });
      const service = createServiceClient();
      const { error } = await service.from("profiles").update({ role: "user" }).eq("id", id).eq("role", "admin");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    const service = createServiceClient();
    await service.from("admin_invites").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
