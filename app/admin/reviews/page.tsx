"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/store/StarRating";
import { AdminHeader } from "../layout";
import { Check, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/store";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchReviews = () => {
    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setReviews(data); });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      fetchReviews();
      toast.success(`Review ${status === "approved" ? "approved" : "disapproved"}.`);
    } catch {
      toast.error("Failed to update review.");
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchReviews();
      toast.success("Review deleted.");
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  return (
    <div>
      <AdminHeader
        title="Reviews"
        subtitle={`Moderate and approve customer watch reviews (${reviews.length} reviews)`}
      />

      <div className="glass rounded-3xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400">
                <th className="hidden pb-3 font-semibold sm:table-cell">Name</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Email</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Date</th>
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">Rating & Comment</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="hidden py-3 sm:table-cell">
                    <p className="font-semibold text-slate-800">{r.author_name}</p>
                  </td>
                  <td className="hidden py-3 text-slate-500 sm:table-cell">{r.author_email || "-"}</td>
                  <td className="hidden py-3 text-slate-400 sm:table-cell">{formatDate(new Date(r.created_at).getTime())}</td>
                  <td className="py-3 font-medium text-slate-700">{r.product?.name || "Product"}</td>
                  <td className="py-3 max-w-xs">
                    <StarRating value={r.rating} size="size-3" />
                    {r.title && <p className="font-semibold text-slate-800 mt-1">{r.title}</p>}
                    <p className="text-slate-500 line-clamp-2 mt-0.5">{r.body}</p>
                  </td>
                  <td className="hidden py-3 sm:table-cell">
                    <Badge variant="outline" className={r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status !== "approved" && <Button size="sm" variant="outline" className="rounded-full text-emerald-700" onClick={() => updateStatus(r.id, "approved")}>Approve</Button>}
                      {r.status !== "rejected" && <Button size="sm" variant="outline" className="rounded-full text-rose-600" onClick={() => updateStatus(r.id, "rejected")}>Disapprove</Button>}
                      <Button size="icon" variant="ghost" className="size-7 text-slate-500" onClick={() => deleteReview(r.id)} aria-label="Delete review"><Trash2 className="size-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
