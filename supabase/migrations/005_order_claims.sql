alter table public.orders
  add column if not exists return_request jsonb,
  add column if not exists refund jsonb,
  add column if not exists return_courier text,
  add column if not exists return_tracking_number text,
  add column if not exists coupon_type text,
  add column if not exists coupon_value numeric(12,2) not null default 0,
  add column if not exists coupon_refundable boolean not null default false,
  add column if not exists product_paid numeric(12,2) not null default 0,
  add column if not exists return_completed boolean not null default false,
  add column if not exists delivery_failure jsonb,
  add column if not exists courier_return_tracking_number text;
alter table public.orders
  add column if not exists delivery_failure_count integer not null default 0;
alter table public.orders
  add column if not exists reshipment_reason text;

alter table public.coupons
  add column if not exists coupon_type text not null default 'promotional';

comment on column public.orders.return_request is
  'Return/claim request details, review state, reason and admin decision';

comment on column public.orders.refund is
  'Refund details including amount, method, coupon and generated timestamp';
