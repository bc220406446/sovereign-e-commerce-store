"use client";

import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Banknote, CreditCard, Facebook, HandCoins, Instagram, MapPin, MessageCircle, Music2, Phone, Watch } from "lucide-react";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/store";
import { Category } from "@/types/database";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com/sovereignwatches", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com/sovereignwatches", icon: Instagram },
  { label: "TikTok", href: "https://tiktok.com/@sovereignwatches", icon: Music2 },
  { label: "WhatsApp", href: "https://wa.me/923001234567", icon: MessageCircle },
];

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!res.ok) throw new Error();
      setEmail("");
      toast.success("You're on the list - welcome to the Sovereign circle!");
    } catch { toast.error("We could not subscribe you. Please try again."); }
  };

  return (
    <footer className="relative mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="glass-chip flex size-10 items-center justify-center rounded-xl text-primary">
                  <Watch className="size-5" strokeWidth={1.8} />
                </span>
                <span className="font-display text-xl font-semibold text-slate-900">
                  {STORE_NAME}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {STORE_TAGLINE}. Every Sovereign timepiece is finished with
                restraint, backed by a written warranty, and delivered across
                Pakistan.
              </p>
              <div className="space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" /> Mall Road, Lahore,
                  Pakistan
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" /> +92 300 1234567
                </p>
              </div>
            </div>

            {/* shop */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                Shop
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li>
                  <Link href="/shop" className="transition-colors hover:text-primary">
                    All Watches
                  </Link>
                </li>
                {categories.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      className="transition-colors hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* care */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                Customer Care
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                {[
                  ["FAQs", "/care/faqs"],
                  ["Returns & Exchange", "/care/returns"],
                  ["Warranty Information", "/care/warranty"],
                  ["Shipping Policy", "/care/shipping"],
                  ["Modes of Payment", "/care/payment"],
                  ["Privacy Policy", "/care/privacy"],
                  ["Terms of Service", "/care/terms"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="transition-colors hover:text-primary">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* newsletter */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                The Sovereign Circle
              </h4>
              <p className="text-sm text-slate-500">
                Receive private invitations to limited editions and considered
                watch guides.
              </p>
              <form onSubmit={subscribe} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full bg-white/70 shadow-inner"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Join the Circle
                </button>
              </form>
              <div className="border-t border-slate-200/60 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700">Follow Sovereign On</p>
                <div className="flex items-center gap-2">
                  {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="glass-chip flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-primary hover:text-white">
                      <Icon className="size-4" strokeWidth={1.8} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* bottom payment strip */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {STORE_NAME} Watches. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <HandCoins className="size-4 text-primary" /> Cash on Delivery
              </span>
              <span className="flex items-center gap-1">
                <Banknote className="size-4 text-primary" /> Bank Transfer
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="size-4 text-primary" /> PayFast / Cards
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
