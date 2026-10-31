"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/store/ProductImage";

interface HeroSliderProps {
  slides: { image: string; name: string }[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[heroIndex] || slides[0];

  return (
    <ProductImage
      key={heroIndex}
      src={currentSlide?.image}
      fallbackSrc="/hero-fallback.webp"
      alt={currentSlide?.name || "Sovereign category"}
      priority
      className="hero-fade relative aspect-square rounded-[2rem] shadow-xl ring-1 ring-white/80"
    />
  );
}
