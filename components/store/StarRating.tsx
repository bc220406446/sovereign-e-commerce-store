import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "size-4",
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200",
          )}
        />
      ))}
    </div>
  );
}

export function StarInput({
  value,
  onChange,
  size = "size-6",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              size,
              i <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200 hover:fill-amber-200",
            )}
          />
        </button>
      ))}
    </div>
  );
}
