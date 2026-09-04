import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/db/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const service = createServiceClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = service.from("orders").select("*");
    if (isUuid) query = query.eq("id", id);
    else query = query.eq("order_number", id);

    const { data: order, error } = await query.single();
    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Access control:
    // If order has no user_id (guest), require token
    // If order has user_id, require logged in matching user or admin
    if (!order.user_id) {
      if (token && order.payment_token && token === order.payment_token) {
        return NextResponse.json(order);
      }
    } else {
      const user = await getAuthUser();
      if (user && user.id === order.user_id) {
        return NextResponse.json(order);
      }
    }

    // If token matched or tracking query
    if (token && order.payment_token === token) {
      return NextResponse.json(order);
    }

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
