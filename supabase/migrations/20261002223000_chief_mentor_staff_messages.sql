-- Chief Mentor private staff-to-staff messaging
create table if not exists public.staff_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists staff_messages_sender_idx
  on public.staff_messages(sender_id, created_at desc);

create index if not exists staff_messages_recipient_idx
  on public.staff_messages(recipient_id, created_at desc);

alter table public.staff_messages enable row level security;

revoke all on public.staff_messages from anon, authenticated;
grant select, insert, update, delete on public.staff_messages to service_role;
