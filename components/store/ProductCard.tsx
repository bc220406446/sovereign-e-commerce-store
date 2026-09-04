"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  COLLECTION_LABELS,
  COLLECTION_TONES,
  discountPercent,
  effectivePrice,
  formatRs,
} from "@/lib/store";
import { useCart } from "@/hooks/use-cart";
import { ProductImage } from "./ProductImage";
import { StarRating } from "./StarRating";
import { useState, useEffect } from "react";
import { Product } from "@/types/database";

function WishlistButton({ productId, productSlug }: { productId: string; productSlug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((items) => {
          if (Array.isArray(items)) {
            setSaved(items.some((item: any) => item.product_id === productId));
          }
        })
        .catch(() => {});
    }
  }, [user, productId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/auth?returnTo=${encodeURIComponent(`/product/${productSlug}`)}`);
      return;
    }
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      setSaved(data.inWishlist);
      toast.success(data.inWishlist ? "Saved to your wishlist" : "Removed from your wishlist");
    } catch {
      toast.error("Could not update your wishlist.");
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`glass-strong flex size-9 items-center justify-center rounded-full transition-all hover:scale-105 ${
        saved ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
      }`}
    >
      <Heart className={`size-4 ${saved ? "fill-current" : ""}`} strokeWidth={1.8} />
    </button>
  );
}

export function ProductCard({
  product,
  rating,
  reviewCount,
}: {
  product: Product;
  rating?: number;
  reviewCount?: number;
}) {
  const { addItem, openCart } = useCart();

  const salePrice = effectivePrice(product.price, product.sale_price ?? undefined);
  const pct = discountPercent(product.price, product.sale_price ?? undefined);
  const out = product.stock <= 0;
  const badges = (product.collections || [])
    .filter((c) => c === "new-arrival" || c === "best-seller" || c === "premium")
    .slice(0, 2);

  const handleAdd = () => {
    addItem(product.id);
    openCart();
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="glass card-hover group relative flex flex-col overflow-hidden rounded-2xl">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        />
        {/* badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {pct ? (
            <Badge className="border-transparent bg-rose-500/90 text-white shadow-sm">
              -{pct}%
            </Badge>
          ) : null}
          {badges.map((c) => (
            <Badge
              key={c}
              variant="outline"
              className={`border backdrop-blur-md ${COLLECTION_TONES[c] || ""}`}
            >
              {COLLECTION_LABELS[c] || c}
            </Badge>
          ))}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} productSlug={product.slug} />
        </div>
        {out ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <span className="glass-strong rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Out of stock
            </span>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {rating ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <StarRating value={rating} size="size-3" />
              <span className="font-medium text-slate-600">{rating.toFixed(1)}</span>
              {reviewCount ? <span>({reviewCount})</span> : null}
            </span>
          </div>
        ) : null}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-1 font-medium text-slate-800 transition-colors hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            {product.sale_price && product.sale_price < product.price ? (
              <span className="text-xs text-slate-400 line-through">
                {formatRs(product.price)}
              </span>
            ) : null}
            <span className="text-base font-bold text-slate-900">
              {formatRs(salePrice)}
            </span>
          </div>
          <Button
            size="icon"
            className="size-9 rounded-full shadow-sm"
            onClick={handleAdd}
            disabled={out}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
