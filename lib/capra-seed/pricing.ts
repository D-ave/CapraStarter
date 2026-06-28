// ─── CapraSeed Cost Estimation ────────────────────────────────────────────────
// Local pricing table used to estimate USD cost from token counts.
// All values are approximate and subject to change. Always label output as
// "estimated" in the UI.
//
// Sources (approximate, as of 2025):
//   claude-sonnet-4-6:         $3.00 input / $15.00 output per million tokens
//   claude-haiku-4-5-20251001: $0.80 input / $4.00  output per million tokens

interface ModelPricing {
  inputPerMTok: number;   // USD per million input tokens
  outputPerMTok: number;  // USD per million output tokens
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-6":        { inputPerMTok: 3.00,  outputPerMTok: 15.00 },
  "claude-haiku-4-5-20251001": { inputPerMTok: 0.80,  outputPerMTok: 4.00  },
};

const FALLBACK_PRICING: ModelPricing = { inputPerMTok: 3.00, outputPerMTok: 15.00 };

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = MODEL_PRICING[model] ?? FALLBACK_PRICING;
  return (inputTokens * p.inputPerMTok + outputTokens * p.outputPerMTok) / 1_000_000;
}

/** Format a USD cost for display: "$0.0023" */
export function formatCostUsd(usd: number): string {
  if (usd < 0.0001) return "<$0.0001";
  if (usd < 0.01)   return `$${usd.toFixed(4)}`;
  if (usd < 1)      return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/** Format a token count for display: "12,340" */
export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}
