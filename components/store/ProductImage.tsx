"use client";

import { Watch } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  fallbackSrc,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackSrc?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if ((!src || failed) && fallbackSrc) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <img src={fallbackSrc} alt={alt} className={cn("h-full w-full object-cover", imgClassName)} />
      </div>
    );
  }
  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-amber-100 via-white to-yellow-100",
          className,
        )}
        aria-label={alt}
      >
        <Watch className="size-10 text-primary/70" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {fallbackSrc && !loaded && <img src={fallbackSrc} alt="" aria-hidden="true" className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn("relative h-full w-full object-cover transition-opacity duration-500", imgClassName, !loaded && fallbackSrc ? "opacity-0" : "opacity-100")}
      />
    </div>
  );
}
