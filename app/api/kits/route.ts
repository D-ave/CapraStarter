import { NextResponse } from "next/server";
import { dbSelect, isConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isConfigured()) return NextResponse.json({ kits: [], configured: false });
  try {
    const kits = await dbSelect("brand_kits", { limit: "50" });
    return NextResponse.json({ kits, configured: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
