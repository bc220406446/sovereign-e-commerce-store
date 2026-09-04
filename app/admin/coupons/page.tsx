"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AdminHeader } from "../layout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Coupon } from "@/types/database";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = () => {
    fetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCoupons(data); });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editing ? { id: editing.id } : {}),
          code: code.trim().toUpperCase(),
          type,
          value: Number(value) || 0,
          min_order: minOrder ? Number(minOrder) : null,
          max_discount: maxDiscount ? Number(maxDiscount) : null,
          usage_limit: usageLimit ? Number(usageLimit) : null,
          active,
        }),
      });
      if (!res.ok) throw new Error("Creation failed");
      toast.success(editing ? "Coupon updated." : "Coupon created.");
      fetchCoupons();
      setOpen(false);
      setEditing(null);
      setCode("");
      setValue("");
    } catch {
      toast.error("Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(String(coupon.value));
    setMinOrder(coupon.min_order == null ? "" : String(coupon.min_order));
    setMaxDiscount(coupon.max_discount == null ? "" : String(coupon.max_discount));
    setUsageLimit(coupon.usage_limit == null ? "" : String(coupon.usage_limit));
    setActive(coupon.active);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      fetchCoupons();
      toast.success("Coupon deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  };

  return (
    <div>
      <AdminHeader
        title="Coupons"
        subtitle="Manage discounts & promotional promo codes"
        action={
          <Button className="rounded-full" onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-1.5" /> New Coupon
          </Button>
        }
      />

      {[{ title: "Discount Coupons", items: coupons.filter((c) => c.coupon_type !== "refund_credit") }, { title: "Refund Coupons", items: coupons.filter((c) => c.coupon_type === "refund_credit") }].map((group) => group.items.length > 0 && <section key={group.title} className="space-y-3"><h2 className="font-display text-xl font-semibold">{group.title}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((c) => (
          <div key={c.id} className="glass rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-base text-primary bg-primary/10 px-3 py-1 rounded-xl">
                  {c.code}
                </span>
                <Badge variant="outline" className={c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>
                  {c.active ? "Active" : "Disabled"}
                </Badge>
              </div>
              <p className="font-semibold text-slate-800 text-sm mt-3">
                {c.type === "percent" ? `${c.value}% Off` : `Rs ${c.value} Off`}
              </p>
              <p className="text-xs text-slate-500 mt-1">Used {c.used_count} times {c.usage_limit ? `/ max ${c.usage_limit}` : ""}</p>
            </div>
            <div className="flex justify-end border-t border-slate-200/60 pt-3">
              {c.coupon_type !== "refund_credit" && <Button size="icon" variant="ghost" className="size-7 text-primary" onClick={() => openEdit(c)} aria-label="Edit coupon"><Pencil className="size-3.5" /></Button>}
              <Button size="icon" variant="ghost" className="size-7 text-rose-500" onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div></section>)}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Coupon Code *</Label>
              <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SUMMER10" className="rounded-xl bg-white/70 text-xs uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="rounded-xl bg-white/70 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong">
                    <SelectItem value="percent">Percent (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Value *</Label>
                <Input required type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="10 or 1000" className="rounded-xl bg-white/70 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min Order (Rs)</Label>
                <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Optional" className="rounded-xl bg-white/70 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Max Discount (Rs)</Label>
                <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="Optional" className="rounded-xl bg-white/70 text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label className="text-xs font-semibold">Active immediately</Label>
            </div>
            <Button type="submit" className="w-full rounded-full mt-2" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
