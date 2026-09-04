"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductImage } from "@/components/store/ProductImage";
import Link from "next/link";
import { AdminHeader } from "../layout";
import { CheckCircle2, Loader2, PackageSearch, Search, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  formatDateTime,
  formatRs,
} from "@/lib/store";
import { Order } from "@/types/database";

const FLOW_STEPS = [
  "placed", "confirmed", "packaging", "packaged",
  "handed_to_courier", "out_for_delivery", "delivered", "completed",
];

const FAILURE_STEPS = ["delivery_failed", "return_requested", "return_approved", "returned", "refunded", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openOrder, setOpenOrder] = useState<Order | null>(null);

  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchOrders = () => {
    let url = "/api/admin/orders";
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setOrders(data); });
  };

  useEffect(() => {
    fetchOrders();
  }, [status, search]);

  const updateOrderStatus = async (nextStatus: string, note?: string) => {
    if (!openOrder) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${openOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: note || statusNote }),
      });
      if (!res.ok) throw new Error("Status update failed");
      const updated = await res.json();
      setOpenOrder(updated);
      fetchOrders();
      setStatusNote("");
      toast.success(`Order → ${ORDER_STATUS_LABELS[nextStatus] || nextStatus}`);
    } catch {
      toast.error("Could not update order status.");
    } finally {
      setBusy(false);
    }
  };

  const updateTracking = async () => {
    if (!openOrder || !courier.trim() || !trackingNumber.trim()) {
      toast.error("Please enter both courier and tracking number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${openOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier: courier.trim(), trackingNumber: trackingNumber.trim() }),
      });
      if (!res.ok) throw new Error("Tracking update failed");
      const updated = await res.json();
      setOpenOrder(updated);
      fetchOrders();
      toast.success("Courier tracking updated.");
    } catch {
      toast.error("Tracking update failed.");
    } finally {
      setBusy(false);
    }
  };

  const updateClaim = async (action: string) => {
    if (!openOrder) return;
    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${openOrder.id}/claim`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim update failed");
      setOpenOrder(data);
      fetchOrders();
      setRejectionReason("");
      toast.success("Return claim updated.");
    } catch (err: any) {
      toast.error(err.message || "Claim update failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Orders"
        subtitle={`Fulfillment workflow, statuses & shipping tracking (${orders.length} orders)`}
      />

      <div className="glass rounded-3xl p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, name, phone..."
              className="rounded-full pl-9 bg-white/70 text-xs"
            />
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48 rounded-full bg-white/70 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400">
                <th className="pb-3 font-semibold">Order</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Customer</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Items</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Payment</th>
                <th className="hidden pb-3 font-semibold text-right sm:table-cell">Total</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="hidden py-3 sm:table-cell">
                    <p className="font-mono font-bold text-slate-900">{o.order_number}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(new Date(o.created_at).getTime())}</p>
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-slate-800">{o.customer_name}</p>
                    <p className="text-slate-400">{o.phone}</p>
                  </td>
                  <td className="hidden py-3 text-slate-600 sm:table-cell">{(o.items || []).length} items</td>
                  <td className="hidden py-3 sm:table-cell">
                    <Badge variant="outline" className={ORDER_STATUS_TONES[o.status] || ""}>
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className={o.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {o.payment_status}
                    </Badge>
                  </td>
                  <td className="hidden py-3 text-right font-bold text-slate-900 sm:table-cell">{formatRs(o.total)}</td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={() => window.location.href = `/admin/orders/${o.id}`}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANAGE ORDER DIALOG */}
      <Dialog open={Boolean(openOrder)} onOpenChange={(o) => (!o ? setOpenOrder(null) : undefined)}>
        <DialogContent className="glass-strong sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {openOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Placed on {openOrder && formatDateTime(new Date(openOrder.created_at).getTime())} by {openOrder?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {openOrder && (
            <div className="space-y-6 pt-2 text-xs">
              {/* Customer & Address */}
              <div className="grid grid-cols-2 gap-4 glass-soft rounded-2xl p-4">
                <div>
                  <p className="font-semibold text-slate-800">Customer Info</p>
                  <p className="text-slate-600 mt-1">{openOrder.customer_name}</p>
                  <p className="text-slate-500">{openOrder.email}</p>
                  <p className="text-slate-500">{openOrder.phone}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Shipping Address</p>
                  <p className="text-slate-600 mt-1">{openOrder.shipping_address?.line1}</p>
                  <p className="text-slate-500">{openOrder.shipping_address?.city}, {openOrder.shipping_address?.province}</p>
                  <p className="text-slate-500">{openOrder.shipping_address?.postal_code}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Order Items</p>
                {(openOrder.items || []).map((item, idx) => (
                  <div key={idx} className="glass-soft flex items-center justify-between rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <ProductImage src={item.image ?? undefined} alt={item.name} className="size-10 rounded-lg" />
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-slate-400">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatRs(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Status workflow transitions */}
              <div className="space-y-2 border-t border-slate-200/60 pt-4">
                <p className="font-semibold text-slate-800">Advance Order Status</p>
                <div className="flex flex-wrap gap-2">
                  {FLOW_STEPS.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={openOrder.status === s ? "default" : "outline"}
                      className="rounded-full text-[11px]"
                      disabled={busy}
                      onClick={() => updateOrderStatus(s)}
                    >
                      {ORDER_STATUS_LABELS[s] || s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Courier tracking */}
              <div className="space-y-2 border-t border-slate-200/60 pt-4">
                <p className="font-semibold text-slate-800">Courier Tracking</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Courier (e.g. TCS, Leopards, Trax)" value={courier} onChange={(e) => setCourier(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
                  <Input placeholder="Tracking Number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <Button size="sm" className="rounded-full mt-1" onClick={updateTracking} disabled={busy}>
                  Save Courier Tracking
                </Button>
              </div>

              {openOrder.status === "delivered" && !openOrder.return_request && (
                <div className="space-y-2 border-t border-slate-200/60 pt-4">
                  <p className="font-semibold text-slate-800">Return / Claim</p>
                  <p className="text-slate-500">No return request has been submitted.</p>
                </div>
              )}

              {openOrder.return_request && (
                <div className="space-y-3 border-t border-slate-200/60 pt-4">
                  <div>
                    <p className="font-semibold text-slate-800">Return Request</p>
                    <p className="text-slate-600 mt-1">Reason: {openOrder.return_request.reason}</p>
                    {openOrder.return_request.customer_notes && <p className="text-slate-500">Notes: {openOrder.return_request.customer_notes}</p>}
                    <p className="text-slate-500">Status: {openOrder.return_request.status}</p>
                  </div>
                  {openOrder.return_request.status === "received" && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="rounded-full" disabled={busy} onClick={() => updateClaim("approve")}>Approve Claim</Button>
                      <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Rejection reason" className="max-w-xs rounded-full bg-white/70 text-xs" />
                      <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => updateClaim("reject")}>Reject Claim</Button>
                    </div>
                  )}
                  {openOrder.return_request.status === "approved" && (
                    <Button size="sm" className="rounded-full" disabled={busy} onClick={() => updateClaim("refund")}>Generate Refund Coupon</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
