import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSetting, setSetting } from "@/lib/db/helpers";

export async function GET() {
  try {
    await requireAdmin();
    const delivery = await getSetting("delivery", { defaultCharge: 200, expressCharge: 500, freeThreshold: 10000 });
    const paymentMethods = await getSetting("paymentMethods", ["cod", "bank_transfer", "card", "payfast"]);
    const defaultAdminEmail = await getSetting("defaultAdminEmail", "");
    return NextResponse.json({ delivery, paymentMethods, defaultAdminEmail });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (body.delivery) await setSetting("delivery", body.delivery);
    if (body.paymentMethods) await setSetting("paymentMethods", body.paymentMethods);
    if (body.defaultAdminEmail !== undefined) await setSetting("defaultAdminEmail", body.defaultAdminEmail);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
