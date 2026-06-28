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

  // Tier enforcement: check limits on the first section of each analysis
  if (section === "overview") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const tier = await getUserTier(user.id);
      const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
      const count = await getMonthlyReportCount(user.id);
      if (count >= limit) {
        return NextResponse.json(
          { error: `Monthly report limit reached (${limit}). Upgrade your plan at /#pricing` },
          { status: 429 },
        );
      }
    }
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
