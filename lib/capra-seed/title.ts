// ─── CapraSeed Report Title Derivation ───────────────────────────────────────
// Derives a short, readable display title for a saved report.
// Priority: AI-generated tagline from overview section → clean extract from idea text.

/**
 * Returns a short display title for a report (roughly 2–6 words / ≤ 50 chars).
 *
 * @param idea     - The raw venture concept text entered by the user.
 * @param tagline  - Optional AI-generated tagline from the overview section.
 */
export function deriveTitle(idea: string, tagline?: string): string {
  // Prefer the AI-generated tagline when it's short enough to be a clean title
  if (tagline && tagline.length >= 4 && tagline.length <= 55) {
    return tagline.replace(/[.!?,;]+$/, "").trim();
  }

  // Fallback: extract a short noun phrase from the raw idea
  const text = idea
    .trim()
    .replace(/^(an?|the)\s+/i, "")            // strip leading articles
    .replace(/[,—–\-]\s.*$/, "")              // strip at punctuation breaks
    .replace(/\s+(that|which|for|to|by|using|with|powered|based)\s+.*$/i, ""); // strip trailing clauses

  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 5);

  if (words.length === 0) {
    // Last resort: just truncate the raw idea
    return idea.slice(0, 40).trim();
  }

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
