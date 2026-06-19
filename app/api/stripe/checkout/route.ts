import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICES, PRICE_MODES } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const tier = req.nextUrl.searchParams.get("tier") ?? "";
  const priceId = PRICES[tier];
  const mode = PRICE_MODES[tier] ?? "subscription";

  if (!priceId) {
    return NextResponse.redirect(new URL("/#pricing", req.url));
  }

  const origin = process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
  });

  return NextResponse.redirect(session.url!);
}
