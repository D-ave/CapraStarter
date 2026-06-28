// ─── CapraSeed LLM Layer ──────────────────────────────────────────────────────
// Server-side only. Uses native fetch to call the Anthropic Messages API
// without requiring @anthropic-ai/sdk in the studio package.json.
//
// TODO(integration): When @anthropic-ai/sdk is added to the main studio
// package.json, replace the raw fetch calls below with the SDK client:
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//   await client.messages.create(params) / client.beta.messages.create(params)

import { SYSTEM_PROMPT, SEARCH_ENABLED_SECTIONS, getSectionPrompt } from "./prompts";
import { getMockForSection } from "./mock";
import { estimateCostUsd } from "./pricing";
import type { SectionId, CapraSeedRequestV1, SectionUsage } from "@/types/capra-seed";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// ─── Model Tiers ─────────────────────────────────────────────────────────────

const HIGH_QUALITY_MODEL = "claude-sonnet-4-6";
const LOW_COST_MODEL = "claude-haiku-4-5-20251001";

const HIGH_QUALITY_SECTIONS: SectionId[] = ["overview", "website", "pricing"];

const MAX_TOKENS: Record<"high" | "low", number> = {
  high: 2048,
  low:  1024,
};

function getModelTier(section: SectionId): "high" | "low" {
  return HIGH_QUALITY_SECTIONS.includes(section) ? "high" : "low";
}

// ─── JSON Extraction ──────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  const firstBrace = Math.min(
    text.indexOf("{") === -1 ? Infinity : text.indexOf("{"),
    text.indexOf("[") === -1 ? Infinity : text.indexOf("[")
  );
  if (firstBrace > 0) text = text.slice(firstBrace);
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastBrace !== -1 && lastBrace < text.length - 1) text = text.slice(0, lastBrace + 1);
  return text;
}

function safeParse(raw: string, section: SectionId): unknown {
  try {
    return JSON.parse(extractJson(raw));
  } catch {
    if (section === "competitors" || section === "action") return [];
    if (section === "regions") return { regions: [] };
    if (section === "legal") {
      return { summary: "", registrations: [], permits: [], compliance: [], insurance: [], taxNotes: [], disclaimer: "" };
    }
    return { _error: true, _raw: raw.slice(0, 200) };
  }
}

// ─── Anthropic API Call ───────────────────────────────────────────────────────

interface CallOptions {
  userPrompt: string;
  model: string;
  maxTokens: number;
  useWebSearch: boolean;
}

interface CallResult {
  text: string;
  rawUsage: { input_tokens: number; output_tokens: number } | null;
}

async function callAnthropic({ userPrompt, model, maxTokens, useWebSearch }: CallOptions): Promise<CallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Set it in your environment to enable CapraSeed analysis.");
  }

  const body: {
    model: string;
    max_tokens: number;
    system: string;
    messages: { role: "user"; content: string }[];
    tools?: unknown[];
  } = {
    model,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  };

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  if (useWebSearch) {
    headers["anthropic-beta"] = "web-search-2025-03-05";
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  const res = await fetch(ANTHROPIC_API_URL, { method: "POST", headers, body: JSON.stringify(body) });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error");
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const json = await res.json();

  const content: { type: string; text?: string }[] = json.content ?? [];
  let text = "";
  for (const block of content) {
    if (block.type === "text" && block.text) { text = block.text; break; }
  }
  if (!text) throw new Error("No text content in Anthropic response");

  const rawUsage = (json.usage && typeof json.usage.input_tokens === "number")
    ? { input_tokens: json.usage.input_tokens as number, output_tokens: (json.usage.output_tokens ?? 0) as number }
    : null;

  return { text, rawUsage };
}

function buildUsage(model: string, rawUsage: { input_tokens: number; output_tokens: number } | null): SectionUsage {
  if (!rawUsage) return { model, inputTokens: null, outputTokens: null, estimatedCostUsd: null };
  return {
    model,
    inputTokens: rawUsage.input_tokens,
    outputTokens: rawUsage.output_tokens,
    estimatedCostUsd: estimateCostUsd(model, rawUsage.input_tokens, rawUsage.output_tokens),
  };
}

// ─── Public Interface ─────────────────────────────────────────────────────────

export interface AnalysisResult {
  data: unknown;
  usage: SectionUsage | null;
}

export async function analyzeSection(
  req: Pick<CapraSeedRequestV1, "section" | "idea" | "targetAudience" | "region" | "tone" | "pricingPreference">
): Promise<AnalysisResult> {
  const tier = getModelTier(req.section);
  const useWebSearch = SEARCH_ENABLED_SECTIONS.includes(req.section);
  const primaryModel = tier === "high" ? HIGH_QUALITY_MODEL : LOW_COST_MODEL;
  const primaryTokens = MAX_TOKENS[tier];

  const userPrompt = getSectionPrompt(req.section, {
    idea: req.idea,
    targetAudience: req.targetAudience,
    region: req.region,
    tone: req.tone,
    pricingPreference: req.pricingPreference,
  });

  console.log(`[CapraSeed] section="${req.section}" model=${primaryModel} max_tokens=${primaryTokens} webSearch=${useWebSearch}`);

  // Primary attempt
  try {
    const { text, rawUsage } = await callAnthropic({ userPrompt, model: primaryModel, maxTokens: primaryTokens, useWebSearch });
    return { data: safeParse(text, req.section), usage: buildUsage(primaryModel, rawUsage) };
  } catch (primaryErr) {
    // Low-cost model failed → retry with high-quality model
    if (tier === "low") {
      console.warn(`[CapraSeed] Low-cost model failed for "${req.section}" — falling back to ${HIGH_QUALITY_MODEL}:`,
        primaryErr instanceof Error ? primaryErr.message : primaryErr);
      try {
        const { text, rawUsage } = await callAnthropic({ userPrompt, model: HIGH_QUALITY_MODEL, maxTokens: MAX_TOKENS.high, useWebSearch });
        return { data: safeParse(text, req.section), usage: buildUsage(HIGH_QUALITY_MODEL, rawUsage) };
      } catch (fallbackErr) {
        console.warn(`[CapraSeed] Fallback also failed for "${req.section}" — returning mock:`,
          fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
        return { data: getMockForSection(req.section), usage: null };
      }
    }
    // High-quality model failed → mock
    console.warn(`[CapraSeed] Live analysis unavailable for "${req.section}" — returning mock:`,
      primaryErr instanceof Error ? primaryErr.message : primaryErr);
    return { data: getMockForSection(req.section), usage: null };
  }
}
