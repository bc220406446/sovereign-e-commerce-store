"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProductImage } from "@/components/store/ProductImage";
import { AdminHeader } from "../layout";
import { Loader2, Package, Pencil, Plus, Search, Trash2, Upload, FileUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateSku } from "@/lib/sku";
import { formatRs } from "@/lib/store";
import { Product, Category } from "@/types/database";

interface FormState {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  sale_price: string;
  sku: string;
  stock: string;
  low_stock_threshold: string;
  category_id: string;
  images: string;
  hero_image_url: string;
  hero_image_alt: string;
  gallery_media: { type: "image" | "video"; url: string; alt: string }[];
  specifications: { key: string; value: string }[];
  movement: string;
  case_material: string;
  strap_material: string;
  case_size: string;
  dial_color: string;
  water_resistance: string;
  gender: string;
  warranty: string;
  tags: string;
  collections: string[];
  status: "active" | "draft";
  featured: boolean;
  new_arrival: boolean;
  latest_edition: boolean;
  best_seller: boolean;
}

const emptyForm: FormState = {
  name: "", slug: "", description: "", short_description: "",
  price: "", sale_price: "", sku: "", stock: "0", low_stock_threshold: "3",
  category_id: "", images: "", hero_image_url: "", hero_image_alt: "", gallery_media: [], specifications: [], movement: "", case_material: "", strap_material: "",
  case_size: "", dial_color: "", water_resistance: "", gender: "Unisex", warranty: "24-month warranty",
  tags: "", collections: ["new-arrival"], status: "active", featured: false, new_arrival: true, latest_edition: false, best_seller: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id?: string; form: FormState } | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadMedia = async (file: File, target: "hero" | "gallery") => {
    if (target === "gallery" && editing?.form.gallery_media.length >= 5) {
      toast.error("Product gallery supports up to 5 media files.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/products/media", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    setEditing((current) => {
      if (!current) return current;
      const form = current.form;
      if (target === "hero") return { ...current, form: { ...form, hero_image_url: data.url } };
      return { ...current, form: { ...form, gallery_media: [...form.gallery_media, { type: data.type === "video" ? "video" : "image", url: data.url, alt: "" }] } };
    });
  };

  const fetchProducts = () => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); });
  };

  const fetchCategories = () => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); });
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const f = editing.form;
      const imagesArr = f.images.split("\n").map((s) => s.trim()).filter(Boolean);
      const tagsArr = f.tags.split(",").map((s) => s.trim()).filter(Boolean);
      const galleryMedia = f.gallery_media.filter((media) => media.url.trim()).slice(0, 5);
      const specificationFields = { movement: f.movement, case_material: f.case_material, strap_material: f.strap_material, case_size: f.case_size, dial_color: f.dial_color, water_resistance: f.water_resistance, gender: f.gender, warranty: f.warranty };
      const specifications = Object.fromEntries([
        ...Object.entries(specificationFields).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]),
        ...f.specifications.filter((spec) => spec.key.trim()).map((spec) => [spec.key.trim(), spec.value.trim()]),
      ]);

      const payload: any = {
        name: f.name.trim(),
        slug: f.slug.trim() || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: f.description.trim(),
        short_description: f.short_description.trim() || undefined,
        price: Number(f.price) || 0,
        sale_price: f.sale_price ? Number(f.sale_price) : null,
        sku: f.sku.trim() || generateSku(f.name, editing.id),
        stock: Number(f.stock) || 0,
        low_stock_threshold: f.low_stock_threshold ? Number(f.low_stock_threshold) : null,
        category_id: f.category_id || null,
        images: [f.hero_image_url.trim() || imagesArr[0] || "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80", ...imagesArr.filter((image) => image !== f.hero_image_url.trim() && image !== imagesArr[0])],
        hero_image_url: f.hero_image_url.trim() || null,
        hero_image_alt: f.hero_image_alt.trim() || null,
        gallery_media: galleryMedia,
        specifications,
        movement: f.movement.trim() || null,
        case_material: f.case_material.trim() || null,
        strap_material: f.strap_material.trim() || null,
        case_size: f.case_size.trim() || null,
        dial_color: f.dial_color.trim() || null,
        water_resistance: f.water_resistance.trim() || null,
        gender: f.gender.trim() || null,
        warranty: f.warranty.trim() || null,
        tags: tagsArr,
        collections: Array.from(new Set([...f.collections.filter((collection) => !["new-arrival", "latest-edition", "best-seller", "featured"].includes(collection)), ...(f.new_arrival ? ["new-arrival"] : []), ...(f.latest_edition ? ["latest-edition"] : []), ...(f.best_seller ? ["best-seller"] : []), ...(f.featured ? ["featured"] : [])])),
        status: f.status,
        featured: f.featured,
      };

      if (editing.id) {
        const res = await fetch(`/api/products/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Product updated.");
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Creation failed");
        toast.success("Product created.");
      }
      fetchProducts();
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      fetchProducts();
      toast.success("Product deleted.");
    } catch {
      toast.error("Could not delete product.");
    }
  };

  const handleCsvImport = async (file: File) => {
    const text = await file.text();
    const rows = text.trim().split(/\r?\n/).map((line) => {
      const cells: string[] = []; let value = ""; let quoted = false;
      for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; } else if (ch === '"') quoted = !quoted; else if (ch === "," && !quoted) { cells.push(value); value = ""; } else value += ch; } cells.push(value); return cells;
    });
    if (rows.length < 2) return toast.error("CSV has no product rows.");
    const headers = rows[0].map((h) => h.trim());
    setSaving(true);
    try {
      for (const row of rows.slice(1)) {
        const record = Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]));
        const payload = { ...record, price: Number(record.price) || 0, sale_price: record.sale_price ? Number(record.sale_price) : null, stock: Number(record.stock) || 0, low_stock_threshold: record.low_stock_threshold ? Number(record.low_stock_threshold) : null, images: record.images ? record.images.split("|").filter(Boolean) : [], tags: record.tags ? record.tags.split("|").filter(Boolean) : [], collections: record.collections ? record.collections.split("|").filter(Boolean) : [], status: record.status === "draft" ? "draft" : "active", featured: record.featured === "true", category_id: record.category_id || null, gallery_media: [], specifications: {} };
        const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Could not import ${record.name || "product"}`);
      }
      toast.success(`${rows.length - 1} products imported.`); fetchProducts();
    } catch (error: any) { toast.error(error.message || "CSV import failed."); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader
        title="Products"
        subtitle={`Manage catalog, stock & pricing (${products.length} products)`}
        action={
          <div className="flex gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/5"><FileUp className="size-4" /> Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvImport(e.target.files[0])} /></label><Button className="rounded-full" onClick={() => setEditing({ form: emptyForm })}><Plus className="size-4 mr-1.5" /> New Product</Button></div>
        }
      />

      <div className="glass rounded-3xl p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="rounded-full pl-9 bg-white/70 text-xs"
          />
          <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400">
                <th className="pb-3 font-semibold">Product</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">SKU</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Price</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Stock</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-3 flex items-center gap-3">
                    <ProductImage src={p.images?.[0]} alt={p.name} className="size-10 rounded-lg" />
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-slate-400">{p.category?.name || "No category"}</p>
                    </div>
                  </td>
                  <td className="hidden py-3 font-mono font-medium text-slate-700 sm:table-cell">{p.sku}</td>
                  <td className="hidden py-3 font-bold text-slate-900 sm:table-cell">{formatRs(p.sale_price ?? p.price)}</td>
                  <td className="hidden py-3 sm:table-cell">
                    <span className={p.stock <= 0 ? "font-bold text-rose-500" : "font-medium text-slate-700"}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className={p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-slate-500 hover:text-primary"
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            form: {
                              name: p.name,
                              slug: p.slug,
                              description: p.description,
                              short_description: p.short_description || "",
                              price: String(p.price),
                              sale_price: p.sale_price ? String(p.sale_price) : "",
                              sku: p.sku,
                              stock: String(p.stock),
                              low_stock_threshold: p.low_stock_threshold ? String(p.low_stock_threshold) : "",
                              category_id: p.category_id || "",
                              images: (p.images || []).join("\n"),
                              hero_image_url: p.hero_image_url || "",
                              hero_image_alt: p.hero_image_alt || "",
                              gallery_media: (p.gallery_media || []).map((m) => ({ type: m.type, url: m.url, alt: m.alt || "" })),
                              specifications: Object.entries(p.specifications || {}).map(([key, value]) => ({ key, value: String(value) })),
                              movement: p.movement || "",
                              case_material: p.case_material || "",
                              strap_material: p.strap_material || "",
                              case_size: p.case_size || "",
                              dial_color: p.dial_color || "",
                              water_resistance: p.water_resistance || "",
                              gender: p.gender || "Unisex",
                              warranty: p.warranty || "",
                              tags: (p.tags || []).join(", "),
                              collections: p.collections || [],
                              status: p.status,
                              featured: p.featured,
                              new_arrival: (p.collections || []).includes("new-arrival"),
                              latest_edition: (p.collections || []).includes("latest-edition"),
                              best_seller: (p.collections || []).includes("best-seller"),
                            },
                          })
                        }
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-slate-400 hover:text-rose-500"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / CREATE DIALOG */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => (!o ? setEditing(null) : undefined)}>
        <DialogContent className="glass-strong sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Timepiece" : "New Timepiece"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Product Name *</Label>
                  <Input required value={editing.form.name} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, name: e.target.value } })} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SKU (optional)</Label>
                  <Input value={editing.form.sku} placeholder="Generated automatically if blank" onChange={(e) => setEditing({ ...editing, form: { ...editing.form, sku: e.target.value } })} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price (Rs) *</Label>
                  <Input required type="number" value={editing.form.price} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, price: e.target.value } })} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sale Price (Rs)</Label>
                  <Input type="number" value={editing.form.sale_price} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, sale_price: e.target.value } })} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stock Quantity *</Label>
                  <Input required type="number" value={editing.form.stock} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, stock: e.target.value } })} className="rounded-xl bg-white/70 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select value={editing.form.category_id} onValueChange={(v) => setEditing({ ...editing, form: { ...editing.form, category_id: v } })}>
                    <SelectTrigger className="w-full rounded-xl bg-white/70 text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent className="glass-strong">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description *</Label>
                <Textarea required value={editing.form.description} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, description: e.target.value } })} className="rounded-xl bg-white/70 text-xs" rows={3} />
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/40 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Hero Image</h3>
                  <p className="text-[11px] text-slate-500">The primary product image used for cards, search, and SEO.</p>
                </div>
                <Input value={editing.form.hero_image_alt} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, hero_image_alt: e.target.value } })} placeholder="Hero image alt text (SEO and accessibility)" className="rounded-xl bg-white/70 text-xs" />
                <Input value={editing.form.hero_image_url} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, hero_image_url: e.target.value } })} placeholder="Hero image URL" className="rounded-xl bg-white/70 text-xs" />
                <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-white/70"><Upload className="size-3.5" /> Upload hero image<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "hero")} /></label>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/40 p-4 space-y-3">
                <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Product Gallery</h3><p className="text-[11px] text-slate-500">Add up to five images or videos with URLs and alt text.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{editing.form.gallery_media.length}/5</span></div>
                <div className="space-y-3">
                  {editing.form.gallery_media.map((media, index) => (
                    <div key={index} className="space-y-2 rounded-xl border border-slate-200/70 bg-white/50 p-3">
                      <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                        <Select value={media.type} onValueChange={(type: "image" | "video") => setEditing({ ...editing, form: { ...editing.form, gallery_media: editing.form.gallery_media.map((item, i) => i === index ? { ...item, type } : item) } })}>
                          <SelectTrigger className="rounded-xl bg-white/70 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
                        </Select>
                        <Input value={media.url} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, gallery_media: editing.form.gallery_media.map((item, i) => i === index ? { ...item, url: e.target.value } : item) } })} placeholder="Media URL" className="rounded-xl bg-white/70 text-xs" />
                        <Button type="button" size="icon" variant="ghost" className="text-slate-400 hover:text-rose-500" onClick={() => setEditing({ ...editing, form: { ...editing.form, gallery_media: editing.form.gallery_media.filter((_, i) => i !== index) } })}><Trash2 className="size-3.5" /></Button>
                      </div>
                      <Input value={media.alt} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, gallery_media: editing.form.gallery_media.map((item, i) => i === index ? { ...item, alt: e.target.value } : item) } })} placeholder="Alt text (SEO and accessibility)" className="rounded-xl bg-white/70 text-xs" />
                    </div>
                  ))}
                </div>
                {editing.form.gallery_media.length < 5 && <div className="flex gap-2"><Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setEditing({ ...editing, form: { ...editing.form, gallery_media: [...editing.form.gallery_media, { type: "image", url: "", alt: "" }] } })}>Add gallery media</Button><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-white/70"><Upload className="size-3.5" /> Upload media<input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "gallery")} /></label></div>}
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/40 p-4 space-y-3">
                <div><h3 className="text-sm font-semibold text-slate-800">Specifications</h3><p className="text-[11px] text-slate-500">Complete the product specification fields from the database schema.</p></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["movement", "case_material", "strap_material", "case_size", "dial_color", "water_resistance", "gender", "warranty"] as const).map((field) => <div key={field} className="space-y-1"><Label className="text-[11px] capitalize">{field.replaceAll("_", " ")}</Label><Input value={editing.form[field]} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, [field]: e.target.value } })} placeholder={`Enter ${field.replaceAll("_", " ")}`} className="rounded-xl bg-white/70 text-xs" /></div>)}
                </div>
                <div className="border-t border-slate-200/70 pt-3"><p className="mb-2 text-[11px] text-slate-500">Optional custom specifications</p>
                <div className="space-y-2">
                  {editing.form.specifications.map((spec, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input value={spec.key} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, specifications: editing.form.specifications.map((item, i) => i === index ? { ...item, key: e.target.value } : item) } })} placeholder="Specification name" className="rounded-xl bg-white/70 text-xs" /><Input value={spec.value} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, specifications: editing.form.specifications.map((item, i) => i === index ? { ...item, value: e.target.value } : item) } })} placeholder="Value" className="rounded-xl bg-white/70 text-xs" /><Button type="button" size="icon" variant="ghost" className="text-slate-400 hover:text-rose-500" onClick={() => setEditing({ ...editing, form: { ...editing.form, specifications: editing.form.specifications.filter((_, i) => i !== index) } })}><Trash2 className="size-3.5" /></Button></div>)}
                </div>
                <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setEditing({ ...editing, form: { ...editing.form, specifications: [...editing.form.specifications, { key: "", value: "" }] } })}>Add specification</Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Product status</p>
                <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <Switch checked={editing.form.status === "active"} onCheckedChange={(c) => setEditing({ ...editing, form: { ...editing.form, status: c ? "active" : "draft" } })} />
                  Active / Visible
                </label>
                </div>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Collection type</p>
                <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <Switch checked={editing.form.featured} onCheckedChange={(c) => setEditing({ ...editing, form: { ...editing.form, featured: c } })} />
                  Featured on Home
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <Switch checked={editing.form.new_arrival} onCheckedChange={(c) => setEditing({ ...editing, form: { ...editing.form, new_arrival: c } })} />
                  New Arrival
                </label>
                {(["latest_edition", "best_seller"] as const).map((collection) => (
                  <label key={collection} className="flex items-center gap-2 text-xs font-semibold capitalize text-slate-700 cursor-pointer">
                    <Switch checked={editing.form[collection]} onCheckedChange={(c) => setEditing({ ...editing, form: { ...editing.form, [collection]: c } })} />
                    {collection.replaceAll("_", " ")}
                  </label>
                ))}
                </div>
              </div>

              <Button type="submit" className="w-full rounded-full mt-2" disabled={saving}>
                {saving ? "Saving..." : "Save Product"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
