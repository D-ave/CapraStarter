import { NextRequest, NextResponse } from "next/server";
import { analyzeSection } from "@/lib/capra-seed/claude";
import { createClient } from "@/lib/supabase/server";
import type { SectionId, CapraSeedRequestV1 } from "@/types/capra-seed";

const VALID_SECTIONS: SectionId[] = [
  "overview", "website", "market", "revenue",
  "competitors", "pricing", "swot",
  "regions", "costs", "equipment", "legal",
  "action",
];

const TIER_LIMITS: Record<string, number> = {
  free: 1,
  analyst: 10,
  pro: 9999,
  studio: 9999,
};

// In-memory sliding-window rate limiter: 30 requests/min per IP.
// Single-instance only — for multi-instance deployments swap for Redis/KV.
const _rateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const WINDOW_MS = 60_000;
  const LIMIT = 30;
  const entry = _rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    _rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

async function getUserTier(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data?.tier ?? "free";
}

async function getMonthlyReportCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());
  return count ?? 0;
}

export async function POST(request: NextRequest) {
  // Per-IP rate limit check
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests — please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: Partial<CapraSeedRequestV1>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { section, idea, targetAudience, region, tone, pricingPreference } = body;

  if (!section || !VALID_SECTIONS.includes(section as SectionId)) {
    return NextResponse.json(
      { error: `Missing or invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!idea || typeof idea !== "string" || !idea.trim()) {
    return NextResponse.json(
      { error: "Missing required field: idea" },
      { status: 400 }
    );
  }

  // Authentication is REQUIRED for every section — each section triggers an
  // Anthropic call on the shared API key, so no anonymous access is permitted.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  // Tier enforcement: apply the monthly report limit to every section.
  const tier = await getUserTier(user.id);
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  const count = await getMonthlyReportCount(user.id);
  if (count >= limit) {
    return NextResponse.json(
      { error: `Monthly report limit reached (${limit}). Upgrade your plan at /#pricing` },
      { status: 429 },
    );
  }

  try {
    const result = await analyzeSection({
      section: section as SectionId,
      idea: idea.trim(),
      targetAudience: targetAudience?.trim(),
      region: region?.trim(),
      tone: tone?.trim(),
      pricingPreference: pricingPreference?.trim(),
    });

    return NextResponse.json({ data: result.data, usage: result.usage });
  } catch (error) {
    console.error(`[CapraSeed] Section "${section}" analysis failed:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
