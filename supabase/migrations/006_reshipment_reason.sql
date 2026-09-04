-- Store the reason for a courier-returned parcel separately from the
-- customer return/claim reason.
alter table public.orders
  add column if not exists reshipment_reason text;

comment on column public.orders.reshipment_reason is
  'Reason the original courier delivery failed before a reshipment';
