-- CapraSeed: billing subscriptions table
-- Run once in Supabase SQL editor.

create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade,
  stripe_customer_id     text not null,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  tier                   text not null default 'analyst',
  status                 text not null default 'active',
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_idx on subscriptions (user_id);

alter table subscriptions enable row level security;

create policy "subscriptions: own row read" on subscriptions
  for select using (user_id = auth.uid());
