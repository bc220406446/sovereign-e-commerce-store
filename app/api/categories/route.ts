import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const service = createServiceClient();
    const { data: categories, error } = await service
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch product counts for each category
    const withCounts = await Promise.all(
      (categories || []).map(async (c) => {
        const { count } = await service
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", c.id)
          .eq("status", "active");
        return { ...c, productCount: count ?? 0 };
      })
    );

    return NextResponse.json(withCounts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
