import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

export const runtime = "nodejs"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers.get("stripe-signature")

  if (!stripeKey || !webhookSecret || !sig) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const stripe = new Stripe(stripeKey)
  const rawBody = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error("[caprastarter.webhook] signature verification failed:", err)
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event)
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionUpsert(event)
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event)
    default:
      return NextResponse.json({ ok: true, ignored: true })
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.metadata?.user_id
  const purchaseType = session.metadata?.purchase_type
  const priceId = session.metadata?.price_id
  const isPaid = session.payment_status === "paid" || session.status === "complete"

  if (!userId || !priceId || !isPaid) {
    console.warn("[caprastarter.webhook] checkout.session.completed missing data, skipping")
    return NextResponse.json({ ok: true, ignored: true })
  }

  // Subscriptions are handled by subscription events
  if (purchaseType === "pro" || purchaseType === "agency") {
    return NextResponse.json({ ok: true, deferred: true })
  }

  // One-time export purchase
  if (purchaseType === "export") {
    const supabase = serviceClient()
    const { error } = await supabase.from("caprastarter_subscriptions").upsert(
      {
        user_id: userId,
        stripe_checkout_session_id: session.id,
        stripe_price_id: priceId,
        plan: "export",
        billing_cycle: "one_time",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_checkout_session_id" }
    )
    if (error) {
      console.error("[caprastarter.webhook] failed to record export purchase:", error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
    console.info("[caprastarter.webhook] recorded export purchase for user:", userId)
  }

  return NextResponse.json({ ok: true })
}

async function handleSubscriptionUpsert(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription
  const userId = sub.metadata?.user_id

  if (!userId) {
    console.warn("[caprastarter.webhook] subscription event missing user_id in metadata")
    return NextResponse.json({ ok: true, ignored: true })
  }

  const priceId = sub.items.data[0]?.price?.id ?? null
  const rawPeriodEnd = (sub as unknown as Record<string, unknown>).current_period_end
  const currentPeriodEnd = typeof rawPeriodEnd === "number"
    ? new Date(rawPeriodEnd * 1000).toISOString()
    : null
  const customerId = typeof sub.customer === "string" ? sub.customer : null

  // Map price ID to plan name
  const plan = priceId === process.env.STRIPE_PRICE_AGENCY ? "agency" : "pro"

  const supabase = serviceClient()
  const { error } = await supabase.from("caprastarter_subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan,
      billing_cycle: "subscription",
      status: sub.status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  )

  if (error) {
    console.error("[caprastarter.webhook] failed to upsert subscription:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  console.info("[caprastarter.webhook] upserted subscription:", sub.id, "plan:", plan, "status:", sub.status)
  return NextResponse.json({ ok: true })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription
  const supabase = serviceClient()

  const { error } = await supabase
    .from("caprastarter_subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)

  if (error) {
    console.error("[caprastarter.webhook] failed to cancel subscription:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  console.info("[caprastarter.webhook] cancelled subscription:", sub.id)
  return NextResponse.json({ ok: true })
}
