"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/store/ProductImage";
import { AdminHeader } from "../layout";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Category } from "@/types/database";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<{ id?: string; name: string; slug: string; description: string; image: string; sort_order: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadCategoryImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    body.append("target", "category");
    const res = await fetch("/api/admin/products/media", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    setEditing((current) => current ? { ...current, image: data.url } : current);
  };

  const fetchCats = () => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); });
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name.trim(),
        slug: editing.slug.trim() || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: editing.description.trim() || null,
        image: editing.image.trim() || null,
        sort_order: editing.sort_order ? Number(editing.sort_order) : 99,
      };

      if (editing.id) {
        await fetch(`/api/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Category updated.");
      } else {
        await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Category created.");
      }
      fetchCats();
      setEditing(null);
    } catch {
      toast.error("Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete category?")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      fetchCats();
      toast.success("Category deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  };

  return (
    <div>
      <AdminHeader
        title="Categories"
        subtitle="Manage product categories & navigation"
        action={
          <Button className="rounded-full" onClick={() => setEditing({ name: "", slug: "", description: "", image: "", sort_order: "1" })}>
            <Plus className="size-4 mr-1.5" /> New Category
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="glass rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3">
              <ProductImage src={c.image || undefined} alt={c.name} className="size-16 rounded-2xl shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-400">/{c.slug}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
              <span className="text-xs text-slate-400">Order: {c.sort_order ?? 99}</span>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing({ id: c.id, name: c.name, slug: c.slug, description: c.description || "", image: c.image || "", sort_order: String(c.sort_order || 99) })}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-7 text-rose-500" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => (!o ? setEditing(null) : undefined)}>
        <DialogContent className="glass-strong sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleSave} className="space-y-3 pt-2">
              <div>
                <Label className="text-xs">Category Name</Label>
                <Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="rounded-xl bg-white/70 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Slug</Label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="rounded-xl bg-white/70 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Category Image</Label>
                <Input placeholder="Image URL" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="rounded-xl bg-white/70 text-xs" />
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-white/70"><Upload className="size-3.5" /> Upload image<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCategoryImage(e.target.files[0]).catch((error) => toast.error(error.message))} /></label>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="rounded-xl bg-white/70 text-xs" rows={2} />
              </div>
              <Button type="submit" className="w-full rounded-full mt-2" disabled={saving}>
                {saving ? "Saving..." : "Save Category"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
