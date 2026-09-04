"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantityPicker } from "@/components/store/QuantityPicker";
import { ProductImage } from "@/components/store/ProductImage";
import StoreLayout from "@/components/store/StoreLayout";
import { useCart } from "@/hooks/use-cart";
import { ArrowRight, Loader2, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRs } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { hydrated, subtotal, setQty, removeItem, clear } = useCart();
  const [delivery, setDelivery] = useState<{ defaultCharge: number; freeThreshold: number } | null>(null);
  const router = useRouter();

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number; type: string } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => { if (data?.delivery) setDelivery(data.delivery); });
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setAppliedCoupon(data.discount);
        toast.success(`Coupon ${data.code} applied!`);
      } else {
        toast.error(data.reason || "Invalid coupon");
      }
    } catch {
      toast.error("Could not validate coupon.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const discount = appliedCoupon?.amount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryCharge =
    afterDiscount >= (delivery?.freeThreshold ?? 10000)
      ? 0
      : delivery?.defaultCharge ?? 200;
  const total = afterDiscount + deliveryCharge;

  if (hydrated.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
          <span className="glass-chip flex size-16 items-center justify-center rounded-2xl">
            <ShoppingBag className="size-7 text-primary" strokeWidth={1.5} />
          </span>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Your cart is empty
          </h1>
          <p className="text-slate-500">
            Explore the collection and find a timepiece worth treasuring.
          </p>
          <Button className="mt-2 rounded-full px-7" asChild>
            <Link href="/shop">
              Shop watches <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Shopping cart
          </h1>
          <button
            onClick={clear}
            className="text-sm text-slate-400 transition-colors hover:text-rose-500 cursor-pointer"
          >
            Clear cart
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* items */}
          <div className="glass space-y-4 rounded-3xl p-5 sm:p-6">
            {hydrated.map((line) => (
              <div
                key={line.productId}
                className="glass-soft flex gap-4 rounded-2xl p-3"
              >
                <Link href={`/product/${line.slug}`} className="shrink-0">
                  <ProductImage src={line.image} alt={line.name} className="size-24 rounded-xl" />
                </Link>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/product/${line.slug}`}
                        className="font-medium text-slate-800 hover:text-primary"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatRs(line.price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(line.productId)}
                      className="text-slate-400 transition-colors hover:text-rose-500 cursor-pointer"
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-end justify-between gap-2 pt-2">
                    <QuantityPicker
                      value={line.qty}
                      onChange={(q) => setQty(line.productId, q)}
                      max={line.stock}
                    />
                    <span className="text-base font-bold text-slate-900">
                      {formatRs(line.price * line.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* summary card */}
          <div className="glass space-y-6 rounded-3xl p-6 h-fit">
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Order Summary
            </h2>

            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Promo Code
              </label>
              {appliedCoupon ? (
                <div className="glass-soft flex items-center justify-between rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <Tag className="size-3.5" />
                    <span>{appliedCoupon.code} (-{formatRs(discount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon..."
                    className="rounded-full text-xs bg-white/70 uppercase"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-full"
                    disabled={checkingCoupon || !couponInput.trim()}
                  >
                    {checkingCoupon ? <Loader2 className="size-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </form>

            <div className="space-y-2 text-sm border-t border-slate-200/60 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">{formatRs(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatRs(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className="font-semibold text-emerald-600">Free</span>
                  ) : (
                    formatRs(deliveryCharge)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatRs(total)}</span>
              </div>
            </div>

            <Button
              className="w-full rounded-full"
              size="lg"
              onClick={() => router.push("/checkout")}
            >
              Proceed to Checkout <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
