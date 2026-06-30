# CapraStarter — CLAUDE.md

## What this is
CapraStarter is a Next.js 15 (App Router) SaaS that runs CapraSeed: an AI-powered venture analysis engine. Users paste a startup idea and get a 12-section blueprint (market, revenue, competitors, pricing, SWOT, legal, go-to-market, etc.) powered by Claude AI. Stripe handles billing, Supabase handles auth + data.

## Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript strict
- **Auth:** Supabase SSR (`@supabase/ssr`) — email OTP + Google OAuth
- **DB:** Supabase Postgres — two tables: `reports`, `subscriptions`
- **AI:** Anthropic Claude via `@anthropic-ai/sdk` (in `lib/capra-seed/claude.ts`)
- **Billing:** Stripe — checkout, billing portal, webhook
- **Fonts:** Playfair Display, DM Sans, DM Mono (Google Fonts)
- **Port:** 3010 (dev)

## Key directories
```
app/
  page.tsx              — Main page: Hero → ResultsDashboard → SavedReportsList
  layout.tsx            — Root layout: fonts, UserNav, analytics script
  login/page.tsx        — Email OTP + Google OAuth sign-in
  auth/callback/        — Supabase OAuth code exchange
  api/
    capra-seed/analyze/ — POST: runs one analysis section via Claude
    capra-seed/reports/ — GET/POST: list + save reports (DB for auth'd, filesystem for guests)
    capra-seed/reports/[id]/ — GET: load a single saved report
    stripe/checkout/    — GET: create Stripe checkout session
    stripe/portal/      — GET: redirect to Stripe billing portal
    stripe/webhook/     — POST: handle Stripe events → update subscriptions table

components/capra-seed/
  Hero.tsx              — Landing form (idea textarea + advanced options)
  ResultsDashboard.tsx  — Post-analysis layout: progress bar, header, 12-section grid
  SavedReportsList.tsx  — Lists and opens saved reports
  cards/                — 12 analysis cards (one per section) + BaseCard skeleton
  ExecSummaryCard.tsx   — At-a-glance stats panel
  BuilderHandoffCard.tsx — Sends analysis to CapraForge site builder
  CapraStarterCard.tsx  — Cross-link to CapraBrand for brand kit

components/
  UserNav.tsx           — Fixed top-right: user email, Billing link, Sign out
  ErrorBoundary.tsx     — React class boundary wrapping the analysis grid

lib/capra-seed/
  claude.ts             — Calls Anthropic API for each section
  prompts.ts            — Section-specific system prompts
  storage.ts            — Filesystem report storage (guest sessions)
  storage-db.ts         — Supabase report storage (authenticated users)
  mock.ts               — Fallback mock data (dev/demo)
  handoff.ts            — Payload builder for CapraForge

lib/supabase/
  client.ts             — Browser Supabase client
  server.ts             — Server Supabase client (cookie-based)
  admin.ts              — Admin client (service_role, bypasses RLS)

lib/stripe.ts           — Lazy-init Stripe SDK proxy + PRICES map

types/capra-seed.ts     — All TypeScript types (SectionId, AnalysisState, etc.)

schema/
  capraseed-reports-v1.sql        — reports table + RLS
  capraseed-subscriptions-v1.sql  — subscriptions table + RLS
  capraseed-subscriptions-v2.sql  — Additional indexes for webhook performance
```

## Billing tiers
| Tier    | Price  | Limit             | Env var               |
|---------|--------|-------------------|-----------------------|
| free    | €0     | 1 analysis/month  | (no Stripe price)     |
| analyst | €19/mo | 10 analyses/month | STRIPE_PRICE_ANALYST  |
| pro     | €49/mo | unlimited         | STRIPE_PRICE_PRO      |
| studio  | €149/mo| unlimited (team)  | STRIPE_PRICE_STUDIO   |

Tier is enforced server-side in `api/capra-seed/analyze/route.ts` on the `overview` section (first section of every analysis). `past_due` subscriptions fall back to `free` tier automatically (the DB query filters `status = 'active'`).

## Auth flow
1. `/login` → email OTP or Google OAuth
2. Supabase redirects to `/auth/callback?code=...`
3. Callback exchanges code for session, redirects to `/`
4. Middleware (`middleware.ts`) refreshes session tokens on every request

## Guest users
Unauthenticated users can run analyses and save reports. Reports are stored on the server filesystem keyed by a session UUID in an httpOnly cookie (`capraseed_session`). Guest reports are not persistent across server restarts.

## Required environment variables
See `.env.example` for the full list. Key ones:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*`
- `NEXT_PUBLIC_URL` (for Stripe redirect URLs)

## Run locally
```bash
npm run dev    # starts on port 3010
```
Stripe webhook forwarding:
```bash
stripe listen --forward-to localhost:3010/api/stripe/webhook
```

## DB migrations
Run SQL files in order in the Supabase SQL editor:
1. `schema/capraseed-reports-v1.sql`
2. `schema/capraseed-subscriptions-v1.sql`
3. `schema/capraseed-subscriptions-v2.sql`

## Security notes
- RLS is enabled on both tables; users can only read their own rows
- Subscription writes go through the service_role key (webhook handler) — never from the client
- Rate limiting on `/api/capra-seed/analyze`: 30 req/min per IP (in-memory, single-instance)
- CSP: `unsafe-eval` is excluded in production; only present in dev for HMR
