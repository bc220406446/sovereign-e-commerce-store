import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/db/helpers";

export async function GET() {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const [
      { data: orders },
      { data: products },
      { data: reviews },
    ] = await Promise.all([
      service.from("orders").select("*"),
      service.from("products").select("*"),
      service.from("reviews").select("*"),
    ]);

    const orderList = orders || [];
    const productList = products || [];
    const reviewList = reviews || [];

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTs = startOfToday.getTime();

    const paidOrPending = (o: any) => !["cancelled", "refunded"].includes(o.status);
    const revenueOf = (o: any) => (paidOrPending(o) ? Number(o.total) : 0);

    const totalSales = orderList.reduce((s, o) => s + revenueOf(o), 0);
    const todaySales = orderList
      .filter((o) => new Date(o.created_at).getTime() >= todayTs)
      .reduce((s, o) => s + revenueOf(o), 0);

    const statusCounts: Record<string, number> = {};
    for (const o of orderList) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }

    // 14-day revenue trend
    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 3600 * 1000;
      const dayOrders = orderList.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= start && t < end;
      });
      days.push({
        date: d.toISOString().slice(0, 10),
        revenue: dayOrders.reduce((s, o) => s + revenueOf(o), 0),
        orders: dayOrders.length,
      });
    }

    // Best sellers
    const unitsByProduct = new Map<string, number>();
    for (const o of orderList) {
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          unitsByProduct.set(
            item.product_id,
            (unitsByProduct.get(item.product_id) || 0) + (item.qty || 1)
          );
        }
      }
    }
    const productById = new Map(productList.map((p) => [p.id, p]));
    const bestSellers = [...unitsByProduct.entries()]
      .map(([productId, units]) => ({
        product: productById.get(productId),
        units,
      }))
      .filter((b) => b.product)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const lowStock = productList
      .filter(
        (p) =>
          p.status === "active" &&
          p.stock > 0 &&
          p.low_stock_threshold != null &&
          p.stock <= p.low_stock_threshold
      )
      .sort((a, b) => a.stock - b.stock);

    const outOfStock = productList.filter((p) => p.status === "active" && p.stock === 0);

    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const customerOrders = orderList.filter(paidOrPending);
    const customerKey = (o: any) => o.user_id || String(o.email || o.customer_name || "").trim().toLowerCase();
    const purchaserKeys = new Set(customerOrders.map(customerKey).filter(Boolean));
    const firstPurchaseByCustomer = new Map<string, number>();
    for (const order of customerOrders) {
      const key = customerKey(order);
      if (!key) continue;
      const timestamp = new Date(order.created_at).getTime();
      firstPurchaseByCustomer.set(key, Math.min(firstPurchaseByCustomer.get(key) ?? timestamp, timestamp));
    }
    const newCustomers = [...firstPurchaseByCustomer.values()].filter((timestamp) => timestamp >= weekAgo);

    const paidOrders = orderList.filter(paidOrPending);
    const avgOrderValue = paidOrders.length
      ? Math.round(totalSales / paidOrders.length)
      : 0;

    return NextResponse.json({
      totalSales,
      todaySales,
      orderCount: orderList.length,
      todayOrders: orderList.filter((o) => new Date(o.created_at).getTime() >= todayTs).length,
      statusCounts,
      pendingCount:
        (statusCounts.placed || 0) +
        (statusCounts.confirmed || 0) +
        (statusCounts.packaging || 0) +
        (statusCounts.packaged || 0),
      processingCount:
        (statusCounts.handed_to_courier || 0) +
        (statusCounts.out_for_delivery || 0),
      completedCount: (statusCounts.delivered || 0) + (statusCounts.completed || 0),
      cancelledCount: statusCounts.cancelled || 0,
      returnedCount: statusCounts.returned || 0,
      refundedCount: statusCounts.refunded || 0,
      avgOrderValue,
      trend: days,
      bestSellers,
      lowStock,
      outOfStock,
      customerCount: purchaserKeys.size,
      newCustomers: newCustomers.length,
      pendingReviews: reviewList.filter((r) => r.status === "pending").length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
