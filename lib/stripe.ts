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

// Proxy defers instantiation until first use inside a request handler
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop: string | symbol) {
    return Reflect.get(getClient(), prop);
  },
});

export const PRICES: Record<string, string | undefined> = {
  export: process.env.STRIPE_PRICE_EXPORT,
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

export const PRICE_MODES: Record<string, "payment" | "subscription"> = {
  export: "payment",
  pro: "subscription",
  agency: "subscription",
};
