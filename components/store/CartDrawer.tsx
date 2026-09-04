"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRs } from "@/lib/store";
import { useCart } from "@/hooks/use-cart";
import { ProductImage } from "./ProductImage";
import { QuantityPicker } from "./QuantityPicker";
import { useEffect, useState } from "react";

export function CartDrawer() {
  const { hydrated, subtotal, isOpen, closeCart, setQty, removeItem, count } = useCart();
  const router = useRouter();
  const [delivery, setDelivery] = useState<{ defaultCharge: number; freeThreshold: number } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.delivery) setDelivery(data.delivery);
      })
      .catch(() => {});
  }, []);

  const deliveryCharge =
    subtotal === 0 || (delivery && subtotal >= delivery.freeThreshold)
      ? 0
      : delivery?.defaultCharge ?? 200;

  const goCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? undefined : closeCart())}>
      <SheetContent className="glass-strong w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-white/60 px-5 pb-4 pt-5">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="size-5 text-primary" />
            Your Cart
            {count > 0 && (
              <span className="glass-chip rounded-full px-2 py-0.5 text-xs font-semibold text-primary">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your cart before checkout.
          </SheetDescription>
        </SheetHeader>

        {hydrated.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="glass-chip flex size-16 items-center justify-center rounded-2xl">
              <ShoppingBag className="size-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-700">Your cart is empty</p>
            <p className="max-w-[220px] text-sm text-slate-500">
              Discover timepieces crafted to be treasured.
            </p>
            <Button asChild className="mt-2 rounded-full">
              <Link href="/shop" onClick={closeCart}>
                Shop the collection
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {hydrated.map((line) => (
                <div
                  key={line.productId}
                  className="glass-soft flex gap-3 rounded-xl p-2.5"
                >
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={closeCart}
                    className="shrink-0"
                  >
                    <ProductImage
                      src={line.image}
                      alt={line.name}
                      className="size-20 rounded-lg"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${line.slug}`}
                        onClick={closeCart}
                        className="line-clamp-1 text-sm font-medium text-slate-800 hover:text-primary"
                      >
                        {line.name}
                      </Link>
                      <button
                        onClick={() => removeItem(line.productId)}
                        className="text-slate-400 transition-colors hover:text-rose-500"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-end justify-between gap-2 pt-1">
                      <QuantityPicker
                        value={line.qty}
                        onChange={(q) => setQty(line.productId, q)}
                        max={line.stock}
                        size="sm"
                      />
                      <span className="text-sm font-bold text-slate-900">
                        {formatRs(line.price * line.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-white/60 bg-white/40 p-5 backdrop-blur-md">
              <div className="w-full space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      {formatRs(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Delivery</span>
                    <span>
                      {deliveryCharge === 0 ? (
                        <span className="font-semibold text-emerald-600">Free</span>
                      ) : (
                        formatRs(deliveryCharge)
                      )}
                    </span>
                  </div>
                  {delivery && subtotal < delivery.freeThreshold && (
                    <p className="text-[11px] text-primary">
                      Add {formatRs(delivery.freeThreshold - subtotal)} more for free delivery
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatRs(subtotal + deliveryCharge)}</span>
                </div>

                <Button
                  className="w-full rounded-full"
                  size="lg"
                  onClick={goCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
