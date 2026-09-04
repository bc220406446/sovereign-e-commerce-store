"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/store/ProductImage";
import {
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRs } from "@/lib/store";
import { AdminHeader } from "./layout";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});

    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setRecent(data.slice(0, 6)); })
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div>
        <AdminHeader title="Dashboard" subtitle="Store performance at a glance" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Today's Sales", value: formatRs(stats.todaySales || 0), sub: `${stats.todayOrders || 0} orders today` },
    { label: "Total Sales", value: formatRs(stats.totalSales || 0), sub: `${stats.orderCount || 0} total orders` },
    { label: "Avg. Order Value", value: formatRs(stats.avgOrderValue || 0), sub: "per paid order" },
    { label: "Customers", value: String(stats.customerCount || 0), sub: `${stats.newCustomers || 0} new this week` },
    { label: "Pending", value: String(stats.pendingCount || 0), sub: "awaiting processing" },
    { label: "In Transit", value: String(stats.processingCount || 0), sub: "with courier" },
    { label: "Completed", value: String(stats.completedCount || 0), sub: "delivered & completed" },
    { label: "Refunded", value: String(stats.refundedCount || 0), sub: `${stats.cancelledCount || 0} cancelled` },
  ];

  const chartData = (stats.trend || []).map((d: any) => ({
    date: d.date.slice(5),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Store performance at a glance"
      />

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="glass border-0 shadow-none">
              <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* REVENUE TREND CHART */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">Revenue Trend</h2>
              <p className="text-xs text-slate-500">14-day sales performance</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600">Past 2 weeks</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#d97706" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP BEST SELLERS & INVENTORY ALERTS */}
        <div className="space-y-6">
          {/* Best sellers */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900">Top Best Sellers</h2>
            <div className="space-y-3">
              {(stats.bestSellers || []).slice(0, 4).map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <ProductImage src={b.product?.images?.[0]} alt={b.product?.name || ""} className="size-9 rounded-lg" />
                    <div>
                      <p className="font-semibold text-slate-800 truncate max-w-[140px]">{b.product?.name}</p>
                      <p className="text-slate-400">{b.units} sold</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">{formatRs((b.product?.price || 0) * b.units)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="glass mt-6 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Button variant="ghost" size="sm" asChild className="rounded-full text-xs text-primary">
            <Link href="/admin/orders">View all orders</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400">
                <th className="pb-3 font-semibold">Order</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-mono font-bold text-slate-800">{o.order_number}</td>
                  <td className="py-3 font-medium text-slate-800">{o.customer_name}</td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className={o.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {o.payment_status}
                    </Badge>
                  </td>
                  <td className="py-3 font-bold text-right text-slate-900">{formatRs(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
