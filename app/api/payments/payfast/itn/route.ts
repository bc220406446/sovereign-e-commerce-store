import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validatePayfastItn } from "@/lib/payfast";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const fields: Record<string, string> = {};
    params.forEach((value, key) => {
      fields[key] = value;
    });

    const sandbox = process.env.PAYFAST_SANDBOX === "true";
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    const isValid = await validatePayfastItn(fields, sandbox, passphrase);
    if (!isValid) {
      console.warn("[PayFast ITN] Invalid signature/validation");
      return new NextResponse("Invalid ITN signature", { status: 400 });
    }

    if (fields.payment_status !== "COMPLETE") {
      return new NextResponse("Payment status ignored", { status: 200 });
    }

    const orderNumber = fields.m_payment_id;
    const pfPaymentId = fields.pf_payment_id;
    const amountGross = Number(fields.amount_gross || fields.amount);

    const service = createServiceClient();
    const { data: order, error } = await service
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      console.warn("[PayFast ITN] Order not found for number:", orderNumber);
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order.payment_status !== "paid") {
      const history = [
        ...(order.history || []),
        {
          status: "paid",
          note: pfPaymentId
            ? `Payment confirmed via PayFast (ID ${pfPaymentId})`
            : "Payment confirmed via PayFast",
          at: Date.now(),
        },
      ];

      await service
        .from("orders")
        .update({
          payment_status: "paid",
          history,
        })
        .eq("id", order.id);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("[PayFast ITN] Error:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
