"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { effectivePrice } from "@/lib/store";
import { Product } from "@/types/database";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface HydratedLine extends CartLine {
  name: string;
  slug: string;
  image?: string;
  price: number;
  stock: number;
  status: string;
}

interface CartContextValue {
  lines: CartLine[];
  hydrated: HydratedLine[];
  count: number;
  subtotal: number;
  addItem: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sovereign_cart_v1";

function readStored(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) => typeof l?.productId === "string" && typeof l?.qty === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setLines(readStored());
    setStorageReady(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (storageReady && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      } catch {}
    }
  }, [lines, storageReady]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const hydrated = useMemo<HydratedLine[]>(() => {
    return lines.flatMap((line) => {
      const p = productById.get(line.productId);
      if (!p) return [];
      const out: HydratedLine = {
        ...line,
        name: p.name,
        slug: p.slug,
        image: p.images[0],
        price: effectivePrice(p.price, p.sale_price ?? undefined),
        stock: p.stock,
        status: p.status,
      };
      return [out];
    });
  }, [lines, productById]);

  const count = useMemo(
    () => hydrated.reduce((acc, l) => acc + l.qty, 0),
    [hydrated],
  );

  const subtotal = useMemo(
    () => hydrated.reduce((acc, l) => acc + l.price * l.qty, 0),
    [hydrated],
  );

  const addItem = (productId: string, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { productId, qty }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  };

  const removeItem = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const clear = () => setLines([]);

  return (
    <CartContext.Provider
      value={{
        lines,
        hydrated,
        count,
        subtotal,
        addItem,
        setQty,
        removeItem,
        clear,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
