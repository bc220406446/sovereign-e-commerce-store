import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityPicker({
  value,
  onChange,
  max = 99,
  size = "md",
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn = cn(
    "flex items-center justify-center text-slate-500 transition-colors hover:text-primary disabled:opacity-40",
    size === "sm" ? "size-6" : "size-8",
  );
  return (
    <div
      className={cn(
        "glass-chip inline-flex items-center rounded-full",
        size === "sm" ? "px-1" : "px-1.5",
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className={size === "sm" ? "size-3" : "size-3.5"} />
      </button>
      <span
        className={cn(
          "text-center font-semibold text-slate-700 tabular-nums",
          size === "sm" ? "w-6 text-sm" : "w-8 text-sm",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className={size === "sm" ? "size-3" : "size-3.5"} />
      </button>
    </div>
  );
}
