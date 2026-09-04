"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ProductCard } from "@/components/store/ProductCard";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import StoreLayout from "@/components/store/StoreLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/use-auth";
import {
  CreditCard,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Plus,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  PROVINCES,
  formatDateTime,
  formatRs,
} from "@/lib/store";
import { Order, Address, Product } from "@/types/database";

type Tab = "overview" | "orders" | "track" | "details" | "addresses" | "wishlist";

const TABS: { value: Tab; label: string; icon: typeof User }[] = [
  { value: "overview", label: "Dashboard", icon: User },
  { value: "orders", label: "Orders", icon: Package },
  { value: "track", label: "Track Order", icon: Truck },
  { value: "wishlist", label: "Wishlist", icon: Heart },
  { value: "details", label: "Account Details", icon: CreditCard },
  { value: "addresses", label: "Addresses", icon: MapPin },
];

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "overview";
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile fields
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Address dialog
  const [addressOpen, setAddressOpen] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrProvince, setAddrProvince] = useState("Punjab");
  const [addrPostal, setAddrPostal] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const setTab = (t: Tab) => router.replace(`/account?tab=${t}`);

  const fetchOrders = () => {
    fetch("/api/orders/mine")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setOrders(data); });
  };

  const fetchAddresses = () => {
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setAddresses(data); });
  };

  const fetchWishlist = () => {
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWishlist(data.map((item) => item.product).filter(Boolean));
        }
      });
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchAddresses();
      fetchWishlist();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      await refreshProfile();
      toast.success("Profile details updated.");
    } catch {
      toast.error("Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addrName,
          phone: addrPhone,
          line1: addrLine1,
          line2: addrLine2 || undefined,
          city: addrCity,
          province: addrProvince,
          postal_code: addrPostal,
          is_default: addresses.length === 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to add address");
      fetchAddresses();
      setAddressOpen(false);
      toast.success("Address added.");
    } catch {
      toast.error("Could not add address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      fetchAddresses();
      toast.success("Address removed.");
    } catch {
      toast.error("Could not delete address.");
    }
  };

  return (
    <StoreLayout>
      <RequireAuth>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                My account
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900">
                Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
              </h1>
            </div>
            <Button
              variant="outline"
              className="glass-chip rounded-full border-0 text-slate-600"
              onClick={signOut}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            {/* TABS NAVIGATION */}
            <nav className="glass h-fit rounded-2xl p-3 space-y-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      active ? "bg-primary text-white" : "text-slate-600 hover:bg-white/40"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* TAB CONTENTS */}
            <div className="min-w-0">
              {/* OVERVIEW */}
              {tab === "overview" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="glass rounded-2xl p-5">
                      <p className="text-xs text-slate-500">Total Orders</p>
                      <p className="mt-1 font-display text-2xl font-bold text-slate-900">{orders.length}</p>
                    </div>
                    <div className="glass rounded-2xl p-5">
                      <p className="text-xs text-slate-500">Wishlist Items</p>
                      <p className="mt-1 font-display text-2xl font-bold text-slate-900">{wishlist.length}</p>
                    </div>
                    <div className="glass rounded-2xl p-5">
                      <p className="text-xs text-slate-500">Saved Addresses</p>
                      <p className="mt-1 font-display text-2xl font-bold text-slate-900">{addresses.length}</p>
                    </div>
                  </div>

                  {orders.length > 0 && (
                    <div className="glass rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-slate-900">Recent Orders</h3>
                        <button onClick={() => setTab("orders")} className="text-xs text-primary font-medium hover:underline">
                          View all
                        </button>
                      </div>
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((o) => (
                          <div key={o.id} className="glass-soft flex items-center justify-between rounded-xl p-4">
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{o.order_number}</p>
                              <p className="text-xs text-slate-400">{formatDateTime(new Date(o.created_at).getTime())}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={ORDER_STATUS_TONES[o.status] || ""}>
                                {ORDER_STATUS_LABELS[o.status] || o.status}
                              </Badge>
                              <span className="font-bold text-sm text-slate-900">{formatRs(o.total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS */}
              {tab === "orders" && (
                <div className="glass rounded-3xl p-6 space-y-4">
                  <h2 className="font-display text-xl font-semibold text-slate-900">Order History</h2>
                  {orders.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center">You have not placed any orders yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((o) => (
                        <div key={o.id} className="glass-soft rounded-2xl p-5 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                            <div>
                              <p className="font-bold text-sm text-slate-900">Order {o.order_number}</p>
                              <p className="text-xs text-slate-400">{formatDateTime(new Date(o.created_at).getTime())}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={ORDER_STATUS_TONES[o.status] || ""}>
                                {ORDER_STATUS_LABELS[o.status] || o.status}
                              </Badge>
                              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => setSelectedOrder(o)}>
                                View Timeline
                              </Button>
                              {!['placed', 'cancelled'].includes(o.status) && <Button size="sm" variant="outline" asChild className="rounded-full text-xs"><a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noreferrer">View Invoice</a></Button>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(o.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                                <span>{item.name} × {item.qty}</span>
                                <span className="font-medium">{formatRs(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 font-bold text-sm text-slate-900">
                            <span>Total:</span>
                            <span>{formatRs(o.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TRACK */}
              {tab === "track" && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="glass rounded-3xl p-12 text-center text-slate-500 text-sm">
                      No orders to track yet.
                    </div>
                  ) : (
                    orders.map((o) => (
                      <OrderTimeline key={o.id} order={o as any} />
                    ))
                  )}
                </div>
              )}

              {/* WISHLIST */}
              {tab === "wishlist" && (
                <div className="glass rounded-3xl p-6 space-y-6">
                  <h2 className="font-display text-xl font-semibold text-slate-900">My Wishlist</h2>
                  {wishlist.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center">Your wishlist is empty.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {wishlist.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DETAILS */}
              {tab === "details" && (
                <div className="glass rounded-3xl p-6 space-y-6 max-w-xl">
                  <h2 className="font-display text-xl font-semibold text-slate-900">Account Details</h2>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-name">Full Name</Label>
                      <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-white/70" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-email">Email</Label>
                      <Input id="prof-email" disabled value={user?.email || ""} className="rounded-xl bg-slate-100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-phone">Phone</Label>
                      <Input id="prof-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" className="rounded-xl bg-white/70" />
                    </div>
                    <Button type="submit" className="rounded-full" disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save changes"}
                    </Button>
                  </form>
                </div>
              )}

              {/* ADDRESSES */}
              {tab === "addresses" && (
                <div className="glass rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold text-slate-900">Saved Addresses</h2>
                    <Button size="sm" className="rounded-full" onClick={() => setAddressOpen(true)}>
                      <Plus className="size-4 mr-1" /> Add Address
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="glass-soft rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{addr.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{addr.line1}, {addr.city}</p>
                          <p className="text-xs text-slate-500">{addr.phone}</p>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ORDER TIMELINE DIALOG */}
        <Dialog open={Boolean(selectedOrder)} onOpenChange={(o) => (!o ? setSelectedOrder(null) : undefined)}>
          <DialogContent className="glass-strong sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Timeline</DialogTitle>
              <DialogDescription>Track fulfillment and courier status</DialogDescription>
            </DialogHeader>
            {selectedOrder && <OrderTimeline order={selectedOrder as any} />}
          </DialogContent>
        </Dialog>

        {/* ADD ADDRESS DIALOG */}
        <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
          <DialogContent className="glass-strong sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Shipping Address</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAddress} className="space-y-3 pt-2">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input required value={addrName} onChange={(e) => setAddrName(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input required value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Street Address *</Label>
                <Input required value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Apartment / Landmark (Optional)</Label>
                <Input
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  placeholder="Near City Hospital, 2nd Floor"
                  className="rounded-xl bg-white/70 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input required value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Province *</Label>
                  <Select value={addrProvince} onValueChange={setAddrProvince}>
                    <SelectTrigger className="h-9 w-full rounded-xl bg-white/70 text-xs">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong">
                      {PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Postal Code *</Label>
                <Input required value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
              </div>
              <Button type="submit" className="w-full rounded-full mt-2" disabled={savingAddress}>
                {savingAddress ? "Saving..." : "Save Address"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </RequireAuth>
    </StoreLayout>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading account...</div></div>}>
      <AccountContent />
    </Suspense>
  );
}
