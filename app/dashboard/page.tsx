import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { getUserSubscription, getUserGenerationCount, FREE_GENERATION_LIMIT } from "@/lib/subscription"
import { dbSelect } from "@/lib/supabase"
import SignOutButton from "@/components/SignOutButton"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [subscription, generationCount] = await Promise.all([
    getUserSubscription(user.id),
    getUserGenerationCount(user.id),
  ])

  const kits = await dbSelect("brand_kits", {
    "user_id": `eq.${user.id}`,
    "order": "created_at.desc",
    "limit": "20",
  }).catch(() => [])

  const isPro = subscription.plan === "pro" || subscription.plan === "agency"
  const generationsLeft = isPro ? null : Math.max(0, FREE_GENERATION_LIMIT - generationCount)

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Your brand kits</h1>
          <p className="muted" style={{ fontSize: 14 }}>{user.email}</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>+ New kit</a>
          <SignOutButton />
        </div>
      </div>

      {/* Plan banner */}
      <div className="card" style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
            Current plan
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, textTransform: "capitalize" }}>
            {subscription.plan === "free" ? "Free" : subscription.plan}
            {isPro && <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ok)", marginLeft: 8 }}>✓ Active</span>}
          </div>
          {!isPro && (
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {generationsLeft === 0
                ? "Generation limit reached — upgrade to continue"
                : `${generationsLeft} free generation${generationsLeft === 1 ? "" : "s"} remaining`}
            </div>
          )}
        </div>
        {!isPro && (
          <a href="/api/stripe/checkout?tier=pro" className="btn btn-primary" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
            Upgrade to Pro
          </a>
        )}
      </div>

      {/* Kits grid */}
      {kits.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: 12 }}>✦</p>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No brand kits yet</p>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>Generate your first kit to see it here.</p>
          <a href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>Generate a kit</a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {kits.map((kit: Record<string, unknown>) => {
            const kitData = kit.kit as Record<string, unknown> | null
            const palette = Array.isArray(kitData?.palettes) ? kitData!.palettes[0] : null
            const colors = Array.isArray(palette?.colors) ? palette!.colors.slice(0, 5) : []
            return (
              <div key={kit.id as string} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {colors.map((c: Record<string, unknown>, i: number) => (
                    <div key={i} style={{ flex: 1, height: 32, borderRadius: 6, background: c.hex as string, border: "1px solid var(--border)" }} />
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{kit.brand_name as string}</div>
                  {kit.industry ? <div className="muted" style={{ fontSize: 13 }}>{String(kit.industry)}</div> : null}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {new Date(kit.created_at as string).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
