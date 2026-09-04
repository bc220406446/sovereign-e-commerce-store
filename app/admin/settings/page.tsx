"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminHeader } from "../layout";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [defaultCharge, setDefaultCharge] = useState("200");
  const [freeThreshold, setFreeThreshold] = useState("10000");
  const [freeEnabled, setFreeEnabled] = useState(true);
  const [standardTime, setStandardTime] = useState("2-5 working days");
  const [expressCharge, setExpressCharge] = useState("500");
  const [expressTime, setExpressTime] = useState("1-2 working days");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["cod", "bank_transfer", "payfast"]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"delivery" | "payments">("delivery");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.delivery) {
          setDefaultCharge(String(data.delivery.defaultCharge ?? 200));
          setFreeThreshold(String(data.delivery.freeThreshold ?? 10000));
          setFreeEnabled(data.delivery.freeEnabled ?? true);
          setStandardTime(data.delivery.standardTime ?? "2-5 working days");
          setExpressCharge(String(data.delivery.expressCharge ?? 500));
          setExpressTime(data.delivery.expressTime ?? "1-2 working days");
        }
        if (Array.isArray(data.paymentMethods)) {
          setPaymentMethods(data.paymentMethods);
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            delivery: {
              defaultCharge: Number(defaultCharge) || 0,
              freeThreshold: Number(freeThreshold) || 0,
              freeEnabled,
              standardTime,
              expressCharge: Number(expressCharge) || 0,
              expressTime,
          },
          paymentMethods,
        }),
      });
      if (!res.ok) throw new Error("Settings save failed");
      toast.success("Store settings updated.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (val: string) => {
    setPaymentMethods((prev) =>
      prev.includes(val) ? prev.filter((m) => m !== val) : [...prev, val]
    );
  };

  return (
    <div>
      <AdminHeader
        title="Delivery & Payment Settings"
        subtitle="Configure store shipping thresholds, delivery rates and payment channels"
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="glass h-fit rounded-3xl p-3">
          <button type="button" onClick={() => setActiveTab("delivery")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${activeTab === "delivery" ? "bg-primary text-white" : "text-slate-600 hover:bg-white/60"}`}>Shipping</button>
          <button type="button" onClick={() => setActiveTab("payments")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${activeTab === "payments" ? "bg-primary text-white" : "text-slate-600 hover:bg-white/60"}`}>Payment Methods</button>
        </aside>

        <form onSubmit={handleSave} className="glass max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6">
        {activeTab === "delivery" ? <div className="space-y-6">
          <div><h2 className="font-display text-lg font-semibold text-slate-900">Shipping Methods</h2><p className="mt-1 text-xs text-slate-500">Configure the delivery options customers can select at checkout.</p></div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/40 p-5 space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Free Shipping</h3><label className="flex items-center gap-2 text-xs"><Checkbox checked={freeEnabled} onCheckedChange={(checked) => setFreeEnabled(Boolean(checked))} /> Enabled</label></div>
            <div className="space-y-1.5"><Label className="text-xs">Minimum Order Amount (Rs)</Label><Input type="number" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} className="rounded-xl bg-white/70 text-xs" /></div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/40 p-5 space-y-4"><h3 className="font-semibold text-slate-800">Standard Shipping</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Standard Delivery Charge (Rs)</Label>
              <Input
                type="number"
                value={defaultCharge}
                onChange={(e) => setDefaultCharge(e.target.value)}
                className="rounded-xl bg-white/70 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Delivery Time</Label><Input value={standardTime} onChange={(e) => setStandardTime(e.target.value)} className="rounded-xl bg-white/70 text-xs" />
            </div>
          </div></div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/40 p-5 space-y-4"><h3 className="font-semibold text-slate-800">Express Shipping</h3><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-xs">Charge (Rs)</Label><Input type="number" value={expressCharge} onChange={(e) => setExpressCharge(e.target.value)} className="rounded-xl bg-white/70 text-xs" /></div><div className="space-y-1.5"><Label className="text-xs">Delivery Time</Label><Input value={expressTime} onChange={(e) => setExpressTime(e.target.value)} className="rounded-xl bg-white/70 text-xs" /></div></div></div>
        </div> : <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Active Payment Channels</h2>
          <div className="space-y-3">
            {[
              { val: "cod", label: "Cash on Delivery (COD)" },
              { val: "bank_transfer", label: "Direct Bank Transfer (IBFT)" },
              { val: "payfast", label: "PayFast Online Gateway (Cards & EFT)" },
            ].map((method) => (
              <label key={method.val} className="glass-soft flex items-center gap-3 rounded-2xl p-4 cursor-pointer text-xs font-semibold text-slate-800">
                <Checkbox
                  checked={paymentMethods.includes(method.val)}
                  onCheckedChange={() => toggleMethod(method.val)}
                />
                <span>{method.label}</span>
              </label>
            ))}
          </div>
        </div>}

        <Button type="submit" className="rounded-full px-8" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
    </div>
  );
}
