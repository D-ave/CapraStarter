create table if not exists brand_kits (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  brand_name  text not null,
  industry    text,
  keywords    text,
  vibe        text,
  kit         jsonb not null,              -- full BrandKit payload
  slug        text unique,                 -- optional short share slug
  source      text default 'caprastarter', -- 'caprastarter' | 'capraseed'
  capraseed_idea text                      -- original CapraSeed venture idea if cross-posted
);

-- Index for listing by recency
create index brand_kits_created_at_idx on brand_kits (created_at desc);

-- Enable RLS (service role bypasses, anon can read by slug)
alter table brand_kits enable row level security;

create policy "Public read by slug"
  on brand_kits for select
  using (slug is not null);

create policy "Service role full access"
  on brand_kits for all
  using (auth.role() = 'service_role');
