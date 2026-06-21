import { NextRequest, NextResponse } from "next/server"
import { stripe, PRICES, PRICE_MODES } from "@/lib/stripe"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const tier = req.nextUrl.searchParams.get("tier") ?? ""
  const priceId = PRICES[tier]
  const mode = PRICE_MODES[tier] ?? "subscription"

  if (!priceId) {
    return NextResponse.redirect(new URL("/#pricing", req.url))
  }

  const origin = process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      price_id: priceId,
      purchase_type: tier,
    },
    subscription_data: mode === "subscription" ? { metadata: { user_id: user.id } } : undefined,
  })

  return NextResponse.redirect(session.url!)
}
