create table if not exists token_usage (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  feature       text not null,
  user_id       uuid references auth.users(id),
  model         text not null,
  input_tokens  int not null,
  output_tokens int not null,
  cost_usd      numeric(12, 8) not null default 0
);

create index on token_usage (created_at desc);
create index on token_usage (user_id, created_at desc);
create index on token_usage (feature, created_at desc);

alter table token_usage enable row level security;

create or replace function token_usage_by_feature()
returns table (
  feature       text,
  calls         bigint,
  input_tokens  bigint,
  output_tokens bigint,
  cost_usd      numeric
)
language sql security definer as $$
  select feature, count(*) as calls, sum(input_tokens) as input_tokens,
         sum(output_tokens) as output_tokens, sum(cost_usd) as cost_usd
  from token_usage group by feature order by cost_usd desc;
$$;

create or replace function token_usage_by_day()
returns table (day text, calls bigint, cost_usd numeric)
language sql security definer as $$
  select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') as day,
         count(*) as calls, sum(cost_usd) as cost_usd
  from token_usage where created_at >= now() - interval '14 days'
  group by 1 order by 1 desc;
$$;

grant all on public.token_usage to service_role;
