create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  topic text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

create index if not exists idx_contact_messages_created on public.contact_messages(created_at desc);
create index if not exists idx_newsletter_subscribers_status on public.newsletter_subscribers(status);
