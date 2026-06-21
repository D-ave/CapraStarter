import type { Metadata } from "next"
import Script from "next/script"
import { createClient } from "@/lib/supabase-server"
import "./globals.css"

export const metadata: Metadata = {
  title: "CapraStarter — AI Brand Kit Generator",
  description: "Generate a complete brand kit in seconds. Colors, taglines, fonts, and strategy — all powered by AI.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="container navbar-inner">
            <a href="/" className="navbar-brand">Capra<span>Starter</span></a>
            <div className="navbar-links">
              <a href="/#how-it-works" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "14px" }}>How it works</a>
              <a href="/#pricing" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "14px" }}>Pricing</a>
              {user ? (
                <a href="/dashboard" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "14px" }}>Dashboard</a>
              ) : (
                <a href="/login" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "14px" }}>Sign in</a>
              )}
            </div>
          </div>
        </nav>
        {children}
        <Script src="https://capralens.com/capralens.js" data-property="caprastarter" data-endpoint="https://capralens.com/api/capralens/collect" strategy="afterInteractive" />
      </body>
    </html>
  )
}
