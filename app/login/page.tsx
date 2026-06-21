"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const supabase = createClient()

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
          })

    if (error) {
      setError(error.message)
    } else if (mode === "signup") {
      setMessage("Check your email to confirm your account.")
    } else {
      window.location.href = "/dashboard"
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {mode === "signin" ? "Welcome back to CapraStarter." : "Start generating brand kits."}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          className="btn btn-ghost"
          style={{ justifyContent: "center", gap: 10 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span className="muted" style={{ fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>EMAIL</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>PASSWORD</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "var(--alert)", margin: 0 }}>{error}</p>}
          {message && <p style={{ fontSize: 13, color: "var(--ok)", margin: 0 }}>{message}</p>}

          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }} disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", margin: 0 }}>
          {mode === "signin" ? "No account? " : "Already have one? "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage("") }}
            style={{ background: "none", border: "none", color: "var(--accent2)", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  )
}
