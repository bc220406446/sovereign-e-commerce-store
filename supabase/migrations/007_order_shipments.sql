alter table public.orders
  add column if not exists reshipment jsonb,
  add column if not exists replacement_shipping jsonb;

comment on column public.orders.reshipment is
  'Second shipment after a parcel was returned by the courier';

comment on column public.orders.replacement_shipping is
  'Replacement shipment created after an approved exchange claim';
