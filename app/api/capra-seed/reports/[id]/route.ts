import { NextRequest, NextResponse } from "next/server";
import { loadReport as loadFileReport } from "@/lib/capra-seed/storage";
import { loadReport as loadDbReport } from "@/lib/capra-seed/storage-db";
import { createClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "capraseed_session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const report = await loadDbReport(supabase, user.id, id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({ report });
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId || !/^[a-zA-Z0-9-]{16,96}$/.test(sessionId)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const report = loadFileReport(sessionId, id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ report });
}
