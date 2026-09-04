import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser, getSetting, nextOrderNumber } from "@/lib/db/helpers";
import { sendOrderConfirmation } from "@/lib/email";
import crypto from "crypto";

function newPaymentToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      customerName,
      email,
      phone,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const authUser = await getAuthUser();
    const userId = authUser?.id || null;

    if (!userId && !email?.trim()) {
      return NextResponse.json(
        { error: "An email address is required at checkout for order confirmation." },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // 1. Fetch live product data & check stock
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const { data: product, error } = await service
        .from("products")
        .select("*")
        .eq("id", item.productId)
        .single();

      if (error || !product) {
        return NextResponse.json(
          { error: "A product in your cart no longer exists." },
          { status: 400 }
        );
      }

      if (product.status !== "active") {
        return NextResponse.json(
          { error: `${product.name} is no longer available.` },
          { status: 400 }
        );
      }

      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `Only ${product.stock} left in stock for "${product.name}". Please reduce the quantity.` },
          { status: 400 }
        );
      }

      const unitPrice =
        product.sale_price && product.sale_price < product.price
          ? Number(product.sale_price)
          : Number(product.price);

      subtotal += unitPrice * item.qty;
      orderItems.push({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] || null,
        price: unitPrice,
        qty: item.qty,
      });
    }

    // 2. Validate Coupon
    let discount = 0;
    let validCouponCode: string | null = null;
    let appliedCouponType = "promotional";
    let appliedCouponValue = 0;
    let appliedCouponRefundable = false;
    if (couponCode) {
      const { data: coupon } = await service
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const notExpired = (!coupon.expires_at || new Date(coupon.expires_at) > now) &&
                           (!coupon.starts_at || new Date(coupon.starts_at) <= now);
        const meetsMin = !coupon.min_order || subtotal >= Number(coupon.min_order);
        const underLimit = !coupon.usage_limit || coupon.used_count < coupon.usage_limit;

        if (notExpired && meetsMin && underLimit) {
          validCouponCode = coupon.code;
          appliedCouponType = coupon.coupon_type || (coupon.code.startsWith("REF-") ? "refund_credit" : "promotional");
          appliedCouponValue = Number(coupon.value);
          appliedCouponRefundable = appliedCouponType === "refund_credit";
          if (coupon.type === "percent") {
            discount = Math.round((subtotal * Number(coupon.value)) / 100);
          } else {
            discount = Number(coupon.value);
          }
          if (coupon.max_discount) {
            discount = Math.min(discount, Number(coupon.max_discount));
          }

          // Increment used_count
          await service
            .from("coupons")
            .update({ used_count: coupon.used_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // 3. Delivery charge
    const deliveryCfg = await getSetting("delivery", { defaultCharge: 200, expressCharge: 500, freeThreshold: 10000 });
    const shippingMethod = body.shippingMethod === "express" ? "express" : "normal";
    const afterDiscount = subtotal - discount;
    const deliveryCharge = shippingMethod === "express" ? Number(deliveryCfg.expressCharge ?? 500) : afterDiscount >= Number(deliveryCfg.freeThreshold ?? 10000) ? 0 : Number(deliveryCfg.defaultCharge ?? 200);
    const total = afterDiscount + deliveryCharge;

    // 4. Generate order number
    const orderNumber = await nextOrderNumber();
    const paymentToken = userId ? null : newPaymentToken();

    // 5. Decrement stock
    for (const item of items) {
      const { data: p } = await service
        .from("products")
        .select("stock")
        .eq("id", item.productId)
        .single();
      if (p) {
        await service
          .from("products")
          .update({ stock: Math.max(0, p.stock - item.qty) })
          .eq("id", item.productId);
      }
    }

    const finalCustomerName = customerName?.trim() || "Customer";
    const finalEmail = email?.trim() || authUser?.email || "";
    const finalPhone = phone?.trim() || "";

    // 6. Insert Order
    const { data: order, error: orderError } = await service
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        customer_name: finalCustomerName,
        email: finalEmail,
        phone: finalPhone,
        shipping_address: shippingAddress,
        items: orderItems,
        subtotal,
        discount,
        delivery_charge: deliveryCharge,
        total,
        coupon_code: validCouponCode,
        coupon_type: validCouponCode ? appliedCouponType : null,
        coupon_value: validCouponCode ? appliedCouponValue : 0,
        coupon_refundable: appliedCouponRefundable,
        product_paid: Math.max(0, afterDiscount),
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        payment_status: "pending",
        status: "placed",
        history: [{ status: "placed", note: "Order placed", at: Date.now() }],
        payment_token: paymentToken,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 7. Fire & forget confirmation email
    if (finalEmail) {
      sendOrderConfirmation({
        to: finalEmail,
        customerName: finalCustomerName,
        orderNumber,
        total,
        items: orderItems.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: i.price,
        })),
      }).catch((err) => console.error("Email send failed:", err));
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      total: order.total,
      paymentToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
