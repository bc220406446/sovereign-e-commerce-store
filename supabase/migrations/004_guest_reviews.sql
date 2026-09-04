alter table public.reviews
  alter column user_id drop not null,
  add column if not exists author_email text;

comment on column public.reviews.author_email is
  'Email supplied by the reviewer or copied from the authenticated profile';
