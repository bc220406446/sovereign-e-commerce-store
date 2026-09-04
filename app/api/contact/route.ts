import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const topic = String(body.topic || "Other").trim();
    const message = String(body.message || "").trim();
    if (!name || !email || !message) return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
    const { error } = await createServiceClient().from("contact_messages").insert({ name, email, phone: String(body.phone || "").trim() || null, topic, message });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Unable to send message." }, { status: 500 }); }
}
