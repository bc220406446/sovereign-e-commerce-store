"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ProductImage } from "@/components/store/ProductImage";
import { AdminHeader } from "../../layout";
import { formatDateTime, formatRs, ORDER_STATUS_LABELS, ORDER_STATUS_TONES, PAYMENT_METHOD_LABELS } from "@/lib/store";
import { Order } from "@/types/database";

const FLOW = [
  ["placed", "Order Placed"],
  ["confirmed", "Confirmed"],
  ["packaging", "Processing"],
  ["handed_to_courier", "Handed to Courier"],
  ["delivered", "Delivered"],
  ["return_requested", "Return Requested"],
  ["returned", "Return Received"],
];

export default function OrderManagementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [reshipCourier, setReshipCourier] = useState("");
  const [reshipTracking, setReshipTracking] = useState("");
  const [replacementCourier, setReplacementCourier] = useState("");
  const [replacementTracking, setReplacementTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [reshipMode, setReshipMode] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [failureNotes, setFailureNotes] = useState("");
  const [reshipmentReason, setReshipmentReason] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`).then((res) => res.json()).then((data) => {
      if (data?.id) { setOrder(data); setCourier(data.courier || ""); setTracking(data.tracking_number || ""); setReshipCourier(data.reshipment?.company || ""); setReshipTracking(data.reshipment?.tracking_id || ""); setReplacementCourier(data.replacement_shipping?.company || ""); setReplacementTracking(data.replacement_shipping?.tracking_id || ""); }
      else setError(data?.error || "Order not found");
    });
  }, [id]);

  const update = async (body: Record<string, string>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setOrder(data);
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };

  const updateClaim = async (action: "approve" | "reject" | "refund") => {
    if (action === "reject" && !rejectionReason.trim()) { setError("Rejection reason is required."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}/claim`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, rejectionReason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim update failed");
      setOrder(data);
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };

  if (!order) return <div className="p-8">{error || "Loading order..."}</div>;
  const address: any = order.shipping_address || {};
  const refundAmount = Math.min(Number(order.subtotal) || 0, Math.max(0, Number(order.product_paid) || Math.max(0, Number(order.subtotal) - Number(order.discount || 0)) + (order.coupon_refundable ? Number(order.coupon_value || 0) : 0)));
  const claimDelivered = (order.status as string) === "claim_delivered";
  const isReplacement = ["reshipped", "reshipment", "refunded", "claim_delivered"].includes(order.status as string);
  const currentIndex = isReplacement ? FLOW.length - 1 : FLOW.findIndex(([key]) => key === order.status);
  const courierHandoverLocked = order.status === "handed_to_courier" && Boolean(order.courier && order.tracking_number);

  return <div>
    <AdminHeader title={`Order ${order.order_number}`} subtitle="Order management and fulfillment" action={!["placed","cancelled"].includes(order.status) ? <Button asChild className="rounded-full"><a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noreferrer">Generate Invoice</a></Button> : undefined} />
    <main className="space-y-5">
      <Button variant="ghost" asChild className="rounded-full"><Link href="/admin/orders"><ArrowLeft className="mr-2 size-4" />Back to orders</Link></Button>

      <section className="glass rounded-3xl p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs uppercase tracking-widest text-slate-500">Order</p><h1 className="font-display text-3xl font-semibold">{order.order_number}</h1><p className="text-xs text-slate-500">{formatDateTime(new Date(order.created_at).getTime())}</p></div>
          <Badge variant="outline" className={ORDER_STATUS_TONES[order.status] || ""}>{ORDER_STATUS_LABELS[order.status] || order.status}</Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 border-t border-slate-200/60 pt-5">
          <div><h2 className="font-semibold">Customer</h2><p className="mt-2">{order.customer_name}</p><p className="text-slate-500">{order.phone}</p><p className="text-slate-500">{order.email}</p></div>
          <div><h2 className="font-semibold">Shipping Address</h2><p className="mt-2">{address.line1}</p>{address.line2 && <p className="text-slate-500">{address.line2}</p>}<p className="text-slate-500">{address.city}, {address.province}</p><p className="text-slate-500">{address.postal_code}</p></div>
        </div>

        <div className="border-t border-slate-200/60 pt-5"><h2 className="mb-3 font-semibold">Products</h2>{order.items?.map((item, index) => <div key={index} className="flex items-center justify-between border-b border-slate-200/50 py-3 last:border-0"><div className="flex items-center gap-3"><ProductImage src={item.image ?? undefined} alt={item.name} className="size-12 rounded-lg" /><span>{item.name} × {item.qty}</span></div><strong>{formatRs(item.price * item.qty)}</strong></div>)}<div className="flex justify-end pt-3 font-bold">Total: {formatRs(order.total)}</div></div>

        <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Payment Method</h2><p className="mt-2">{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</p></div>

        <div className="border-t border-slate-200/60 pt-5"><h2 className="mb-4 font-semibold">Order Status</h2><div className="space-y-3">{FLOW.map(([key, label], index) => { const distance = Math.abs(index - currentIndex); const available = !isReplacement && distance <= 1; const active = index <= currentIndex; const isCurrent = !isReplacement && distance === 0; const isAdjacent = !isReplacement && distance === 1; const previousKey = index > 0 ? FLOW[index - 1][0] : null; const lockedHandover = isCurrent && key === "handed_to_courier" && courierHandoverLocked; const deliveryStatus = order.status as string; const secondAttempt = deliveryStatus === "handed_to_courier" && Number(order.delivery_failure_count || 0) > 0; return <Fragment key={key}><div className={`flex items-center justify-between rounded-xl px-2 py-1 transition-colors ${isCurrent ? "bg-primary/10" : isAdjacent ? "bg-primary/[0.04]" : "opacity-45"}`}><div className="flex items-center gap-3"><span className={`flex size-6 items-center justify-center rounded-full ${isCurrent ? "bg-primary text-white shadow-sm" : isAdjacent ? "bg-primary/65 text-white" : active ? "bg-primary/25 text-primary" : "bg-slate-200 text-slate-500"}`}>{active ? <Check className="size-3" /> : index + 1}</span><span className={isCurrent ? "font-semibold text-slate-900" : isAdjacent ? "font-medium text-slate-700" : "text-slate-500"}>{label}</span></div><Switch checked={index <= currentIndex} disabled={busy || !available || (!isCurrent && index < currentIndex) || lockedHandover} onCheckedChange={(checked) => { if (isCurrent && !checked && previousKey) update({ status: previousKey }); else if (!isCurrent && checked) update({ status: key }); }} aria-label={`Toggle ${label}`} /></div>{key === "handed_to_courier" && deliveryStatus === "handed_to_courier" && <div className="mt-3 border-t border-slate-200/60 pt-4"><h3 className="font-semibold">Delivery Outcome</h3><p className="mt-2 text-sm text-slate-500">Choose the result reported by the courier.</p><div className="mt-3 flex flex-wrap gap-2"><Button className="rounded-full" disabled={busy || !order.courier || !order.tracking_number} onClick={() => update({ status: "delivered" })}>Delivered</Button><Button variant="outline" className="rounded-full" disabled={busy || !order.courier || !order.tracking_number} onClick={() => secondAttempt ? update({ status: "cancelled" }) : update({ status: "delivery_failed", failureReason: "Courier did not deliver the parcel" })}>Not Delivered / Returned by Courier</Button></div>{(!order.courier || !order.tracking_number) ? <p className="mt-2 text-xs text-slate-500">Save courier and tracking details before marking Delivered.</p> : null}</div>}</Fragment>; })}</div><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" className="rounded-full" disabled={busy} onClick={() => update({ status: "cancelled" })}>Cancel Order</Button></div></div>


        {["handed_to_courier", "delivered", "delivery_failed", "return_requested", "returned"].includes(order.status) && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Shipping</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier e.g. TCS" /><Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking ID" /></div><Button className="mt-3 rounded-full" disabled={busy} onClick={() => update({ courier, trackingNumber: tracking })}>Save Shipping</Button></div>}

        {(order.status as string) === "delivery_failed" && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Delivery Failed / Returned by Courier</h2><p className="mt-2 text-sm text-slate-500">Record the reason, then choose whether to reship or cancel.</p><Input value={failureReason} onChange={(e) => setFailureReason(e.target.value)} placeholder="Reason" className="mt-3" /><div className="mt-3 flex flex-wrap gap-2"><Button className="rounded-full" disabled={busy || !failureReason.trim()} onClick={() => setReshipMode(true)}>Reship Order</Button><Button variant="outline" className="rounded-full" disabled={busy} onClick={() => update({ status: "cancelled", failureReason, failureNotes })}>Cancel Order</Button></div>{reshipMode && <div className="mt-4 border-t border-slate-200/60 pt-4"><h3 className="font-semibold">Reshipment</h3><p className="mt-2 text-sm text-slate-500">Enter the new courier company and tracking ID.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={reshipCourier} onChange={(e) => setReshipCourier(e.target.value)} placeholder="Reshipping company" /><Input value={reshipTracking} onChange={(e) => setReshipTracking(e.target.value)} placeholder="Reshipping tracking ID" /></div><Button className="mt-3 rounded-full" disabled={busy || !reshipCourier || !reshipTracking} onClick={() => update({ status: "handed_to_courier", shipmentType: "reshipment", returnCourier: reshipCourier, returnTrackingNumber: reshipTracking, reshipmentReason: failureReason, failureReason, failureNotes })}>Save Reshipment</Button></div>}</div>}

        {["delivered", "replacement_delivered"].includes(order.status as string) && !order.return_request && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Return / Claim</h2><p className="mt-2 text-slate-500">No return request has been submitted.</p></div>}

        {order.return_request && order.status === "returned" && !order.return_completed && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Claim Review</h2><p className="mt-2 text-slate-500">Choose an outcome. You can switch the decision before finalizing the refund or re-shipment.</p><div className="mt-3 flex flex-wrap gap-2"><Button className="rounded-full" disabled={busy} onClick={() => { setRejectMode(false); updateClaim("approve"); }}>Refund Claim</Button><Button variant="outline" className="rounded-full" disabled={busy} onClick={() => setRejectMode(true)}>Exchange / Reject Claim</Button></div>{order.return_request.status === "approved" && !rejectMode && <div className="mt-4 border-t border-slate-200/60 pt-4"><h3 className="font-semibold">Refund</h3><p className="mt-2 text-slate-500">Refund amount: {formatRs(refundAmount)} <span className="text-xs">(delivery charges excluded)</span></p><Button className="mt-3 rounded-full" disabled={busy} onClick={() => updateClaim("refund")}>Generate Refund Coupon</Button></div>}{order.return_request.status === "rejected" && <div className="mt-4 border-t border-slate-200/60 pt-4"><h3 className="font-semibold">Exchange / Reject Claim</h3>{rejectMode && <><Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Exchange / rejection reason" className="mt-3 max-w-xl rounded-full" /><Button variant="outline" className="mt-3 rounded-full" disabled={busy} onClick={() => updateClaim("reject")}>Confirm Exchange / Rejection</Button></>}</div>}</div>}
        {rejectMode && order.return_request && order.return_request.status !== "rejected" && order.status === "returned" && !order.return_completed && <div className="border-t border-slate-200/60 pt-5"><p className="text-sm text-slate-500">Enter the exchange/rejection reason to continue.</p><Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Exchange / rejection reason" className="mt-3 max-w-xl rounded-full" /><Button variant="outline" className="mt-3 rounded-full" disabled={busy} onClick={() => updateClaim("reject")}>Confirm Exchange / Rejection</Button></div>}

        {order.return_request?.status === "rejected" && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Replacement Shipping</h2><p className="mt-2 text-slate-500">Product Exchange / Claim Rejected. Prepare a separate replacement shipment.</p>{!reshipMode ? <Button className="mt-3 rounded-full" disabled={busy} onClick={() => setReshipMode(true)}>Prepare Replacement Shipping</Button> : <><p className="mt-3 text-slate-500">Assign the replacement courier and tracking ID.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={replacementCourier} onChange={(e) => setReplacementCourier(e.target.value)} placeholder="Replacement courier" /><Input value={replacementTracking} onChange={(e) => setReplacementTracking(e.target.value)} placeholder="Replacement tracking ID" /></div><Button className="mt-3 rounded-full" disabled={busy || !replacementCourier || !replacementTracking} onClick={() => update({ status: "reshipped", shipmentType: "replacement_shipping", returnCourier: replacementCourier, returnTrackingNumber: replacementTracking, reshipmentReason: rejectionReason || "Approved exchange replacement" })}>Save Replacement Shipping</Button></>}</div>}

        {order.return_request?.status === "rejected" && (order.status as string) === "reshipped" && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Replacement Delivery</h2><p className="mt-2 text-slate-500">Choose the result of the replacement shipment.</p><div className="mt-3 flex flex-wrap gap-2"><Button className="rounded-full" disabled={busy} onClick={() => update({ status: "claim_delivered" })}>Claim Delivered</Button><Button variant="outline" className="rounded-full" disabled={busy} onClick={() => update({ status: "cancelled" })}>Not Delivered / Returned by Courier</Button></div></div>}
        {claimDelivered && <div className="border-t border-slate-200/60 pt-5"><div className="flex items-center justify-between rounded-xl bg-primary/[0.04] px-3 py-3 opacity-60"><div><p className="font-medium text-slate-700">Claim Delivered</p><p className="text-xs text-slate-500">The replacement claim has been completed.</p></div><Switch checked disabled aria-label="Claim delivered" /></div></div>}

        <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Payment Status</h2><div className="mt-3 flex flex-wrap gap-2">{([["pending", "Pending"], ["failed", "Failed"], ["paid", "Received"], ["refunded", "Refunded"]] as const).map(([value, label]) => <Button key={value} size="sm" variant={order.payment_status === value ? "default" : "outline"} className="rounded-full" disabled={busy} onClick={() => update({ paymentStatus: value })}>{label}</Button>)}</div></div>
        {(order.courier || order.tracking_number || order.reshipment || order.replacement_shipping) && <div className="border-t border-slate-200/60 pt-5"><h2 className="font-semibold">Shipment Details</h2><div className="mt-3 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-primary/[0.04] p-3"><p className="font-medium">Shipping Details</p><p className="mt-2 text-sm text-slate-500">{order.courier || "-"}</p><p className="text-sm text-slate-500">{order.tracking_number || "-"}</p></div>{order.reshipment && <div className="rounded-xl bg-primary/[0.04] p-3"><p className="font-medium">Re-shipping Details</p><p className="mt-2 text-sm text-slate-500">{order.reshipment.company}</p><p className="text-sm text-slate-500">{order.reshipment.tracking_id}</p><p className="mt-1 text-xs text-slate-500">{order.reshipment.reason || "-"}</p></div>}{order.replacement_shipping && <div className="rounded-xl bg-primary/[0.04] p-3"><p className="font-medium">Replacement Shipping Details</p><p className="mt-2 text-sm text-slate-500">{order.replacement_shipping.company}</p><p className="text-sm text-slate-500">{order.replacement_shipping.tracking_id}</p><p className="mt-1 text-xs text-slate-500">{order.replacement_shipping.reason || "-"}</p></div>}</div></div>}
      </section>
    </main>
  </div>;
}
