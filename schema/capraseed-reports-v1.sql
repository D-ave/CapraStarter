-- CapraSeed: reports table
-- Run once in Supabase SQL editor.

create table if not exists reports (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  idea        text not null,
  title       text,
  inputs      jsonb not null default '{}',
  sections    jsonb not null default '{}',
  usage       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reports_user_id_created_idx on reports (user_id, created_at desc);

alter table reports enable row level security;

create policy "reports: own rows" on reports
  for all using (user_id = auth.uid());
