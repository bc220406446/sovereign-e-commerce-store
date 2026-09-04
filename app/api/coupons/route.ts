import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) {
      return NextResponse.json({ ok: false, reason: "Enter a coupon code." });
    }

    const normalized = code.trim().toUpperCase();
    const service = createServiceClient();
    const { data: coupon, error } = await service
      .from("coupons")
      .select("*")
      .eq("code", normalized)
      .single();

    if (error || !coupon) {
      return NextResponse.json({
        ok: false,
        code: normalized,
        reason: "This coupon code isn't recognised.",
      });
    }

    if (!coupon.active) {
      return NextResponse.json({
        ok: false,
        code: coupon.code,
        reason: "This coupon code is no longer active.",
      });
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({
        ok: false,
        code: coupon.code,
        reason: "This coupon isn't active yet.",
      });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({
        ok: false,
        code: coupon.code,
        reason: "This coupon has expired.",
      });
    }

    if (coupon.min_order && Number(subtotal) < Number(coupon.min_order)) {
      return NextResponse.json({
        ok: false,
        code: coupon.code,
        reason: "Minimum order not met.",
        minOrder: Number(coupon.min_order),
      });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({
        ok: false,
        code: coupon.code,
        reason: "This coupon has reached its usage limit.",
      });
    }

    let amount =
      coupon.type === "percent"
        ? Math.round((Number(subtotal) * Number(coupon.value)) / 100)
        : Number(coupon.value);

    if (coupon.max_discount) {
      amount = Math.min(amount, Number(coupon.max_discount));
    }

    return NextResponse.json({
      ok: true,
      code: coupon.code,
      discount: {
        code: coupon.code,
        amount,
        type: coupon.type,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
