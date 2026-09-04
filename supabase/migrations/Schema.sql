-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'user'::text, 'member'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image text,
  sort_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  short_description text,
  images ARRAY NOT NULL DEFAULT '{}'::text[],
  price numeric NOT NULL,
  sale_price numeric,
  sku text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer,
  category_id uuid,
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  collections ARRAY NOT NULL DEFAULT '{}'::text[],
  movement text,
  case_material text,
  strap_material text,
  case_size text,
  dial_color text,
  water_resistance text,
  gender text,
  warranty text,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['active'::text, 'draft'::text])),
  featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  hero_image_url text,
  hero_image_alt text,
  gallery_media jsonb NOT NULL DEFAULT '[]'::jsonb,
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  label text,
  name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  shipping_address jsonb NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL,
  discount numeric NOT NULL DEFAULT 0,
  delivery_charge numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL,
  coupon_code text,
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['cod'::text, 'bank_transfer'::text, 'card'::text, 'payfast'::text])),
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text])),
  status text NOT NULL DEFAULT 'placed'::text,
  courier text,
  tracking_number text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  return_request jsonb,
  refund jsonb,
  return_courier text,
  return_tracking_number text,
  coupon_type text,
  coupon_value numeric NOT NULL DEFAULT 0,
  coupon_refundable boolean NOT NULL DEFAULT false,
  product_paid numeric NOT NULL DEFAULT 0,
  return_completed boolean NOT NULL DEFAULT false,
  delivery_failure jsonb,
  courier_return_tracking_number text,
  delivery_failure_count integer NOT NULL DEFAULT 0,
  reshipment_reason text,
  reshipment jsonb,
  replacement_shipping jsonb,
  shipping_method text NOT NULL DEFAULT 'normal'::text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.admin_invites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'user'::text, 'member'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text])),
  invited_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_invites_pkey PRIMARY KEY (id),
  CONSTRAINT admin_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type = ANY (ARRAY['percent'::text, 'fixed'::text])),
  value numeric NOT NULL,
  min_order numeric,
  max_discount numeric,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  coupon_type text NOT NULL DEFAULT 'promotional'::text,
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  user_id uuid,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  author_email text,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  topic text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'acknowledged'::text, 'resolved'::text])),
  admin_reply text,
  replied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'subscribed'::text CHECK (status = ANY (ARRAY['subscribed'::text, 'unsubscribed'::text])),
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.newsletter_campaigns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  subject text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'html'::text,
  total integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_campaigns_pkey PRIMARY KEY (id)
);