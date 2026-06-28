import Stripe from "stripe";

let _client: Stripe | null = null;
function getClient(): Stripe {
  if (!_client) {
    _client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _client;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop: string | symbol) {
    return Reflect.get(getClient(), prop);
  },
});

export const PRICES: Record<string, string | undefined> = {
  analyst: process.env.STRIPE_PRICE_ANALYST,
  pro: process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
};
