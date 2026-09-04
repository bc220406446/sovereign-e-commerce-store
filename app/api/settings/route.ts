import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db/helpers";

export async function GET() {
  const delivery = await getSetting("delivery", { defaultCharge: 200, expressCharge: 500, freeThreshold: 10000 });
  const paymentMethods = await getSetting("paymentMethods", ["cod", "bank_transfer", "card", "payfast"]);
  return NextResponse.json({ delivery, paymentMethods });
}
