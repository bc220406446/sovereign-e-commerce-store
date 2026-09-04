import { Badge } from "@/components/ui/badge";
import { Check, Circle } from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  TRACKING_FLOW,
  TRACKING_FLOW_LABELS,
  formatRs,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export type TrackableOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  courier?: string;
  tracking_number?: string;
  history: { status: string; note?: string; at: number }[];
  items: { name: string; qty: number; image?: string; price?: number }[];
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postal_code: string;
  };
  customer_name: string;
  phone: string;
};

export function OrderTimeline({ order }: { order: TrackableOrder }) {
  const stepIndex = Math.max(TRACKING_FLOW.indexOf(order.status as never), 0);
  const special = ["delivery_failed", "returned", "refunded", "cancelled"];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Order {order.order_number}</p>
            <p className="font-display text-xl font-semibold text-slate-900">
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border",
                order.payment_status === "paid"
                  ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/80"
                  : "bg-amber-100/80 text-amber-700 border-amber-200/80",
              )}
            >
              {order.payment_status === "paid" ? "Paid" : "Payment pending"}
            </Badge>
            <Badge variant="outline" className={cn("border", ORDER_STATUS_TONES[order.status])}>
              {formatRs(order.total)}
            </Badge>
          </div>
        </div>

        {/* timeline */}
        <ol className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-200">
          {TRACKING_FLOW.map((s: string, i: number) => {
            const done = i <= stepIndex;
            const current =
              i === stepIndex && !["delivered", "completed"].includes(order.status);
            const isFinal = i === TRACKING_FLOW.length - 1;
            return (
              <li key={s} className="relative">
                <span
                  className={cn(
                    "absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full border",
                    done
                      ? "border-primary bg-primary text-white"
                      : "border-slate-300 bg-white text-transparent",
                    current && "ring-4 ring-primary/20",
                  )}
                >
                  {done && !isFinal ? (
                    <Check className="size-2.5" />
                  ) : isFinal && done ? (
                    <Circle className="size-2 fill-current" />
                  ) : null}
                </span>
                <div
                  className={cn(
                    "flex items-center justify-between",
                    done ? "text-slate-800" : "text-slate-400",
                  )}
                >
                  <p className={cn("text-sm font-medium", current && "font-bold text-primary")}>
                    {TRACKING_FLOW_LABELS[s]}
                  </p>
                  {done && current && (
                    <span className="glass-chip rounded-full px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Current status
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Courier tracking strip */}
        {order.courier && order.tracking_number && (
          <div className="glass-soft mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <div>
              <p className="text-xs text-slate-500">Shipped with</p>
              <p className="font-semibold text-slate-800">{order.courier}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Tracking number</p>
              <p className="font-mono text-sm font-bold text-slate-900">
                {order.tracking_number}
              </p>
            </div>
          </div>
        )}

        {/* History log */}
        {order.history && order.history.length > 0 && (
          <div className="mt-6 border-t border-slate-200/60 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Activity History
            </p>
            <div className="space-y-2">
              {order.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">{h.note || h.status}</span>
                  <span className="text-slate-400">
                    {new Date(h.at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
