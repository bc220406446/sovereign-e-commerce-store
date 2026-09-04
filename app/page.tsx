"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";
import { StarRating } from "@/components/store/StarRating";
import StoreLayout from "@/components/store/StoreLayout";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Gem,
  Headphones,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Watch,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatRs } from "@/lib/store";
import { Product, Category } from "@/types/database";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [delivery, setDelivery] = useState<{ defaultCharge: number; freeThreshold: number } | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    // Fetch products
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          if (data.length === 0) {
            // Auto seed if empty
            fetch("/api/seed", { method: "POST" })
              .then(() => fetch("/api/products").then((r) => r.json()))
              .then((fresh) => { if (Array.isArray(fresh)) setProducts(fresh); });
          }
        }
      })
      .catch(() => {});

    // Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    // Fetch settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.delivery) setDelivery(data.delivery);
      })
      .catch(() => {});
  }, []);

  const heroSlides = categories.filter((category) => category.image).map((category) => ({ image: category.image!, name: category.name }));
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const heroProduct = products.find((p) => p.slug === "sovereign-royal-black") ?? products[0];
  const newArrivals = products.filter((p) => p.collections?.includes("new-arrival")).slice(0, 4);
  const bestSellers = products.filter((p) => p.collections?.includes("best-seller")).slice(0, 4);
  const premium = products.find((p) => p.slug === "sovereign-gold-masterpiece") ?? products[1];
  const men = categories.find((c) => c.slug === "men");
  const women = categories.find((c) => c.slug === "women");
  const smart = categories.find((c) => c.slug === "smart-watches");
  const couple = categories.find((c) => c.slug === "couple-watches");

  return (
    <StoreLayout>
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
        {/* HERO */}
        <section className="relative pt-10 sm:pt-14">
          <div className="glass overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1.5 border-transparent bg-primary/10 px-3 py-1 text-primary">
                    <Sparkles className="size-3.5" />
                    The Sovereign Collection
                  </Badge>
                </div>
                <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Restraint is the rarest{" "}
                  <span className="text-gradient">form of luxury</span>
                </h1>
                <p className="max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
                  Every Sovereign watch is built on a single belief - that true
                  luxury whispers rather than shouts. Automatic, quartz and smart
                  timepieces, finished with restraint and backed by a written
                  warranty.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg" className="rounded-full px-7" asChild>
                    <Link href="/shop">
                      Shop the collection
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="glass-chip rounded-full border-0 px-7 text-slate-700"
                    asChild
                  >
                    <Link href="/about">Explore our story</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {["photo-1494790108377-be9c29b29330", "photo-1500648767791-00dcc994a43e", "photo-1534528741775-53994a69daeb", "photo-1506794778202-cad84cf45f1d"].map((image) => (
                      <img key={image} src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=80&q=80`} alt="Sovereign customer" className="size-8 rounded-full border-2 border-white object-cover" />
                    ))}
                  </div>
                  <div>
                    <StarRating value={5} size="size-3.5" />
                    <p className="text-xs text-slate-500">
                      Trusted by 2,000+ collectors across Pakistan
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-amber-200/60 via-orange-100/50 to-yellow-200/60 blur-2xl" />
                <ProductImage key={heroIndex} src={heroSlides[heroIndex]?.image} fallbackSrc="/hero-fallback.png" alt={heroSlides[heroIndex]?.name || "Sovereign category"} className="hero-fade relative aspect-square rounded-[2rem] shadow-xl ring-1 ring-white/80" />
                {/* floating chips */}
                {heroProduct && (
                  <>
                    <div className="glass-strong absolute -left-3 top-8 rounded-2xl px-4 py-3 sm:-left-6">
                      <p className="text-xs text-slate-500">Starting at</p>
                      <p className="text-lg font-bold text-slate-900">Rs. 8,499</p>
                    </div>
                    <div className="glass-strong absolute -right-2 bottom-10 flex items-center gap-2 rounded-2xl px-4 py-3 sm:-right-5">
                      <ShieldCheck className="size-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          12-month warranty
                        </p>
                        <p className="text-xs text-slate-500">Every timepiece</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SHOP BY CATEGORY */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Curated for you
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
                Shop by Category
              </h2>
            </div>
            <Button variant="ghost" className="rounded-full text-primary" asChild>
              <Link href="/shop">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="group relative block overflow-hidden rounded-2xl"
              >
                <ProductImage
                  src={c.image || undefined}
                  alt={c.name}
                  className="aspect-[3/4] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                {c.product_count ? <p className="text-xs text-white/70">{c.product_count} styles</p> : null}
                <ArrowRight className="absolute bottom-3 right-3 size-4 translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 text-white" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* NEW ARRIVALS */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Newly added
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
                New Arrivals
              </h2>
            </div>
            <Button variant="ghost" className="rounded-full text-primary" asChild>
              <Link href="/shop?collection=new-arrival">
                See all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* BEST SELLERS */}
        <section className="order-5 mt-16 sm:mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Most coveted
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
                Best Sellers
              </h2>
            </div>
            <Button variant="ghost" className="rounded-full text-primary" asChild>
              <Link href="/shop?collection=best-seller">
                See all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* COLLECTION BANNERS: MEN / WOMEN */}
        <section className="order-4 mt-16 grid gap-5 sm:mt-20 lg:grid-cols-2">
          {men && (
            <Link
              href={`/shop?category=${men.slug}`}
              className="group relative block overflow-hidden rounded-[2rem]"
            >
              <ProductImage
                src={men.image || undefined}
                alt="Men's collection"
                className="aspect-[16/10] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-900/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center gap-2 p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-100">
                  Men's Collection
                </p>
                <h3 className="font-display text-3xl font-semibold text-white">
                  Bold. Precise. Yours.
                </h3>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors group-hover:bg-white/30">
                  Shop men <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          )}
          {women && (
            <Link
              href={`/shop?category=${women.slug}`}
              className="group relative block overflow-hidden rounded-[2rem]"
            >
              <ProductImage
                src={women.image || undefined}
                alt="Women's collection"
                className="aspect-[16/10] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/60 via-transparent to-slate-900/60" />
              <div className="absolute inset-0 flex flex-col justify-center gap-2 p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-100">
                  Women's Collection
                </p>
                <h3 className="font-display text-3xl font-semibold text-white">
                  Elegance in every second
                </h3>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors group-hover:bg-white/30">
                  Shop women <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          )}
        </section>

        {/* WHY CHOOSE US */}
        <section className="order-6 mt-16 sm:mt-20">
          <div className="glass rounded-[2rem] p-8 sm:p-12">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                The Sovereign standard
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                Why choose Sovereign?
              </h2>
              <p className="mt-3 text-slate-500">
                We built the watch house we wished existed - honest pricing,
                verified authenticity, and service that actually answers.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Truck, title: "Nationwide Delivery", desc: "2-5 working days, complimentary over Rs. 10,000" },
                { icon: BadgeCheck, title: "Certified Authentic", desc: "Genuine movements, sealed & verified" },
                { icon: Headphones, title: "Sovereign Support", desc: "Real people, seven days a week" },
                { icon: Gem, title: "14-Day Returns", desc: "Considered, no-questions returns" },
              ].map((f) => (
                <div key={f.title} className="glass-soft rounded-2xl p-5 text-center">
                  <span className="glass-chip mx-auto flex size-12 items-center justify-center rounded-2xl text-primary">
                    <f.icon className="size-6" strokeWidth={1.6} />
                  </span>
                  <h4 className="mt-4 font-semibold text-slate-800">{f.title}</h4>
                  <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="order-7 mt-16 sm:mt-20">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              In their own words
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
              What our customers say
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { name: "Ahmed Raza", image: "photo-1500648767791-00dcc994a43e", text: "The finishing is remarkable for the price. The automatic movement keeps excellent time and the packaging felt truly considered. Worth every rupee.", rating: 5, watch: "Sovereign Royal Black" },
              { name: "Fatima Noor", image: "photo-1494790108377-be9c29b29330", text: "I've received so many compliments! The mother-of-pearl dial shimmers beautifully and the mesh bracelet is comfortable all day.", rating: 5, watch: "Aurora Rose Gold" },
              { name: "Bilal Hussain", image: "photo-1506794778202-cad84cf45f1d", text: "Battery easily lasts two weeks, health tracking is accurate, and the screen is bright even outdoors. An intelligent everyday companion.", rating: 4, watch: "Pulse Pro Smart Watch" },
            ].map((r) => (
              <div key={r.name} className="glass flex flex-col gap-4 rounded-2xl p-6">
                <StarRating value={r.rating} />
                <p className="flex-1 text-sm leading-relaxed text-slate-600">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={`https://images.unsplash.com/${r.image}?auto=format&fit=crop&w=80&q=80`} alt={r.name} className="size-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400">Verified buyer · {r.watch}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NEWSLETTER */}
        <Newsletter />
      </div>
    </StoreLayout>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      .then((res) => { if (!res.ok) throw new Error(); setEmail(""); toast.success("Welcome to the Sovereign circle! Check your inbox."); })
      .catch(() => toast.error("We could not subscribe you. Please try again."));
  };
  return (
        <section className="order-8 mt-16 sm:mt-20">
      <div className="banner-gradient relative overflow-hidden rounded-[2rem] p-8 sm:p-12">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-10 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="glass-chip flex size-12 items-center justify-center rounded-2xl text-primary">
            <Star className="size-6" />
          </span>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Join the Sovereign circle
          </h2>
          <p className="max-w-md text-white/85">
            Early access to limited editions, members-only pricing and
            considered watch guides. No noise, ever.
          </p>
          <form onSubmit={submit} className="flex w-full max-w-md gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-full border-0 bg-white/90 shadow-inner text-slate-800"
            />
            <Button type="submit" className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-white/70">
            By subscribing you agree to our privacy policy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
