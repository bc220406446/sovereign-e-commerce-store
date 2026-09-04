import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const categorySlug = searchParams.get("category");
    const collection = searchParams.get("collection");
    const status = searchParams.get("status") || "active";
    const featured = searchParams.get("featured");

    const service = createServiceClient();
    let query = service.from("products").select("*, category:categories(*)");

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (slug) {
      query = query.eq("slug", slug);
      const { data, error } = await query.single();
      if (error) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json(data);
    }
    if (categorySlug) {
      const { data: cat } = await service.from("categories").select("id").eq("slug", categorySlug).single();
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (collection) {
      query = query.contains("collections", [collection]);
    }
    if (featured === "true") {
      query = query.eq("featured", true);
    }

    query = query.order("created_at", { ascending: false });
    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(products || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
