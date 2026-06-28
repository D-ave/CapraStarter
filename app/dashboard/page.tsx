import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import SignOutButton from "@/components/SignOutButton"

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <main style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
          Signed in as {user.email}
        </p>
        <p style={{ fontSize: 14, marginBottom: 20 }}>
          Brand kit generation has moved to{" "}
          <a href="https://caprabrand.com" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            CapraBrand
          </a>.
          This space is being prepared for something new.
        </p>
        <SignOutButton />
      </div>
    </main>
  )
}
