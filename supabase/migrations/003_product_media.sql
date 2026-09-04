alter table public.products
  add column if not exists hero_image_url text,
  add column if not exists hero_image_alt text,
  add column if not exists gallery_media jsonb not null default '[]'::jsonb,
  add column if not exists specifications jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = true;
