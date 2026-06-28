import type { SectionId } from "@/types/capra-seed";

// Sections that benefit from web search for grounded, current results.
export const SEARCH_ENABLED_SECTIONS: SectionId[] = [
  "market",
  "competitors",
  "regions",
  "legal",
];

export const SYSTEM_PROMPT = `You are a sharp, experienced startup analyst and business strategist.
You analyze venture concepts with clear-eyed realism, grounded market research, and actionable insights.
You always respond ONLY with valid JSON — no markdown, no backticks, no preamble, no explanation.
Your JSON must be parseable directly by JSON.parse().`;

interface PromptContext {
  idea: string;
  targetAudience?: string;
  region?: string;
  tone?: string;
  pricingPreference?: string;
}

function contextSuffix(ctx: PromptContext): string {
  const parts: string[] = [];
  if (ctx.targetAudience) parts.push(`Target audience: ${ctx.targetAudience}`);
  if (ctx.region) parts.push(`Region/market: ${ctx.region}`);
  if (ctx.tone) parts.push(`Tone preference: ${ctx.tone}`);
  if (ctx.pricingPreference) parts.push(`Pricing preference: ${ctx.pricingPreference}`);
  return parts.length ? `\n\nAdditional context:\n${parts.join("\n")}` : "";
}

export function getSectionPrompt(section: SectionId, ctx: PromptContext): string {
  const extra = contextSuffix(ctx);

  const prompts: Record<SectionId, string> = {
    overview: `Analyze this venture concept and respond ONLY with this exact JSON structure (no markdown, no backticks):
{"tagline":"...","description":"...","targetAudience":"...","valueProp":"...","businessModel":"..."}

venture concept: ${ctx.idea}${extra}

- tagline: A punchy 6-10 word tagline
- description: 2-3 sentence description of the business
- targetAudience: Specific primary customer segment
- valueProp: The unique value proposition in one sentence
- businessModel: How the business makes money`,

    website: `Design a landing page for this venture concept. Respond ONLY with this exact JSON (no markdown, no backticks):
{"brandName":"...","heroHeadline":"...","subheadline":"...","ctaText":"...","featureTitle1":"...","featureDesc1":"...","featureTitle2":"...","featureDesc2":"...","featureTitle3":"...","featureDesc3":"...","socialProof":"..."}

venture concept: ${ctx.idea}${extra}

- brandName: A catchy brand name (1-2 words)
- heroHeadline: Bold hero headline (5-8 words)
- subheadline: Supporting subheadline (10-15 words)
- ctaText: Call-to-action button text (2-4 words)
- featureTitle1/2/3: Short feature titles (2-4 words each)
- featureDesc1/2/3: Feature descriptions (10-15 words each)
- socialProof: A short social proof statement (e.g. "Join 2,000+ early adopters")`,

    market: `Research the market for this venture concept. Respond ONLY with this exact JSON (no markdown, no backticks):
{"marketSize":"...","cagr":"...","trend1":"...","trend2":"...","trend3":"...","opportunity":"...","challenge":"..."}

venture concept: ${ctx.idea}${extra}

- marketSize: Total addressable market size (e.g. "$4.2B")
- cagr: Compound annual growth rate (e.g. "18.5%")
- trend1/2/3: Key market trends driving growth (one sentence each)
- opportunity: The primary market opportunity (one sentence)
- challenge: The primary market challenge (one sentence)`,

    revenue: `Project revenue for this venture concept. Respond ONLY with this exact JSON (no markdown, no backticks):
{"year1Revenue":"...","year2Revenue":"...","year3Revenue":"...","breakEvenMonths":0,"avgRevenuePerUser":"...","keyAssumption":"..."}

venture concept: ${ctx.idea}${extra}

- year1/2/3Revenue: Projected annual revenue (e.g. "$120K", "$480K", "$1.2M")
- breakEvenMonths: Number of months to break even (integer)
- avgRevenuePerUser: Average revenue per user/customer per year (e.g. "$240")
- keyAssumption: The single most important assumption driving these numbers`,

    competitors: `Research real competitors for this venture concept. Respond ONLY with a JSON array (no markdown, no backticks):
[{"name":"...","description":"...","differentiator":"...","type":"Direct"}]

venture concept: ${ctx.idea}${extra}

Return 4-5 competitors. For each:
- name: Company name
- description: What they do (one sentence)
- differentiator: How this new venture would differentiate (one sentence)
- type: Must be exactly "Direct", "Indirect", or "Emerging"`,

    pricing: `Design a pricing strategy for this venture concept. Respond ONLY with this exact JSON (no markdown, no backticks):
{"model":"...","tiers":[{"name":"...","price":"...","period":"...","features":["..."]}],"rationale":"..."}

venture concept: ${ctx.idea}${extra}

- model: Pricing model name (e.g. "Freemium SaaS", "Usage-Based", "Subscription")
- tiers: Array of exactly 3 pricing tiers, ordered from free/cheapest to most expensive
  - name: Tier name (e.g. "Starter", "Pro", "Enterprise")
  - price: Price amount (e.g. "Free", "$29", "$99", "Custom")
  - period: Billing period (e.g. "/mo", "/mo", "/mo")
  - features: Array of 4-5 features included in this tier
- rationale: Why this pricing strategy makes sense (one sentence)`,

    swot: `Perform a SWOT analysis for this venture concept. Respond ONLY with this exact JSON (no markdown, no backticks):
{"strengths":["..."],"weaknesses":["..."],"opportunities":["..."],"threats":["..."]}

venture concept: ${ctx.idea}${extra}

Each array should have exactly 3-4 items. Be specific and actionable.`,

    regions: `Recommend the top 3 best countries or regions to launch this business. These are estimated suggestions only — not guaranteed facts. Respond ONLY with this exact JSON (no markdown, no backticks):
{"regions":[{"name":"...","reason":"...","marketFit":"high","easeOfEntry":"medium","riskLevel":"low"}]}

venture concept: ${ctx.idea}${extra}

Return exactly 3 region objects. For each:
- name: Country or region name (e.g. "France", "Germany", "Southeast Asia")
- reason: Why this region is recommended (2-3 sentences, note any relevant regulations or cultural fit)
- marketFit: Must be exactly "low", "medium", or "high"
- easeOfEntry: Must be exactly "low", "medium", or "high" (consider regulatory environment, competition, infrastructure)
- riskLevel: Must be exactly "low", "medium", or "high"
Label uncertainty — these are heuristic estimates, not guaranteed market research.`,

    costs: `Estimate the startup costs for this venture concept. These are rough estimates only — real costs will vary. Respond ONLY with this exact JSON (no markdown, no backticks):
{"estimatedRange":"...","currency":"EUR","summary":"...","categories":[{"name":"...","estimatedCost":"...","notes":"..."}]}

venture concept: ${ctx.idea}${extra}

- estimatedRange: Total range (e.g. "€2,000–€8,000")
- currency: Currency code (e.g. "EUR", "USD", "GBP")
- summary: One sentence overview of the cost profile
- categories: Array of 5-7 cost categories. Typical ones: tools/equipment, materials, workspace, licenses/insurance, marketing, transport/logistics, website/software. Include only relevant ones.
  - name: Category name
  - estimatedCost: Cost range (e.g. "€200–€500")
  - notes: Brief explanation of what drives this cost and how to minimise it
All figures are rough estimates — label them as such.`,

    equipment: `List the practical equipment and workspace requirements to launch this business. Focus on what is actually needed to start, not a wish list. Respond ONLY with this exact JSON (no markdown, no backticks):
{"required":["..."],"optional":["..."],"workspaceNeeds":["..."],"safetyNotes":["..."]}

venture concept: ${ctx.idea}${extra}

- required: Array of 4-8 items that are essential to operate (tools, machinery, vehicles, software, etc.)
- optional: Array of 3-5 items that would help but are not needed on day one
- workspaceNeeds: Array of 3-5 practical workspace requirements (size, power, ventilation, storage, etc.)
- safetyNotes: Array of 2-4 safety or handling considerations relevant to this business type`,

    legal: `Provide a general legal and compliance overview for launching this business. This is general guidance only — not legal advice. The reader must consult a qualified professional. Respond ONLY with this exact JSON (no markdown, no backticks):
{"summary":"...","registrations":["..."],"permits":["..."],"compliance":["..."],"insurance":["..."],"taxNotes":["..."],"disclaimer":"..."}

venture concept: ${ctx.idea}${extra}

- summary: 2-3 sentence overview of the main legal considerations
- registrations: Array of 3-5 typical business registration steps (e.g. company formation, trade register)
- permits: Array of 2-4 permits or licences that may be required for this type of business
- compliance: Array of 3-5 regulatory or standards compliance areas (e.g. product safety, labelling, data protection)
- insurance: Array of 2-4 insurance types typically needed
- taxNotes: Array of 2-3 key tax considerations (VAT, income tax, etc.)
- disclaimer: A short disclaimer stating this is general guidance only and not legal advice — always consult a qualified professional`,

    action: `Create a go-to-market action plan for this venture concept. Respond ONLY with a JSON array (no markdown, no backticks):
[{"step":"...","phase":"..."}]

venture concept: ${ctx.idea}${extra}

Return exactly 8-10 action items. Phase must be one of: "Week 1-2", "Week 3-4", "Month 2", "Month 3"
Each step should be specific and actionable (e.g. "Set up landing page with email capture", not "Start marketing")`,
  };

  return prompts[section];
}
