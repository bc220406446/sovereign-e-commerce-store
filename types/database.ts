export type Role = "admin" | "user" | "member";
export type OrderStatus =
  | "placed" | "confirmed" | "packaging" | "packaged"
  | "handed_to_courier" | "out_for_delivery" | "delivered" | "completed"
  | "delivery_failed" | "return_requested" | "return_approved"
  | "returned" | "refunded" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "bank_transfer" | "card" | "payfast";
export type ProductStatus = "active" | "draft";
export type ProductCollection = "new-arrival" | "latest-edition" | "best-seller" | "premium" | "featured";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type InviteStatus = "pending" | "accepted";
export type CouponType = "percent" | "fixed";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sort_order: number | null;
  created_at: string;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  images: string[];
  hero_image_url: string | null;
  hero_image_alt: string | null;
  gallery_media: { type: "image" | "video"; url: string; alt?: string }[];
  specifications: Record<string, string>;
  price: number;
  sale_price: number | null;
  sku: string;
  stock: number;
  low_stock_threshold: number | null;
  category_id: string | null;
  tags: string[];
  collections: ProductCollection[];
  movement: string | null;
  case_material: string | null;
  strap_material: string | null;
  case_size: string | null;
  dial_color: string | null;
  water_resistance: string | null;
  gender: string | null;
  warranty: string | null;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  category?: Category | null;
}

export interface OrderItem {
  product_id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  qty: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface OrderHistoryEntry {
  status: string;
  note?: string;
  at: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  courier: string | null;
  tracking_number: string | null;
  history: OrderHistoryEntry[];
  payment_token: string | null;
  product_paid?: number;
  coupon_value?: number;
  coupon_refundable?: boolean;
  return_completed?: boolean;
  return_request?: ReturnRequest | null;
  refund?: RefundDetails | null;
  return_courier?: string | null;
  return_tracking_number?: string | null;
  delivery_failure?: DeliveryFailure | null;
  courier_return_tracking_number?: string | null;
  delivery_failure_count?: number;
  reshipment_reason?: string | null;
  reshipment?: { company: string; tracking_id: string; reason?: string; saved_at?: number } | null;
  replacement_shipping?: { company: string; tracking_id: string; reason?: string; saved_at?: number } | null;
  created_at: string;
}

export interface DeliveryFailure {
  reason: string;
  notes?: string;
  recorded_at: number;
}

export interface ReturnRequest {
  reason: string;
  customer_notes?: string;
  status: "requested" | "received" | "approved" | "rejected";
  rejection_reason?: string;
  requested_at: number;
  reviewed_at?: number;
}

export interface RefundDetails {
  amount: number;
  method: "coupon" | "bank_transfer" | "original_payment";
  coupon_code?: string;
  generated_at: number;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order: number | null;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  created_at: string;
  product?: Product;
}

export interface AdminInvite {
  id: string;
  email: string;
  role: Role;
  status: InviteStatus;
  invited_by: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
}

export interface DeliveryConfig {
  defaultCharge: number;
  freeThreshold: number;
}
