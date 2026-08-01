import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const TIER_LABELS: Record<string, string> = {
  analyst: "Analyst",
  pro: "Pro",
  studio: "Studio",
};

// The shared Stripe account fans every app's events out to every endpoint.
// Checkout sessions and subscriptions are stamped with metadata.app at
// creation, so events stamped for another app must be acknowledged and
// dropped before they can touch our rows; unstamped events are pre-stamp
// legacy traffic — also dropped, but counted.
const APP_KEY = "caprastarter";

const GATED_EVENT_FAMILIES = ["checkout.session.", "customer.subscription.", "invoice."];

// Resolves the originating app for the event families this handler processes,
// from the event object only (never an extra Stripe API call). Returns
// undefined when the object carries no stamp.
function appKeyForEvent(event: Stripe.Event): string | undefined {
  if (event.type.startsWith("checkout.session.")) {
    return (event.data.object as Stripe.Checkout.Session).metadata?.app;
  }
  if (event.type.startsWith("customer.subscription.")) {
    return (event.data.object as Stripe.Subscription).metadata?.app;
  }
  if (event.type.startsWith("invoice.")) {
    // Newer API versions carry the subscription stamp under
    // parent.subscription_details; older payloads have a top-level
    // subscription_details.
    const inv = event.data.object as Stripe.Invoice;
    return (
      inv.parent?.subscription_details?.metadata?.app ??
      (inv as unknown as { subscription_details?: { metadata?: { app?: string } } })
        .subscription_details?.metadata?.app
    );
  }
  return undefined;
}

// Maps a Stripe price id back to the tier it was purchased under, using the same
// STRIPE_PRICE_* env vars used at checkout. Keeps `tier` in sync on plan changes
// (e.g. a downgrade) so quota enforcement can't lag behind the real plan.
function tierForPriceId(priceId: string | null): string | null {
  if (!priceId) return null;
  const priceToTier: Record<string, string> = {};
  if (process.env.STRIPE_PRICE_ANALYST) priceToTier[process.env.STRIPE_PRICE_ANALYST] = "analyst";
  if (process.env.STRIPE_PRICE_PRO) priceToTier[process.env.STRIPE_PRICE_PRO] = "pro";
  if (process.env.STRIPE_PRICE_STUDIO) priceToTier[process.env.STRIPE_PRICE_STUDIO] = "studio";
  return priceToTier[priceId] ?? null;
}

async function sendResendEmail(payload: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "CapraStarter <noreply@caprastarter.com>";
  if (!apiKey) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [payload.to], subject: payload.subject, html: payload.html, text: payload.text }),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    // Only a genuine signature mismatch is the caller's fault (400). Anything else
    // — e.g. an empty STRIPE_SECRET_KEY crashing Stripe client construction — is OUR
    // misconfiguration; surface it as a 500 with a truthful log instead of masking
    // it as "Invalid signature" (which once sent us on a long false chase).
    if ((err as { type?: string })?.type === "StripeSignatureVerificationError") {
      console.error("[stripe/webhook] signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.error(
      "[stripe/webhook] NON-SIGNATURE failure — likely misconfiguration (check STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are set):",
      err,
    );
    return NextResponse.json({ error: "Webhook handler misconfigured" }, { status: 500 });
  }

  // Mode consistency: the event's mode must match the mode of the key this
  // deployment is configured with. A mismatch means the event belongs to the
  // other Stripe mode entirely — a test-mode event reaching a live deployment
  // would write test data into production tables and grant a real paid tier off
  // a fake purchase (observed fleet-wide, 2026-08-01). Test-keyed deployments
  // are legitimate pre-launch, so test events are only wrong where the key is
  // live; the check is symmetric rather than a blanket test-mode rejection.
  // Acknowledged with 200 and dropped: a mode mismatch is a standing
  // misconfiguration, and a non-2xx would have Stripe retrying it for days.
  const configuredLive = (process.env.STRIPE_SECRET_KEY ?? "").match(/^(sk|rk)_live_/) !== null;
  if (event.livemode !== configuredLive) {
    console.error(
      "[stripe/webhook] livemode mismatch — event ignored:",
      JSON.stringify({
        event_id: event.id,
        type: event.type,
        event_livemode: event.livemode,
        configured_livemode: configuredLive,
      }),
    );
    return NextResponse.json({ received: true, ignored: "livemode-mismatch" });
  }

  // App ownership gate: runs after signature verification and before any DB
  // write or email. Foreign and unstamped events get a 200 so Stripe never
  // retries them — returning an error here would only build a retry queue of
  // events that were never ours.
  if (GATED_EVENT_FAMILIES.some((family) => event.type.startsWith(family))) {
    const app = appKeyForEvent(event);
    if (app !== APP_KEY) {
      if (app === undefined) {
        console.log("stripe_webhook_unstamped:", JSON.stringify({ event_id: event.id, type: event.type }));
      } else {
        console.log("[stripe/webhook] ignoring event stamped for another app:", event.type, event.id);
      }
      return NextResponse.json({ received: true });
    }
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ?? session.client_reference_id;
      const tier = session.metadata?.tier ?? "analyst";
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

      if (!userId || !customerId) {
        console.warn("[stripe/webhook] checkout.session.completed missing user_id or customer:", session.id);
        break;
      }

      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        tier,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) {
        console.error("[stripe/webhook] failed to record subscription:", error.message);
      } else {
        console.log("[stripe/webhook] subscription recorded:", { userId, tier });
        const email = session.customer_email ?? session.customer_details?.email;
        if (email) {
          const label = TIER_LABELS[tier] ?? tier;
          await sendResendEmail({
            to: email,
            subject: `You're on CapraStarter ${label}`,
            html: `<p>Thanks for subscribing! You're now on the CapraStarter ${label} plan.</p><p><a href="https://www.caprastarter.com/">Open CapraStarter</a></p>`,
            text: `Thanks for subscribing! You're now on the CapraStarter ${label} plan. Open CapraStarter: https://www.caprastarter.com/`,
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const rawPeriodEnd = (sub as unknown as Record<string, unknown>).current_period_end;
      const currentPeriodEnd = typeof rawPeriodEnd === "number"
        ? new Date(rawPeriodEnd * 1000).toISOString()
        : null;

      const mappedTier = tierForPriceId(priceId);

      // Bookkeeping columns written on every status branch.
      const base = {
        stripe_price_id: priceId,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      };

      // This event fires on EVERY attribute change — including transitions into
      // delinquency — so tier may only be (re)granted when the sub is genuinely
      // in good standing AND the price maps to a known tier.
      let payload: Record<string, unknown>;
      if (sub.status === "active" || sub.status === "trialing") {
        if (mappedTier) {
          // Good standing + mapped price: keep tier aligned with the current
          // price so portal plan changes and past_due recovery both land.
          payload = { ...base, tier: mappedTier, status: sub.status };
        } else {
          // Unmapped price (missing STRIPE_PRICE_* env or legacy price):
          // sync status only — never grant, never downgrade.
          console.warn("[stripe/webhook] unmapped price on active subscription:", priceId, sub.id);
          payload = { ...base, status: sub.status };
        }
      } else if (sub.status === "past_due") {
        // Retries still in flight: keep tier (grace), record the state.
        payload = { ...base, status: "past_due" };
      } else if (
        sub.status === "unpaid" ||
        sub.status === "canceled" ||
        sub.status === "incomplete_expired"
      ) {
        // Lapsed: revoke to free.
        payload = { ...base, tier: "free", status: "canceled" };
      } else {
        // incomplete / paused: record the state only, never a downgrade.
        payload = { ...base, status: sub.status };
      }

      // UPDATE-only, keyed by subscription id: this event can arrive before
      // checkout.session.completed, and an insert here would create a
      // user_id-less orphan row that then blocks checkout's user_id-keyed
      // upsert. Checkout owns row creation; this handler only syncs it.
      const { error } = await supabase.from("subscriptions")
        .update(payload)
        .eq("stripe_subscription_id", sub.id);

      if (error) console.error("[stripe/webhook] subscription update failed:", error.message);
      else console.log("[stripe/webhook] subscription updated:", sub.id, sub.status);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabase.from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);

      if (error) console.error("[stripe/webhook] subscription cancellation failed:", error.message);
      else console.log("[stripe/webhook] subscription canceled:", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      // Newer API versions carry the invoice's subscription under
      // parent.subscription_details; older payloads have a top-level
      // inv.subscription. Either may be a string id or an expanded object.
      const rawSub =
        inv.parent?.subscription_details?.subscription ??
        (inv as unknown as { subscription?: string | { id: string } }).subscription;
      const subId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;

      // No subscription id => one-off invoice, nothing to touch. A failed
      // FIRST invoice of a brand-new sub (subscription_create) has nothing to
      // revoke either — tier is only granted via checkout success — and the
      // customer may hold a separate healthy subscription.
      if (!subId || inv.billing_reason === "subscription_create") {
        console.warn("[stripe/webhook] payment failed (no subscription action):", inv.id);
        break;
      }

      // Keyed by the failing subscription (never by customer) so unrelated
      // invoices can't cross-hit a healthy plan. next_payment_attempt is null
      // once dunning is exhausted — final failure revokes to free; earlier
      // attempts just mark past_due while retries continue (tier keeps grace).
      const isFinalFailure = inv.next_payment_attempt == null;
      const { error } = await supabase.from("subscriptions")
        .update(
          isFinalFailure
            ? { tier: "free", status: "canceled", updated_at: new Date().toISOString() }
            : { status: "past_due", updated_at: new Date().toISOString() }
        )
        .eq("stripe_subscription_id", subId);

      if (error) console.error("[stripe/webhook] payment-failure update failed:", error.message);
      else console.warn("[stripe/webhook] payment failed:", inv.id, subId, isFinalFailure ? "final" : "retrying");
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
