import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createReport as createFileReport, saveReport as saveFileReport, listReports as listFileReports } from "@/lib/capra-seed/storage";
import { createReport as createDbReport, saveReport as saveDbReport, listReports as listDbReports } from "@/lib/capra-seed/storage-db";
import { createClient } from "@/lib/supabase/server";
import type { AnalysisState, ReportInputs, ReportUsageSummary } from "@/types/capra-seed";

const SESSION_COOKIE = "capraseed_session";

function getSessionId(request: NextRequest): { id: string; isNew: boolean } {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9-]{16,96}$/.test(existing)) {
    return { id: existing, isNew: false };
  }
  return { id: randomUUID(), isNew: true };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const reports = await listDbReports(supabase, user.id);
    return NextResponse.json({ reports });
  }

  const session = getSessionId(request);
  const response = NextResponse.json({ reports: listFileReports(session.id) });
  if (session.isNew) {
    response.cookies.set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
  }
  return response;
}

export async function POST(request: NextRequest) {
  let body: { idea?: string; inputs?: ReportInputs; state?: AnalysisState; usage?: ReportUsageSummary };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { idea, inputs, state, usage } = body;

  if (!idea || typeof idea !== "string" || !idea.trim()) {
    return NextResponse.json({ error: "Missing required field: idea" }, { status: 400 });
  }
  if (!state || typeof state !== "object") {
    return NextResponse.json({ error: "Missing required field: state" }, { status: 400 });
  }
  if (!usage || typeof usage !== "object") {
    return NextResponse.json({ error: "Missing required field: usage" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const report = createDbReport({ idea: idea.trim(), inputs: inputs ?? {}, state, usage });
      await saveDbReport(supabase, user.id, report);
      return NextResponse.json({ report }, { status: 201 });
    }

    const session = getSessionId(request);
    const report = createFileReport({ idea: idea.trim(), inputs: inputs ?? {}, state, usage });
    saveFileReport(session.id, report);
    const response = NextResponse.json({ report }, { status: 201 });
    if (session.isNew) {
      response.cookies.set(SESSION_COOKIE, session.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
      });
    }
    return response;
  } catch (error) {
    console.error("[CapraSeed] Failed to save report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save report" },
      { status: 500 },
    );
  }
}
