export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packaging"
  | "packaged"
  | "handed_to_courier"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "delivery_failed"
  | "return_requested"
  | "return_approved"
  | "returned"
  | "refunded"
  | "cancelled";

/** All possible order statuses (fulfillment + failure/return paths). */
export const ORDER_STATUS: OrderStatus[] = [
  "placed",
  "confirmed",
  "packaging",
  "packaged",
  "handed_to_courier",
  "out_for_delivery",
  "delivered",
  "completed",
  "delivery_failed",
  "return_requested",
  "return_approved",
  "returned",
  "refunded",
  "cancelled",
];

/** The happy-path tracking timeline shown to customers. */
export const TRACKING_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "packaging",
  "packaged",
  "handed_to_courier",
  "out_for_delivery",
  "delivered",
  "completed",
];

export const TRACKING_FLOW_LABELS: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  packaging: "Packaging",
  packaged: "Packaging Completed",
  handed_to_courier: "Handed to Courier",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  replacement_delivered: "Replacement Delivered",
  placed: "Order Placed",
  confirmed: "Confirmed",
  packaging: "Packaging",
  packaged: "Packaging Completed",
  handed_to_courier: "With Courier",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  delivery_failed: "Delivery Failed",
  return_requested: "Return Requested",
  return_approved: "Return Approved",
  returned: "Returned",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
  card: "Card Payment",
  payfast: "PayFast",
};

export const COLLECTION_LABELS: Record<string, string> = {
  "new-arrival": "New Arrival",
  "latest-edition": "Latest Edition",
  "best-seller": "Best Seller",
  premium: "Premium",
  featured: "Featured",
};

export const STORE_NAME = "Sovereign";
export const STORE_TAGLINE = "Restraint is the rarest form of luxury";

/** Format a number as Pakistani Rupees, e.g. Rs. 84,500 */
export function formatRs(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Effective unit price (sale price wins when set). */
export function effectivePrice(price: number, salePrice?: number) {
  return salePrice && salePrice < price ? salePrice : price;
}

export function discountPercent(price: number, salePrice?: number): number | null {
  if (!salePrice || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

export function inStock(stock: number): boolean {
  return stock > 0;
}

/** Collection badge tone mapping for chips. */
export const COLLECTION_TONES: Record<string, string> = {
  "new-arrival": "bg-sky-100/80 text-sky-700 border-sky-200/80",
  "latest-edition": "bg-indigo-100/80 text-indigo-700 border-indigo-200/80",
  "best-seller": "bg-emerald-100/80 text-emerald-700 border-emerald-200/80",
  premium: "bg-amber-100/80 text-amber-700 border-amber-200/80",
  featured: "bg-cyan-100/80 text-cyan-700 border-cyan-200/80",
};

export const ORDER_STATUS_TONES: Record<string, string> = {
  placed: "bg-sky-100/80 text-sky-700 border-sky-200/80",
  confirmed: "bg-indigo-100/80 text-indigo-700 border-indigo-200/80",
  packaging: "bg-cyan-100/80 text-cyan-700 border-cyan-200/80",
  packaged: "bg-teal-100/80 text-teal-700 border-teal-200/80",
  handed_to_courier: "bg-violet-100/80 text-violet-700 border-violet-200/80",
  out_for_delivery: "bg-amber-100/80 text-amber-700 border-amber-200/80",
  delivered: "bg-emerald-100/80 text-emerald-700 border-emerald-200/80",
  completed: "bg-emerald-100/80 text-emerald-700 border-emerald-200/80",
  delivery_failed: "bg-rose-100/80 text-rose-700 border-rose-200/80",
  return_requested: "bg-orange-100/80 text-orange-700 border-orange-200/80",
  return_approved: "bg-orange-100/80 text-orange-700 border-orange-200/80",
  returned: "bg-stone-200/80 text-stone-700 border-stone-300/80",
  refunded: "bg-slate-200/80 text-slate-700 border-slate-300/80",
  cancelled: "bg-slate-200/80 text-slate-600 border-slate-300/80",
};

/** Human helper for the tracking timeline index of a status. */
export function trackingStepIndex(status: string): number {
  const idx = TRACKING_FLOW.indexOf(status as (typeof TRACKING_FLOW)[number]);
  return idx === -1 ? 0 : idx;
}

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];

export const citiesByProvince: Record<string, string[]> = {
  Punjab: ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha", "Sheikhupura", "Gujrat"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Mirpur Khas", "Nawabshah"],
  "Khyber Pakhtunkhwa": ["Peshawar", "Mardan", "Abbottabad", "Swat", "Kohat", "Dera Ismail Khan"],
  Balochistan: ["Quetta", "Khuzdar", "Turbat", "Gwadar"],
  "Islamabad Capital Territory": ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu"],
  "Azad Kashmir": ["Muzaffarabad", "Mirpur", "Kotli"],
};
