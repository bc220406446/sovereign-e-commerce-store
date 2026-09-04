"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import StoreLayout from "@/components/store/StoreLayout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PackageSearch, Truck } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrackableOrder } from "@/components/store/OrderTimeline";

function TrackOrderContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialOrder = searchParams.get("order") ?? "";
  const initialEmail = searchParams.get("email") ?? "";

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [email, setEmail] = useState(initialEmail);
  const [order, setOrder] = useState<TrackableOrder | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchOrder = (num: string, mail: string) => {
    if (!num || !mail) return;
    setLoading(true);
    fetch(`/api/orders/track?orderNumber=${encodeURIComponent(num)}&email=${encodeURIComponent(mail)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialOrder && initialEmail) {
      fetchOrder(initialOrder, initialEmail);
    }
  }, [initialOrder, initialEmail]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      toast.error("Enter both your order number and the email used at checkout.");
      return;
    }
    router.replace(`/track?order=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
    fetchOrder(orderNumber.trim(), email.trim());
  };

  const ready = Boolean(initialOrder && initialEmail);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <span className="glass-chip mx-auto flex size-14 items-center justify-center rounded-2xl text-primary">
            <Truck className="size-6" strokeWidth={1.6} />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-slate-900">
            Track your order
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter the order number from your confirmation and the email you used
            at checkout - no account needed.
          </p>
        </div>

        <form onSubmit={search} className="glass mx-auto max-w-md rounded-3xl p-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="trk-order">Order number</Label>
              <Input
                id="trk-order"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. SV-1042"
                className="glass-chip rounded-xl border-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trk-email">Email used at checkout</Label>
              <Input
                id="trk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-chip rounded-xl border-0"
              />
            </div>
            <Button type="submit" className="w-full rounded-full">
              <PackageSearch className="size-4" /> Track order
            </Button>
          </div>
          {!user && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Signed in?{" "}
              <Link href="/account?tab=orders" className="font-medium text-primary hover:underline">
                Track from your account instead
              </Link>
            </p>
          )}
        </form>

        <div className="mt-10">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="size-5 animate-spin" /> Looking up your order...
            </div>
          )}
          {!loading && ready && order === null && (
            <div className="glass flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
              <PackageSearch className="size-8 text-slate-300" strokeWidth={1.5} />
              <p className="text-slate-500">
                We couldn't find an order with that number and email. Double-check
                the details and try again - or{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact us
                </Link>{" "}
                for help.
              </p>
            </div>
          )}
          {!loading && ready && order && <OrderTimeline order={order} />}
          {!loading && !ready && (
            <div className="glass flex flex-col items-center gap-3 rounded-3xl p-12 text-center text-slate-400">
              <Truck className="size-8" strokeWidth={1.5} />
              <p className="text-sm">
                Your order number is in the confirmation shown after checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}

export default function TrackOrder() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading tracking...</div></div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
