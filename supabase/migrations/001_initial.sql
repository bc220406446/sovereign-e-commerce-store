-- ============================================================
-- Sovereign Watches - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor or via migrations
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin','user','member')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image text,
  sort_order integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_categories_slug on public.categories(slug);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text not null,
  short_description text,
  images text[] not null default '{}',
  price numeric(12,2) not null,
  sale_price numeric(12,2),
  sku text not null,
  stock integer not null default 0,
  low_stock_threshold integer,
  category_id uuid references public.categories(id) on delete set null,
  tags text[] not null default '{}',
  collections text[] not null default '{}',
  movement text,
  case_material text,
  strap_material text,
  case_size text,
  dial_color text,
  water_resistance text,
  gender text,
  warranty text,
  status text not null default 'draft' check (status in ('active','draft')),
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_status on public.products(status);

-- ============================================================
-- SETTINGS
-- ============================================================
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text not null
);
create index if not exists idx_settings_key on public.settings(key);

-- Seed default delivery settings
insert into public.settings (key, value)
values ('delivery', '{"defaultCharge":200,"freeThreshold":5000}')
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('paymentMethods', '["cod","bank_transfer","payfast"]')
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('orderCounter', '1041')
on conflict (key) do nothing;

-- ============================================================
-- ADDRESSES
-- ============================================================
create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  province text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on public.addresses(user_id);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  shipping_address jsonb not null,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  delivery_charge numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  coupon_code text,
  payment_method text not null check (payment_method in ('cod','bank_transfer','card','payfast')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status text not null default 'placed',
  courier text,
  tracking_number text,
  history jsonb not null default '[]',
  payment_token text,
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- ============================================================
-- WISHLIST
-- ============================================================
create table if not exists public.wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create index if not exists idx_wishlist_user on public.wishlist(user_id);

-- ============================================================
-- ADMIN INVITES
-- ============================================================
create table if not exists public.admin_invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text not null check (role in ('admin','user','member')),
  status text not null default 'pending' check (status in ('pending','accepted')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_invites_email on public.admin_invites(email);

-- ============================================================
-- COUPONS
-- ============================================================
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  type text not null check (type in ('percent','fixed')),
  value numeric(12,2) not null,
  min_order numeric(12,2),
  max_discount numeric(12,2),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_coupons_code on public.coupons(code);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_status on public.reviews(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist enable row level security;
alter table public.admin_invites enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;

-- Profiles: users can read/update their own; service role bypasses
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Categories: public read
create policy "Public can read categories" on public.categories for select using (true);

-- Products: public read active; admins read all
create policy "Public can read active products" on public.products for select using (status = 'active');

-- Settings: public read
create policy "Public can read settings" on public.settings for select using (true);

-- Coupons: service role only for write, public read (so checkout can validate)
create policy "Public can read coupons" on public.coupons for select using (true);

-- Orders: users can see their own; guests see nothing via RLS (API handles token auth)
create policy "Users can see own orders" on public.orders for select using (auth.uid() = user_id);

-- Addresses: users can CRUD their own
create policy "Users can manage own addresses" on public.addresses for all using (auth.uid() = user_id);

-- Wishlist: users manage their own
create policy "Users can manage own wishlist" on public.wishlist for all using (auth.uid() = user_id);

-- Reviews: approved reviews are public
create policy "Public can read approved reviews" on public.reviews for select using (status = 'approved');
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = user_id);
