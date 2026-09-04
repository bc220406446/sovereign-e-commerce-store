import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/db/helpers";
import { sendStatusUpdateEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status, note, courier, trackingNumber, paymentStatus, returnCourier, returnTrackingNumber, failureReason, failureNotes, courierReturnTrackingNumber, reshipmentReason, shipmentType } = body;

    const service = createServiceClient();
    const { data: order, error: getErr } = await service
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (getErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status) {
      const next: Record<string, string[]> = {
        placed: ["confirmed", "cancelled"],
        confirmed: ["placed", "packaging", "cancelled"],
        packaging: ["confirmed", "handed_to_courier", "cancelled"],
        handed_to_courier: ["packaging", "delivered", "delivery_failed", "reshipped", "cancelled"],
        delivery_failed: ["handed_to_courier", "reshipped", "cancelled"],
        delivered: ["handed_to_courier", "completed", "return_requested"],
        return_requested: ["delivered", "returned"],
        returned: ["return_requested", "reshipped"],
        reshipped: ["replacement_delivered", "claim_delivered", "cancelled"],
        replacement_delivered: ["reshipped", "return_requested"],
        claim_delivered: ["reshipped", "return_requested"],
      };
      if (next[order.status] && !next[order.status].includes(status)) {
        return NextResponse.json({ error: `Order must move from ${order.status} to the next valid step.` }, { status: 400 });
      }
      if (order.status === "handed_to_courier" && status === "packaging" && order.courier && order.tracking_number) {
        return NextResponse.json({ error: "This order cannot be moved back after courier tracking has been assigned." }, { status: 400 });
      }
      if (order.status === "returned" && status === "return_requested" && ["approved", "rejected"].includes(order.return_request?.status)) {
        return NextResponse.json({ error: "Return Received cannot be undone after the claim has been approved or rejected." }, { status: 400 });
      }
      if (status === "delivered" && !(order.courier && order.tracking_number || courier && trackingNumber)) {
        return NextResponse.json({ error: "Save the courier and tracking ID before marking the order delivered." }, { status: 400 });
      }
    }

    // Restock if cancelled, returned, refunded
    const restockingStatuses = ["cancelled", "returned", "refunded"];
    if (status && restockingStatuses.includes(status)) {
      const alreadyRestocked = order.history?.some((h: any) => h.status === "restocked");
      if (!alreadyRestocked && Array.isArray(order.items)) {
        for (const item of order.items) {
          const { data: p } = await service.from("products").select("stock").eq("id", item.product_id).single();
          if (p) {
            await service.from("products").update({ stock: p.stock + item.qty }).eq("id", item.product_id);
          }
        }
      }
    }

    const history = [...(order.history || [])];
    // Saving courier/payment metadata must not create a fake status event.
    // Also ignore repeated submissions of the same status.
    if (status && status !== order.status) {
      history.push({ status, note: note || `Status updated to ${status}`, at: Date.now() });
    }

    const updates: any = { history };
    if (status) updates.status = status;
    if (courier) updates.courier = courier;
    if (trackingNumber) updates.tracking_number = trackingNumber;
    if (returnCourier) updates.return_courier = returnCourier;
    if (returnTrackingNumber) updates.return_tracking_number = returnTrackingNumber;
    if (reshipmentReason) updates.reshipment_reason = reshipmentReason.trim();
    if (courierReturnTrackingNumber) updates.courier_return_tracking_number = courierReturnTrackingNumber;
    if (status === "reshipped") {
      if (!reshipmentReason?.trim() || !returnCourier?.trim() || !returnTrackingNumber?.trim()) {
        return NextResponse.json({ error: "Reason, re-shipping company and tracking ID are required." }, { status: 400 });
      }
      updates.reshipment_reason = reshipmentReason.trim();
      updates.return_courier = returnCourier.trim();
      updates.return_tracking_number = returnTrackingNumber.trim();
      if (shipmentType === "replacement_shipping") {
        updates.replacement_shipping = { company: returnCourier.trim(), tracking_id: returnTrackingNumber.trim(), reason: reshipmentReason?.trim() || "Approved exchange replacement", saved_at: Date.now() };
      }
    }
    if (shipmentType === "reshipment" && returnCourier?.trim() && returnTrackingNumber?.trim()) {
      updates.reshipment = { company: returnCourier.trim(), tracking_id: returnTrackingNumber.trim(), reason: reshipmentReason?.trim() || failureReason?.trim() || "Courier returned the parcel", saved_at: Date.now() };
    }
    if (status === "delivery_failed") {
      if (!failureReason?.trim()) return NextResponse.json({ error: "Select a delivery failure reason." }, { status: 400 });
      updates.delivery_failure = { reason: failureReason.trim(), notes: failureNotes?.trim() || "", recorded_at: Date.now() };
      updates.delivery_failure_count = Number(order.delivery_failure_count || 0) + 1;
    }
    if (paymentStatus && ["pending", "failed", "paid", "refunded"].includes(paymentStatus)) {
      updates.payment_status = paymentStatus;
    }
    const paymentReceived = paymentStatus === "paid" || order.payment_status === "paid";
    const deliveredAndPaid = (status === "delivered" || order.status === "delivered") && paymentReceived;
    if (deliveredAndPaid && order.status !== "completed") {
      updates.status = "completed";
      if (!history.some((entry: any) => entry.status === "completed")) {
        history.push({ status: "completed", note: "Order completed after delivery and payment received", at: Date.now() });
      }
    }
    // A manually advanced order can reach Return Received without a
    // customer-created request. Create the review record so the next
    // approve/reject actions are available immediately.
    if (status === "returned" && !order.return_request) {
      updates.return_request = {
        reason: "Return received by admin",
        customer_notes: "",
        status: "received",
        requested_at: Date.now(),
      };
    }
    if (status === "reshipped" && order.return_request?.status === "rejected") updates.return_completed = true;

    const { data: updated, error: updateErr } = await service
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (order.email && status) {
      sendStatusUpdateEmail({
        to: order.email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        status,
        note,
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
