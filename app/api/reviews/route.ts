import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status") || "approved";

    const service = createServiceClient();
    let query = service.from("reviews").select("*, product:products(name, slug)");

    if (productId) query = query.eq("product_id", productId);
    if (status !== "all") query = query.eq("status", status);

    const { data: reviews, error } = await query.order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(reviews || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await getAuthUser();
    const { productId, rating, title, body: reviewBody, authorName, authorEmail } = body;

    const service = createServiceClient();
    let profile = null;
    if (user) {
      const { data } = await service.from("profiles").select("name,email").eq("id", user.id).maybeSingle();
      profile = data;
    } else if (!authorName?.trim() || !authorEmail?.trim()) {
      return NextResponse.json({ error: "Name and email are required for guest reviews." }, { status: 400 });
    }
    const { data: review, error } = await service
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user?.id || null,
        author_name: user ? profile?.name || user.email?.split("@")[0] || "Customer" : authorName.trim(),
        author_email: user ? profile?.email || user.email : authorEmail.trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        title,
        body: reviewBody,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(review);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
