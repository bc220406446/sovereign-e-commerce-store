"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductCard } from "@/components/store/ProductCard";
import StoreLayout from "@/components/store/StoreLayout";
import {
  Grid2X2,
  LayoutGrid,
  PackageSearch,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  COLLECTION_LABELS,
  effectivePrice,
  formatRs,
} from "@/lib/store";
import { Product, Category } from "@/types/database";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-seller", label: "Best Sellers" },
];

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const collection = searchParams.get("collection") ?? "";
  const sort = searchParams.get("sort") ?? "featured";
  const inStockOnly = searchParams.get("inStock") === "1";
  const minPrice = searchParams.get("min") ? Number(searchParams.get("min")) : undefined;
  const maxPrice = searchParams.get("max") ? Number(searchParams.get("max")) : undefined;
  const discountedOnly = searchParams.get("discounted") === "1";

  const [priceMin, setPriceMin] = useState<string>(minPrice ? String(minPrice) : "");
  const [priceMax, setPriceMax] = useState<string>(maxPrice ? String(maxPrice) : "");
  const [view, setView] = useState<"three" | "four">("three");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {});

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`/shop?${next.toString()}`);
  };

  const filtered = useMemo(() => {
    let list = [...products];

    if (category) {
      const cat = categories.find((c) => c.slug === category);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (collection) {
      list = list.filter((p) => (p.collections || []).includes(collection as any));
    }
    if (q) {
      const query = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(query)),
      );
    }
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    if (discountedOnly) list = list.filter((p) => p.sale_price !== null && p.sale_price < p.price);
    if (priceMin !== "") list = list.filter((p) => effectivePrice(p.price, p.sale_price ?? undefined) >= Number(priceMin));
    if (priceMax !== "") list = list.filter((p) => effectivePrice(p.price, p.sale_price ?? undefined) <= Number(priceMax));

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => effectivePrice(a.price, a.sale_price ?? undefined) - effectivePrice(b.price, b.sale_price ?? undefined));
        break;
      case "price-desc":
        list.sort((a, b) => effectivePrice(b.price, b.sale_price ?? undefined) - effectivePrice(a.price, a.sale_price ?? undefined));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "best-seller":
        list.sort(
          (a, b) =>
            Number((b.collections || []).includes("best-seller")) -
            Number((a.collections || []).includes("best-seller")),
        );
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [products, categories, category, collection, q, inStockOnly, discountedOnly, priceMin, priceMax, sort]);

  const activeCategory = categories.find((c) => c.slug === category);
  const clearAll = () => {
    setPriceMin("");
    setPriceMax("");
    router.replace("/shop");
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* HEADER */}
        <div className="glass mb-8 rounded-[2rem] p-6 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                The collection
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                {activeCategory ? activeCategory.name : collection ? COLLECTION_LABELS[collection] || collection : "All Watches"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activeCategory?.description ??
                  "Precision movements, curated materials and considered design."}
              </p>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Showing <span className="text-slate-900">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "timepiece" : "timepieces"}
            </p>
          </div>

        </div>

        {/* FILTERS + PRODUCTS */}
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="glass h-fit space-y-5 rounded-2xl p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-4"><SlidersHorizontal className="size-4 text-primary" /><h2 className="font-semibold text-slate-800">Filter and sort</h2></div>
            <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Search</label><div className="relative"><Input value={q} onChange={(e) => updateParams({ q: e.target.value || null })} placeholder="Search watches..." className="rounded-xl bg-white/70 pl-8 text-xs" /><Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" /></div></div>
            <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Sort</label><select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none">{SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Categories</label><select value={category} onChange={(e) => updateParams({ category: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none"><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Collection</label><select value={collection} onChange={(e) => updateParams({ collection: e.target.value || null })} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none"><option value="">All collections</option>{Object.entries(COLLECTION_LABELS).filter(([key]) => key !== "premium").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Price range</label><div className="grid grid-cols-2 gap-2"><Input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} onBlur={() => updateParams({ min: priceMin || null })} placeholder="Min" type="number" className="rounded-xl bg-white/70 text-xs" /><Input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} onBlur={() => updateParams({ max: priceMax || null })} placeholder="Max" type="number" className="rounded-xl bg-white/70 text-xs" /></div></div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><Checkbox checked={discountedOnly} onCheckedChange={(checked) => updateParams({ discounted: checked ? "1" : null })} /> On sale / discounted</label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><Checkbox checked={inStockOnly} onCheckedChange={(checked) => updateParams({ inStock: checked ? "1" : null })} /> In stock only</label>
            <Button variant="outline" size="sm" className="w-full rounded-xl text-xs" onClick={clearAll}>Clear filters</Button>
          </aside>
          <div>
            <div className="mb-5 flex items-center justify-between"><p className="text-xs text-slate-500">Showing <span className="font-semibold text-slate-800">{filtered.length}</span> timepieces</p><div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/50 p-1"><button aria-label="Three columns" onClick={() => setView("three")} className={`rounded-lg p-2 ${view === "three" ? "bg-primary text-white" : "text-slate-500"}`}><Grid2X2 className="size-4" /></button><button aria-label="Four columns" onClick={() => setView("four")} className={`rounded-lg p-2 ${view === "four" ? "bg-primary text-white" : "text-slate-500"}`}><LayoutGrid className="size-4" /></button></div></div>
            {filtered.length === 0 ? (
              <div className="glass flex flex-col items-center justify-center rounded-3xl p-16 text-center">
                <PackageSearch className="size-12 text-slate-400" strokeWidth={1.2} />
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-800">
                  No timepieces match your criteria
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting or resetting your active filters.
                </p>
                <Button onClick={clearAll} className="mt-4 rounded-full" size="sm">
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className={`grid ${view === "four" ? "grid-cols-2" : "grid-cols-1"} gap-4 sm:gap-6 ${view === "four" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading shop...</div></div>}>
      <ShopContent />
    </Suspense>
  );
}
