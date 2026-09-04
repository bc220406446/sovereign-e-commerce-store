"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminHeader } from "../layout";
import { Shield, Trash2, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function AdminTeam() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const { user } = useAuth();

  const fetchTeam = () => {
    fetch("/api/admin/team")
      .then((res) => res.json())
      .then((data) => {
        if (data.admins) setAdmins(data.admins);
        if (data.invites) setInvites(data.invites);
      });
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setInviting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "admin" }),
      });
      if (!res.ok) throw new Error("Invite failed");
      toast.success("Admin invitation recorded.");
      setEmail("");
      fetchTeam();
    } catch {
      toast.error("Failed to send invite.");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      fetchTeam();
      toast.success("Invite cancelled.");
    } catch {
      toast.error("Could not cancel invite.");
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (!confirm("Remove this administrator's portal access?")) return;
    const res = await fetch(`/api/admin/team?id=${id}&type=admin`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Could not remove administrator.");
    fetchTeam();
    toast.success("Administrator access removed.");
  };

  return (
    <div>
      <AdminHeader
        title="Team & Invites"
        subtitle="Manage administrative members with portal access"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Current Admins & Invites */}
        <div className="glass rounded-3xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">Active Administrators</h2>
            <div className="space-y-3">
              {admins.map((a) => (
                <div key={a.id} className="glass-soft flex flex-col items-start rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      <Shield className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{a.name || "Administrator"}</p>
                      <p className="text-slate-400 text-xs">{a.email}</p>
                    </div>
                  </div>
                  {a.id !== user?.id && <Button size="sm" variant="outline" className="mt-3 rounded-full text-xs text-rose-600" onClick={() => handleRemoveAdmin(a.id)}>Remove admin</Button>}
                </div>
              ))}
            </div>
          </div>

          {invites.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">Pending Invitations</h2>
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div key={inv.id} className="glass-soft flex items-center justify-between rounded-2xl p-4">
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{inv.email}</p>
                      <p className="text-slate-400 text-[10px]">Pending acceptance</p>
                    </div>
                    <Button size="icon" variant="ghost" className="size-7 text-rose-500" onClick={() => handleCancelInvite(inv.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Invite Form */}
        <div className="glass rounded-3xl p-6 h-fit space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">Invite Team Member</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter an email address to designate as an administrator. When they sign in with this email, they will automatically be granted store management access.
          </p>
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="rounded-xl bg-white/70 text-xs mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={inviting || !email.trim()}>
              <UserPlus className="size-4 mr-1.5" /> Send Invite
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
