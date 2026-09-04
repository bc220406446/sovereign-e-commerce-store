"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";
import { QuantityPicker } from "@/components/store/QuantityPicker";
import { StarInput, StarRating } from "@/components/store/StarRating";
import StoreLayout from "@/components/store/StoreLayout";
import { useAuth } from "@/hooks/use-auth";
import {
  Check,
  ChevronRight,
  Clock4,
  Gem,
  Heart,
  Lock,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  COLLECTION_LABELS,
  COLLECTION_TONES,
  discountPercent,
  effectivePrice,
  formatDate,
  formatRs,
} from "@/lib/store";
import { useCart } from "@/hooks/use-cart";
import { Product, Review } from "@/types/database";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [delivery, setDelivery] = useState<{ defaultCharge: number; freeThreshold: number } | null>(null);

  const { addItem, openCart } = useCart();
  const { user, profile } = useAuth();

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        if (data?.related) setRelated(data.related);
        if (data?.id) {
          fetch(`/api/reviews?productId=${data.id}`)
            .then((r) => r.json())
            .then((revs) => { if (Array.isArray(revs)) setReviews(revs); });
        }
      })
      .catch(() => setProduct(null));

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => { if (data?.delivery) setDelivery(data.delivery); });
  }, [slug]);

  useEffect(() => {
    if (user && product) {
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((items) => {
          if (Array.isArray(items)) {
            setWishlisted(items.some((i: any) => i.product_id === product.id));
          }
        });
    }
  }, [user, product]);

  if (product === undefined) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="glass h-96 animate-pulse rounded-3xl" />
        </div>
      </StoreLayout>
    );
  }

  if (product === null) {
    return (
      <StoreLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Watch not found
          </h1>
          <p className="text-slate-500">
            This timepiece may have been retired from the collection.
          </p>
          <Button className="rounded-full" asChild>
            <Link href="/shop">Back to shop</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const effective = effectivePrice(product.price, product.sale_price ?? undefined);
  const pct = discountPercent(product.price, product.sale_price ?? undefined);
  const out = product.stock <= 0;
  const lowStock =
    !out &&
    product.low_stock_threshold != null &&
    product.stock <= product.low_stock_threshold;

  const handleAdd = () => {
    addItem(product.id, qty);
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    addItem(product.id, qty);
    router.push("/checkout");
  };

  const handleWishlist = async () => {
    if (!user) {
      router.push(`/auth?returnTo=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      setWishlisted(data.inWishlist);
      toast.success(data.inWishlist ? "Saved to your wishlist" : "Removed from your wishlist");
    } catch {
      toast.error("Could not update your wishlist.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth?returnTo=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    if (!reviewBody.trim()) {
      toast.error("Please write a review comment.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          body: reviewBody.trim(),
          authorName: user ? undefined : reviewName.trim(),
          authorEmail: user ? undefined : reviewEmail.trim(),
        }),
      });
      if (!res.ok) throw new Error("Review submission failed");
      toast.success("Thank you! Your review has been submitted for moderation.");
      setReviewBody("");
      setReviewName("");
      setReviewEmail("");
    } catch {
      toast.error("Could not submit your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const specs = [
    { label: "Movement", value: product.movement },
    { label: "Case material", value: product.case_material },
    { label: "Strap material", value: product.strap_material },
    { label: "Case size", value: product.case_size },
    { label: "Dial colour", value: product.dial_color },
    { label: "Water resistance", value: product.water_resistance },
    { label: "Gender", value: product.gender },
    { label: "Warranty", value: product.warranty },
  ].filter((s) => s.value);
  const galleryImages = [
    product.hero_image_url || product.images?.[0],
    ...(product.gallery_media || []).filter((media) => media.type === "image").map((media) => media.url),
    ...(product.images || []),
  ].filter((image, index, list): image is string => Boolean(image) && list.indexOf(image) === index).slice(0, 6);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* BREADCRUMB */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="size-3.5" />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="size-3.5" />
          <span className="truncate text-slate-700">{product.name}</span>
        </nav>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* GALLERY */}
          <div className="mx-0 w-full max-w-[455px] space-y-5">
            <div className="glass relative overflow-hidden rounded-3xl p-2">
              <ProductImage
                src={galleryImages[activeImage] || product.images?.[0]}
                alt={product.hero_image_alt || product.name}
                className="aspect-square w-full rounded-2xl"
              />
              {pct ? (
                <Badge className="absolute left-4 top-4 border-transparent bg-rose-500/90 text-white">
                  Save {pct}%
                </Badge>
              ) : null}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-3 px-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`overflow-hidden rounded-xl transition-all ${
                      activeImage === i
                        ? "glass-strong ring-2 ring-primary/60"
                        : "glass opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <ProductImage src={img} alt={`${product.name} gallery image ${i + 1}`} className="size-16" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="space-y-10 lg:pt-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {(product.collections || []).map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className={`border ${COLLECTION_TONES[c] || ""}`}
                  >
                    {COLLECTION_LABELS[c] || c}
                  </Badge>
                ))}
                <Badge variant="outline" className="glass-chip border-0 text-slate-500">
                  SKU: {product.sku}
                </Badge>
              </div>
              <h1 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                {reviews.length > 0 ? (
                  <>
                    <StarRating value={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length} />
                    <span className="text-sm text-slate-500">
                      {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}{" "}
                      · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">No reviews yet</span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {product.short_description ?? product.description}
              </p>
            </div>

            {/* PRICE */}
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-4xl font-bold tracking-tight text-slate-900">
                {formatRs(effective)}
              </span>
              {pct ? (
                <>
                  <span className="pb-1 text-lg text-slate-400 line-through">
                    {formatRs(product.price)}
                  </span>
                  <Badge className="mb-1.5 border-transparent bg-rose-100 text-rose-600">
                    -{pct}%
                  </Badge>
                </>
              ) : null}
            </div>

            {/* STOCK */}
            <div className="flex items-center gap-2 text-sm">
              {out ? (
                <span className="flex items-center gap-1.5 font-medium text-rose-600">
                  <span className="size-2 rounded-full bg-rose-500" /> Out of stock
                </span>
              ) : lowStock ? (
                <span className="flex items-center gap-1.5 font-medium text-amber-600">
                  <span className="size-2 rounded-full bg-amber-500" /> Low stock - only{" "}
                  {product.stock} left
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <Check className="size-4" /> In stock, ready to ship
                </span>
              )}
            </div>

            {/* ACTIONS */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <QuantityPicker value={qty} onChange={setQty} max={Math.max(product.stock, 1)} />
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleWishlist}
                  aria-label="Wishlist"
                >
                  <Heart className={`size-4 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                </Button>
              </div>
              <div className="flex w-full gap-3">
                <Button
                  size="lg"
                  className="flex-1 rounded-full sm:px-8"
                  disabled={out}
                  onClick={handleAdd}
                >
                  <ShoppingBag className="size-4" /> Add to cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 rounded-full sm:px-8"
                  disabled={out}
                  onClick={handleBuyNow}
                >
                  <Zap className="size-4" /> Buy now
                </Button>
              </div>
            </div>

            {/* TRUST HIGHLIGHTS */}
            <div className="glass grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-4">
              {[
                { icon: Truck, text: "Free normal delivery over Rs. 10,000" },
                { icon: ShieldCheck, text: "Written warranty" },
                { icon: RefreshCcw, text: "14-day returns" },
                { icon: Gem, text: "100% Authentic" },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <h.icon className="size-4 text-primary shrink-0" />
                  <span>{h.text}</span>
                </div>
              ))}
            </div>

          </div>

        {/* SPECIFICATIONS */}
        <div className="glass space-y-4 rounded-3xl p-6 lg:col-span-2">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Specifications
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                {specs.map((s, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-200/60 py-1.5">
                    <dt className="text-slate-500">{s.label}</dt>
                    <dd className="font-medium text-slate-800">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

        {/* REVIEWS SECTION */}
        <div className="glass space-y-6 rounded-3xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  Customer Reviews
                </h3>
                <span className="text-xs text-slate-500">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              {/* Review list */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="glass-soft rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-sm">
                          {r.author_name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(new Date(r.created_at).getTime())}
                        </span>
                      </div>
                      <StarRating value={r.rating} size="size-3.5" />
                      {r.title && <p className="font-medium text-slate-800 text-sm">{r.title}</p>}
                      <p className="text-xs leading-relaxed text-slate-600">{r.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Be the first to review this timepiece.
                </p>
              )}

              {/* Leave review form */}
              <form onSubmit={handleReviewSubmit} className="space-y-3 pt-4 border-t border-slate-200/60">
                <h4 className="font-medium text-slate-800 text-sm">Write a review</h4>
                {user ? <p className="text-xs text-slate-500">Reviewing as {profile?.name || user.email}</p> : <div className="grid gap-3 sm:grid-cols-2"><Input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your name" required className="rounded-xl text-xs bg-white/70" /><Input type="email" value={reviewEmail} onChange={(e) => setReviewEmail(e.target.value)} placeholder="Your email" required className="rounded-xl text-xs bg-white/70" /></div>}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rating:</span>
                  <StarInput value={reviewRating} onChange={setReviewRating} />
                </div>
                <Textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your thoughts about this watch..."
                  className="rounded-xl text-xs bg-white/70"
                  rows={3}
                />
                <Button type="submit" size="sm" className="rounded-full" disabled={submittingReview}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
        </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 font-display text-2xl font-semibold text-slate-900">
              You may also admire
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </StoreLayout>
  );
}
