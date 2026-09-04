import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const email = String((await req.json()).email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    const { error } = await createServiceClient().from("newsletter_subscribers").upsert({ email, status: "subscribed", unsubscribed_at: null }, { onConflict: "email" });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Unable to subscribe." }, { status: 500 }); }
}
