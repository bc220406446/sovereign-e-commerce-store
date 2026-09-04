import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/db/helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action, reason, customerNotes, rejectionReason, refundMethod = "coupon" } = await req.json();
    const service = createServiceClient();
    const { data: order, error } = await service.from("orders").select("*").eq("id", id).single();
    if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const now = Date.now();
    if (order.return_completed && !(action === "refund" && order.return_request?.status === "approved")) {
      return NextResponse.json({ error: "This order's return/exchange has already been completed." }, { status: 400 });
    }
    const history = [...(order.history || [])];
    const updates: Record<string, unknown> = {};
    let request = order.return_request || null;

    if (action === "receive") {
      if (!request) return NextResponse.json({ error: "No return request exists" }, { status: 400 });
      request = { ...request, status: "received", reviewed_at: now };
      updates.status = "returned";
      history.push({ status: "returned", note: "Return received", at: now });
    } else if (action === "approve") {
      if (!request) return NextResponse.json({ error: "No return request exists" }, { status: 400 });
      request = { ...request, status: "approved", reviewed_at: now };
      history.push({ status: "return_approved", note: "Claim approved", at: now });
    } else if (action === "reject") {
      if (!rejectionReason?.trim()) return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      if (!request) return NextResponse.json({ error: "No return request exists" }, { status: 400 });
      request = { ...request, status: "rejected", rejection_reason: rejectionReason.trim(), reviewed_at: now };
      history.push({ status: "return_rejected", note: rejectionReason.trim(), at: now });
    } else if (action === "refund") {
      if (!request || request.status !== "approved") return NextResponse.json({ error: "Approve the claim first" }, { status: 400 });
      updates.status = "refunded";
      updates.payment_status = "refunded";
      let couponCode: string | undefined;
      const productSubtotal = Number(order.subtotal) || 0;
      const productPaid = Number(order.product_paid) || Math.max(0, productSubtotal - Number(order.discount || 0));
      const couponCredit = order.coupon_refundable ? Number(order.coupon_value || 0) : 0;
      // Delivery is excluded and the refund cannot exceed the product subtotal.
      const refundableAmount = Math.min(productSubtotal, Math.max(0, productPaid + couponCredit));
      if (refundMethod === "coupon") {
        couponCode = `REF-${order.order_number}`;
        const { error: couponError } = await service.from("coupons").upsert({
          code: couponCode,
          type: "fixed",
          value: refundableAmount,
          usage_limit: 1,
          active: true,
          coupon_type: "refund_credit",
        }, { onConflict: "code" });
        if (couponError) return NextResponse.json({ error: couponError.message }, { status: 500 });
      }
      updates.refund = { amount: refundableAmount, product_amount: Number(order.product_paid || (Number(order.subtotal) - Number(order.discount))), coupon_amount: order.coupon_refundable ? Number(order.coupon_value || 0) : 0, delivery_refunded: 0, method: refundMethod, coupon_code: couponCode, generated_at: now };
      updates.return_completed = true;
      history.push({ status: "refunded", note: `Refund generated via ${refundMethod}`, at: now });
    } else {
      return NextResponse.json({ error: "Unsupported claim action" }, { status: 400 });
    }

    updates.return_request = request;
    updates.history = history;
    const { data: updated, error: updateError } = await service.from("orders").update(updates).eq("id", id).select().single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
