import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tier = req.nextUrl.searchParams.get("tier") ?? "";
  const priceId = PRICES[tier];

  if (!priceId) {
    return NextResponse.redirect(new URL("/#pricing", req.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const origin = process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { user_id: user.id, tier },
    customer_email: user.email ?? undefined,
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
  });

  return NextResponse.redirect(session.url!);
}
