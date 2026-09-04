-- Profile extensions
-- Passwords must remain in Supabase Auth (auth.users). Never store a password
-- or password hash in public.profiles. Password changes use auth.updateUser().

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Public Supabase Storage URL for the user profile image';
