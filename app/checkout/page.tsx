"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImage } from "@/components/store/ProductImage";
import StoreLayout from "@/components/store/StoreLayout";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  HandCoins,
  Loader2,
  Lock,
  ShieldCheck,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PROVINCES, citiesByProvince, formatRs } from "@/lib/store";
import { Address } from "@/types/database";

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery", desc: "Pay in cash when your watch arrives", icon: HandCoins },
  { value: "bank_transfer", label: "Bank Transfer", desc: "IBFT / direct transfer to our account", icon: Banknote },
  { value: "payfast", label: "PayFast (Sandbox)", desc: "Instant EFT, card & wallet payments", icon: Wallet },
];

function submitHostedForm(url: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function CheckoutContent() {
  const { hydrated, subtotal, clear } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [delivery, setDelivery] = useState<{ defaultCharge: number; expressCharge?: number; freeThreshold: number } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Status handlers for returns
  const returnStatus = searchParams.get("status");
  const returnOrderNumber = searchParams.get("order");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Punjab");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [shippingMethod, setShippingMethod] = useState<"normal" | "express">("normal");
  const [saveAddress, setSaveAddress] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number; type: string } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // Checkout submission
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => { if (data?.delivery) setDelivery(data.delivery); });

    if (user) {
      fetch("/api/addresses")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAddresses(data);
            const def = data.find((a: Address) => a.is_default) || data[0];
            if (def) {
              setSelectedAddressId(def.id);
              applyAddress(def);
            }
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (profile?.name && !name) setName(profile.name);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile, user]);

  const applyAddress = (addr: Address) => {
    setName(addr.name);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setProvince(addr.province);
    setPostalCode(addr.postal_code);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
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
  const deliveryCharge = shippingMethod === "express" ? (delivery?.expressCharge ?? 500) : afterDiscount >= (delivery?.freeThreshold ?? 10000) ? 0 : (delivery?.defaultCharge ?? 200);
  const total = afterDiscount + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !line1.trim() || !city.trim() || !province || !postalCode.trim()) {
      toast.error("Please fill in all required shipping address fields.");
      return;
    }
    if (!user && !email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create order in database
      const orderPayload = {
        items: hydrated.map((line) => ({
          productId: line.productId,
          qty: line.qty,
        })),
        shippingAddress: {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          province,
          postal_code: postalCode.trim(),
        },
        paymentMethod,
        shippingMethod,
        couponCode: appliedCoupon?.code,
        customerName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      // Save address if requested
      if (user && saveAddress && selectedAddressId === "new") {
        fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            line1: line1.trim(),
            line2: line2.trim() || undefined,
            city: city.trim(),
            province,
            postal_code: postalCode.trim(),
            is_default: addresses.length === 0,
          }),
        }).catch(() => {});
      }

      // Clear cart
      clear();

      // If PayFast selected, redirect to PayFast hosted form
      if (paymentMethod === "payfast") {
        const pfRes = await fetch("/api/payments/payfast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.orderId,
            origin: window.location.origin,
            token: data.paymentToken,
          }),
        });
        const pfData = await pfRes.json();
        if (!pfRes.ok) throw new Error(pfData.error || "PayFast initialization failed");
        submitHostedForm(pfData.url, pfData.fields);
        return;
      }

      // Success screen for COD & Bank transfer
      setCompletedOrder({
        orderNumber: data.orderNumber,
        total: data.total,
        paymentMethod,
        email: email.trim(),
      });
    } catch (err: any) {
      toast.error(err.message || "Could not complete order.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN (from return or direct COD)
  if (returnStatus === "payfast_success" || completedOrder) {
    const orderNum = completedOrder?.orderNumber || returnOrderNumber;
    return (
      <StoreLayout>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="glass space-y-6 rounded-3xl p-8 sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-10" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-slate-900">
              Order Confirmed!
            </h1>
            <p className="text-sm text-slate-600">
              Thank you for choosing Sovereign. Your order has been placed and a confirmation email has been sent.
            </p>
            <div className="glass-soft rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-slate-900">{orderNum}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-emerald-600">Order Placed</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button asChild className="rounded-full" size="lg">
                <Link href={`/track?orderNumber=${encodeURIComponent(orderNum || "")}&email=${encodeURIComponent(email || "")}`}>
                  Track Order
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (hydrated.length === 0 && !returnStatus) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            No items to check out
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your bag is empty. Please add watches before checking out.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/shop">Explore Shop</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary mb-2">
            <ArrowLeft className="size-3.5" /> Back to bag
          </Link>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* SAVED ADDRESSES SELECTOR */}
            {user && addresses.length > 0 && (
              <div className="glass space-y-3 rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Select Delivery Address
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        applyAddress(addr);
                      }}
                      className={`glass-soft rounded-2xl p-4 text-left transition-all cursor-pointer ${
                        selectedAddressId === addr.id
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:border-primary/40"
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-800">{addr.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{addr.line1}, {addr.city}</p>
                      <p className="text-xs text-slate-500">{addr.phone}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId("new");
                      setName(profile?.name || "");
                      setPhone(profile?.phone || "");
                      setLine1("");
                      setLine2("");
                      setCity("");
                      setPostalCode("");
                    }}
                    className={`glass-soft rounded-2xl p-4 text-center flex flex-col items-center justify-center text-xs text-slate-600 font-medium cursor-pointer ${
                      selectedAddressId === "new"
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:border-primary/40"
                    }`}
                  >
                    + Enter new address
                  </button>
                </div>
              </div>
            )}

            {/* SHIPPING ADDRESS */}
            <div className="glass space-y-4 rounded-3xl p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Shipping Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name" className="text-xs text-slate-600">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-slate-600">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tariq@example.com"
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-slate-600">Phone Number *</Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="line1" className="text-xs text-slate-600">Street Address *</Label>
                  <Input
                    id="line1"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="House / Flat / Street / Area"
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="line2" className="text-xs text-slate-600">Apartment / Landmark (Optional)</Label>
                  <Input
                    id="line2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    placeholder="Near City Hospital, 2nd Floor"
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs text-slate-600">City *</Label>
                  <Input
                    id="city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lahore, Karachi, etc."
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="province" className="text-xs text-slate-600">Province *</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger id="province" className="rounded-xl bg-white/70 text-sm">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong">
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal" className="text-xs text-slate-600">Postal Code *</Label>
                  <Input
                    id="postal"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="54000"
                    className="rounded-xl bg-white/70 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* SHIPPING METHOD */}
            <div className="glass space-y-4 rounded-3xl p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900">Shipping Method</h2>
              <div className="space-y-3">
                {[{ value: "normal", label: "Normal Delivery", charge: afterDiscount >= (delivery?.freeThreshold ?? 10000) ? 0 : delivery?.defaultCharge ?? 200 }, { value: "express", label: "Express Delivery", charge: delivery?.expressCharge ?? 500 }].map((method) => <label key={method.value} className={`glass-soft flex items-center justify-between rounded-2xl p-4 cursor-pointer ${shippingMethod === method.value ? "ring-2 ring-primary bg-primary/5" : ""}`}><div className="flex items-center gap-3"><input type="radio" name="shipping" value={method.value} checked={shippingMethod === method.value} onChange={() => setShippingMethod(method.value as "normal" | "express")} /><div><p className="font-semibold text-sm">{method.label}</p><p className="text-xs text-slate-500">{method.charge === 0 ? "Free" : formatRs(method.charge)}</p></div></div></label>)}
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="glass space-y-4 rounded-3xl p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const selected = paymentMethod === method.value;
                  return (
                    <label
                      key={method.value}
                      className={`glass-soft flex items-center justify-between rounded-2xl p-4 cursor-pointer transition-all ${
                        selected ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={selected}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="size-4 text-primary"
                        />
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{method.label}</p>
                          <p className="text-xs text-slate-500">{method.desc}</p>
                        </div>
                      </div>
                      <Icon className="size-5 text-primary shrink-0" />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIDEBAR ORDER SUMMARY */}
          <div className="glass space-y-6 rounded-3xl p-6 h-fit">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Order Review ({hydrated.length})
            </h2>

            {/* Line items mini preview */}
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {hydrated.map((line) => (
                <div key={line.productId} className="flex items-center gap-3 text-xs">
                  <ProductImage src={line.image} alt={line.name} className="size-12 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{line.name}</p>
                    <p className="text-slate-500">Qty: {line.qty}</p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatRs(line.price * line.qty)}</span>
                </div>
              ))}
            </div>

            {/* Coupon field */}
            <div className="border-t border-slate-200/60 pt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Promo Code
              </label>
              {appliedCoupon ? (
                <div className="glass-soft flex items-center justify-between rounded-xl px-3 py-2 text-xs">
                  <span className="text-emerald-600 font-semibold">{appliedCoupon.code} (-{formatRs(discount)})</span>
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="rounded-full text-xs bg-white/70 uppercase"
                  />
                  <Button type="button" onClick={handleApplyCoupon} size="sm" className="rounded-full" disabled={checkingCoupon || !couponCode.trim()}>
                    {checkingCoupon ? <Loader2 className="size-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-slate-200/60 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRs(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
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

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Processing...
                </>
              ) : (
                `Place Order • ${formatRs(total)}`
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Lock className="size-3.5" /> 256-bit encrypted checkout
            </div>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading checkout...</div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
