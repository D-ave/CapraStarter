import { NextRequest, NextResponse } from "next/server"
import { dbInsert, isConfigured } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + Math.random().toString(36).slice(2, 7)
}

export async function POST(req: NextRequest) {
  const { brandName, industry, keywords, vibe, kit, source, capraseedIdea } = await req.json()
  if (!brandName || !kit) return NextResponse.json({ error: "brandName and kit required" }, { status: 400 })

  if (!isConfigured()) {
    return NextResponse.json({ saved: false, reason: "Supabase not configured" })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const row = await dbInsert("brand_kits", {
      user_id: user?.id ?? null,
      brand_name: brandName,
      industry: industry ?? null,
      keywords: keywords ?? null,
      vibe: vibe ?? null,
      kit,
      slug: makeSlug(brandName),
      source: source ?? "caprastarter",
      capraseed_idea: capraseedIdea ?? null,
    })
    return NextResponse.json({ saved: true, id: row.id, slug: row.slug })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Save failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
