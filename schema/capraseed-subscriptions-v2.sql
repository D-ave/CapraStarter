-- CapraSeed: subscriptions performance indexes
-- Run after capraseed-subscriptions-v1.sql

-- Webhook upserts query by stripe_customer_id and stripe_subscription_id on every event
create index if not exists subscriptions_stripe_customer_id_idx
  on subscriptions (stripe_customer_id);

create index if not exists subscriptions_stripe_subscription_id_idx
  on subscriptions (stripe_subscription_id);

-- Note on RLS write policies:
-- No INSERT/UPDATE/DELETE policies are defined intentionally.
-- RLS denies all writes from regular users (correct — subscriptions are
-- managed exclusively by the Stripe webhook handler via the service_role key,
-- which bypasses RLS entirely). This prevents users from self-assigning tiers.
