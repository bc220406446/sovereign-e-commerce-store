update public.contact_messages set status = 'pending' where status = 'new';
alter table public.contact_messages drop constraint if exists contact_messages_status_check;
alter table public.contact_messages add constraint contact_messages_status_check check (status in ('pending','acknowledged','resolved'));
alter table public.contact_messages alter column status set default 'pending';
