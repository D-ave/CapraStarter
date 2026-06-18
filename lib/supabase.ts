const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BASE = `${SUPABASE_URL}/rest/v1`;

function headers() {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
  };
}

export async function dbInsert(table: string, row: Record<string, unknown>) {
  const res = await fetch(`${BASE}/${table}`, {
    method: "POST",
    headers: { ...headers(), "Prefer": "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function dbSelect(table: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ select: "*", order: "created_at.desc", ...params });
  const res = await fetch(`${BASE}/${table}?${qs}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function isConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
