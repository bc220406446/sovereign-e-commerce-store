import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/db/helpers";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const service = createServiceClient();
    const { data: wishlist, error } = await service
      .from("wishlist")
      .select("*, product:products(*)")
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(wishlist || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const { productId } = await req.json();
    const service = createServiceClient();

    const { data: existing } = await service
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (existing) {
      await service.from("wishlist").delete().eq("id", existing.id);
      return NextResponse.json({ inWishlist: false });
    } else {
      await service.from("wishlist").insert({ user_id: user.id, product_id: productId });
      return NextResponse.json({ inWishlist: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
