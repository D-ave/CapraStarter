import { NextRequest, NextResponse } from "next/server";
import { dbInsert, isConfigured } from "@/lib/supabase";

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + Math.random().toString(36).slice(2, 7);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { brandName, industry, keywords, vibe, kit, source, capraseedIdea } = body;
  if (!brandName || !kit) return NextResponse.json({ error: "brandName and kit required" }, { status: 400 });

  if (!isConfigured()) {
    // No Supabase — return a local-only response so the UI still works
    return NextResponse.json({ saved: false, reason: "Supabase not configured" });
  }

  try {
    const row = await dbInsert("brand_kits", {
      brand_name: brandName,
      industry: industry ?? null,
      keywords: keywords ?? null,
      vibe: vibe ?? null,
      kit,
      slug: makeSlug(brandName),
      source: source ?? "caprastarter",
      capraseed_idea: capraseedIdea ?? null,
    });
    return NextResponse.json({ saved: true, id: row.id, slug: row.slug });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Save failed" }, { status: 500 });
  }
}
