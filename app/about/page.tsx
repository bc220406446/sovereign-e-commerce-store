"use client";

import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/ProductImage";
import StoreLayout from "@/components/store/StoreLayout";
import { ArrowRight, BadgeCheck, Gem, Headphones, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function About() {
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    fetch("/api/categories").then((res) => res.json()).then((data) => {
      if (Array.isArray(data)) setHeroImages(data.map((category) => category.image).filter(Boolean));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroImages.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* hero */}
        <div className="glass overflow-hidden rounded-[2rem]">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-5 p-8 sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Our story
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                A watch house built on{" "}
                <span className="text-gradient">restraint</span>
              </h1>
              <p className="leading-relaxed text-slate-500">
                Sovereign began with a simple belief: that restraint is the rarest
                form of luxury. We were tired of loud logos, inflated markups,
                confusing 'discounts', and opaque warranty fine print. So we built
                the house we wished existed - a curated collection of automatic,
                quartz and smart timepieces, priced honestly and backed by real
                people.
              </p>
              <p className="leading-relaxed text-slate-500">
                From our Lahore atelier, every Sovereign watch is inspected,
                regulated and gift-wrapped by hand. We personally answer every
                message, and we honour our warranties without a fight.
              </p>
              <Button size="lg" className="rounded-full px-7" asChild>
                <Link href="/shop">
                  Explore the collection <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ProductImage
              src={heroImages[heroIndex]}
              fallbackSrc="/hero-fallback.png"
              alt="Sovereign craftsmanship"
              key={heroIndex}
              className="hero-fade aspect-square w-full"
            />
          </div>
        </div>

        {/* stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { value: "5,000+", label: "Watches delivered" },
            { value: "4.9★", label: "Average customer rating" },
            { value: "12-36 mo", label: "Warranty on every piece" },
            { value: "100%", label: "Authenticity guarantee" },
          ].map((s) => (
            <div key={s.label} className="glass-soft rounded-2xl p-6 text-center">
              <p className="font-display text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* why choose us */}
        <div className="mt-16 sm:mt-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              The Sovereign standard
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
              Why choose Sovereign?
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Truck, title: "Nationwide Delivery", desc: "2-5 working days, complimentary over Rs. 10,000" },
              { icon: BadgeCheck, title: "Certified Authentic", desc: "Genuine movements, sealed & verified" },
              { icon: Headphones, title: "Sovereign Support", desc: "Real people, seven days a week" },
              { icon: Gem, title: "14-Day Returns", desc: "Considered, no-questions returns" },
            ].map((v) => (
              <div key={v.title} className="glass-soft rounded-2xl p-5 text-center">
                <span className="glass-chip mx-auto flex size-12 items-center justify-center rounded-2xl text-primary">
                  <v.icon className="size-6" strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 font-semibold text-slate-800">{v.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
