import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
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
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : null;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const rawPeriodEnd = (sub as unknown as Record<string, unknown>).current_period_end;
      const currentPeriodEnd = typeof rawPeriodEnd === "number"
        ? new Date(rawPeriodEnd * 1000).toISOString()
        : null;

      if (!customerId) break;

      const { error } = await supabase.from("subscriptions").upsert({
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_subscription_id" });

      if (error) console.error("[stripe/webhook] subscription update failed:", error.message);
      else console.log("[stripe/webhook] subscription updated:", sub.id, sub.status);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabase.from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);

      if (error) console.error("[stripe/webhook] subscription cancellation failed:", error.message);
      else console.log("[stripe/webhook] subscription cancelled:", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : null;
      if (customerId) {
        await supabase.from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);
      }
      console.warn("[stripe/webhook] payment failed:", inv.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
