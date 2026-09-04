"use client";

import { AdminHeader } from "../layout";
import { useEffect, useState } from "react";
import { formatDateTime, formatRs } from "@/lib/store";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCustomers(data); });
  }, []);

  return (
    <div>
      <AdminHeader
        title="Customers"
        subtitle={`Registered store users, lifetime value & orders (${customers.length} customers)`}
      />

      <div className="glass rounded-3xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400">
                <th className="hidden pb-3 font-semibold sm:table-cell">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="hidden pb-3 font-semibold sm:table-cell">Phone</th>
                <th className="pb-3 font-semibold">Orders</th>
                <th className="hidden pb-3 font-semibold text-right sm:table-cell">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="hidden py-3 sm:table-cell">
                    <p className="font-semibold text-slate-900">{u.name || "-"}</p>
                  </td>
                  <td className="py-3 text-slate-400">{u.email || "-"}</td>
                  <td className="hidden py-3 text-slate-600 sm:table-cell">{u.phone || "-"}</td>
                  <td className="py-3 font-medium text-slate-700">{u.orderCount} orders</td>
                  <td className="hidden py-3 text-right font-bold text-slate-900 sm:table-cell">{formatRs(u.totalSpent || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
