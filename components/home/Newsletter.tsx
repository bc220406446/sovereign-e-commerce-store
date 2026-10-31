"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEmail("");
      toast.success("Welcome to the Sovereign circle! Check your inbox.");
    } catch {
      toast.error("We could not subscribe you. Please try again.");
    } finally {
      setLoading(false);
    }
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
              disabled={loading}
              className="rounded-full border-0 bg-white/90 shadow-inner text-slate-800"
            />
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {loading ? "..." : "Subscribe"}
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

