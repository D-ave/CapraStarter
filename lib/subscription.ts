import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export type Plan = "free" | "export" | "pro" | "agency"

export interface Subscription {
  plan: Plan
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const supabase = serviceClient()
  const { data } = await supabase
    .from("caprastarter_subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return { plan: "free", status: "active", current_period_end: null, cancel_at_period_end: false }
  return data as Subscription
}

export async function getUserGenerationCount(userId: string): Promise<number> {
  const supabase = serviceClient()
  const { count } = await supabase
    .from("brand_kits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
  return count ?? 0
}

export const FREE_GENERATION_LIMIT = 1

export function canGenerate(plan: Plan, generationCount: number): boolean {
  if (plan === "pro" || plan === "agency") return true
  return generationCount < FREE_GENERATION_LIMIT
}
