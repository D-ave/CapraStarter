import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CAPRADESK_URL = (process.env.CAPRADESK_BASE_URL ?? "https://www.capradesk.com/api/v1").replace(/\/$/, "");
const CAPRADESK_KEY = process.env.CAPRADESK_API_KEY ?? "";
const PREFIX = "[CapraStarter Support]";
const PRODUCT = "CapraStarter";

async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!CAPRADESK_KEY) return NextResponse.json({ tickets: [] });

  try {
    const url = `${CAPRADESK_URL}/tickets?customer_email=${encodeURIComponent(user.email)}&title_prefix=${encodeURIComponent(PREFIX)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${CAPRADESK_KEY}` } });
    if (!res.ok) return NextResponse.json({ tickets: [] });
    const data = await res.json();
    const tickets = (data.tickets ?? []).map((t: Record<string, unknown>) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      title: String(t.title ?? "").replace(/^\[CapraStarter Support\]\s*/, ""),
      status: t.status,
      priority: t.priority,
      created_at: t.created_at,
    }));
    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ tickets: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!CAPRADESK_KEY) return NextResponse.json({ error: "Support system not configured" }, { status: 503 });

  const body = await req.json();
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "General";
  if (!subject || !message) return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });

  try {
    const res = await fetch(`${CAPRADESK_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${CAPRADESK_KEY}` },
      body: JSON.stringify({
        title: `${PREFIX} ${subject}`,
        description: `**Product:** ${PRODUCT}\n**From:** ${user.email}\n**Category:** ${category}\n\n${message}`,
        priority: "medium",
        customer_email: user.email,
        triage_state: "ai_handling",
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "Failed to submit request" }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Failed to reach support system" }, { status: 502 });
  }
}
