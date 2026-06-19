import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
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
