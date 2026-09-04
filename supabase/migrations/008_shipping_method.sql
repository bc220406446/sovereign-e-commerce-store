alter table public.orders
  add column if not exists shipping_method text not null default 'normal';

update public.settings
set value = jsonb_set(jsonb_set(value, '{freeThreshold}', '10000'::jsonb), '{expressCharge}', '500'::jsonb)
where key = 'delivery';
