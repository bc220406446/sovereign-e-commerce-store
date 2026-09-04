import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/db/helpers";

export async function GET() {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const [{ data: profiles }, { data: orders }] = await Promise.all([
      service.from("profiles").select("*"),
      service.from("orders").select("*"),
    ]);

    const orderList = orders || [];
    const paidOrPending = (o: any) => !["cancelled", "refunded"].includes(o.status);

    const customers = (profiles || []).filter((u) => u.role !== "admin").map((u) => {
      const userOrders = orderList.filter((o) => o.user_id === u.id);
      const totalSpent = userOrders
        .filter(paidOrPending)
        .reduce((s, o) => s + Number(o.total), 0);
      const lastOrderAt = userOrders.length
        ? Math.max(...userOrders.map((o) => new Date(o.created_at).getTime()))
        : undefined;

      return {
        ...u,
        orderCount: userOrders.length,
        totalSpent,
        lastOrderAt,
      };
    });

    return NextResponse.json(customers.sort((a, b) => b.totalSpent - a.totalSpent));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
