import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { payfastConfig, payfastSignature } from "@/lib/payfast";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, origin, token } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const service = createServiceClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = service.from("orders").select("*");
    if (isUuid) query = query.eq("id", orderId);
    else query = query.eq("order_number", orderId);

    const { data: order, error } = await query.single();
    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "This order has already been paid." }, { status: 400 });
    }

    const cfg = payfastConfig();
    const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const fields: Record<string, string> = {
      merchant_id: cfg.merchantId,
      merchant_key: cfg.merchantKey,
      return_url: `${baseUrl}/checkout?status=payfast_success&order=${encodeURIComponent(
        order.order_number
      )}`,
      cancel_url: `${baseUrl}/checkout?status=cancelled&order=${encodeURIComponent(
        order.order_number
      )}`,
      notify_url: `${baseUrl}/api/payments/payfast/itn`,
      ...(order.email ? { email_address: order.email } : {}),
      m_payment_id: order.order_number,
      amount: Number(order.total).toFixed(2),
      item_name: `Sovereign order ${order.order_number}`,
      item_description: (order.items || [])
        .map((i: any) => `${i.name} x ${i.qty}`)
        .join(", ")
        .slice(0, 255),
      custom_str1: String(order.id),
    };

    fields.signature = payfastSignature(fields, cfg.passphrase);

    return NextResponse.json({ url: cfg.processUrl, fields });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
