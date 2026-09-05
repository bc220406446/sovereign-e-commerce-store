"use client";

import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  HandCoins,
  MapPin,
  Phone,
} from "lucide-react";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/store";
import { Category } from "@/types/database";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://facebook.com/sovereignwatches",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/sovereignwatches",
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@sovereignwatches",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/923001234567",
  },
];

function ProvidedSocialIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    Facebook:
      "M12,2c-5.523,0 -10,4.477 -10,10c0,5.013 3.693,9.153 8.505,9.876v-7.226h-2.474v-2.629h2.474v-1.749c0,-2.896 1.411,-4.167 3.818,-4.167c1.153,0 1.762,0.085 2.051,0.124v2.294h-1.642c-1.022,0 -1.379,0.969 -1.379,2.061v1.437h2.995l-0.406,2.629h-2.588v7.247c4.881,-0.661 8.646,-4.835 8.646,-9.897c0,-5.523 -4.477,-10 -10,-10z",

    Instagram:
      "M8 3c-2.761 0-5 2.239-5 5v8c0 2.761 2.239 5 5 5h8c2.761 0 5-2.239 5-5V8c0-2.761-2.239-5-5-5H8Zm10 2c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1Zm-6 2c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5Zm0 2c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3Z",

    TikTok:
      "M6 3c-1.645 0-3 1.355-3 3v12c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V6c0-1.645-1.355-3-3-3H6Zm6 4h2c0 1.005 1.471 2 2 2v2c-.605 0-1.332-.266-2-.715V14c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3v2c-.552 0-1 .449-1 1s.448 1 1 1 1-.449 1-1V7Z",

    WhatsApp:
      "M19.077 4.928C17.191 3.041 14.683 2.001 12.011 2c-5.506 0-9.987 4.479-9.989 9.985a9.98 9.98 0 0 0 1.333 4.992L2 22l5.233-1.237a9.98 9.98 0 0 0 4.773 1.216h.004c5.505 0 9.986-4.48 9.989-9.985.002-2.669-1.036-5.178-2.922-7.066ZM16.898 15.554c-.208.583-1.227 1.145-1.685 1.186-.458.042-.887.207-2.995-.624-2.537-1-4.139-3.601-4.263-3.767-.125-.167-1.019-1.353-1.019-2.581 0-1.228.645-1.832.874-2.081.229-.25.499-.312.666-.312h.478c.178.007.375.016.562.431.222.494.707 1.728.769 1.853.062.125.104.271.021.437-.083.166-.125.27-.249.416-.125.146-.262.325-.374.437-.125.124-.255.26-.11.509.146.25.646 1.067 1.388 1.728.954.85 1.757 1.113 2.007 1.239.25.125.395.104.541-.063.146-.166.624-.728.79-.978.166-.25.333-.208.562-.125.229.083 1.456.687 1.705.812.25.125.416.187.478.291.062.103.062.603-.146 1.186Z",
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block size-[22px]"
    >
      <path fill="#946930" d={paths[label]} />
    </svg>
  );
}

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
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();

      setEmail("");
      toast.success(
        "You're on the list - welcome to the Sovereign circle!"
      );
    } catch {
      toast.error("We could not subscribe you. Please try again.");
    }
  };

  return (
    <footer className="relative mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="glass-chip flex size-10 items-center justify-center rounded-xl text-primary">
                  <img
                    src="/sovereign-logo.png"
                    alt="Sovereign Watches"
                    className="size-8 object-contain"
                  />
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
                  <MapPin className="size-4 text-primary" />
                  Mall Road, Lahore, Pakistan
                </p>

                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  +92 300 1234567
                </p>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                Shop
              </h4>

              <ul className="space-y-2.5 text-sm text-slate-500">
                <li>
                  <Link
                    href="/shop"
                    className="transition-colors hover:text-primary"
                  >
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

            {/* Customer Care */}
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
                    <Link
                      href={href}
                      className="transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
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
                  className="w-full cursor-pointer rounded-full bg-primary py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Join the Circle
                </button>
              </form>

              {/* Social Icons */}
              <div className="pt-1">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Follow Sovereign On
                </p>

                <div className="flex items-center gap-2">
                  {SOCIAL_LINKS.map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex size-[22px] items-center justify-center"
                    >
                      <ProvidedSocialIcon label={label} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Payment Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60 pt-6 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} {STORE_NAME} Watches. All rights
              reserved.
            </p>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <HandCoins className="size-4 text-primary" />
                Cash on Delivery
              </span>

              <span className="flex items-center gap-1">
                <Banknote className="size-4 text-primary" />
                Bank Transfer
              </span>

              <span className="flex items-center gap-1">
                <CreditCard className="size-4 text-primary" />
                Credit / Debit Cards
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}