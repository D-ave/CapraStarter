"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const BG     = "#0a0a0f";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED  = "rgba(255,255,255,0.45)";
const ACCENT = "#e8c547";

const chipStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600,
  background: BG, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: "5px 12px",
  textDecoration: "none", cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function UserNav() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  // Don't render until we know auth state — avoids flash
  if (user === undefined) return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav
      aria-label="User account"
      style={{
        position: "fixed", top: 12, right: 16, zIndex: 1000,
        display: "flex", gap: 6, alignItems: "center",
      }}
    >
      {user ? (
        <>
          <span style={{ ...chipStyle, cursor: "default", color: MUTED, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.email?.split("@")[0] ?? "Account"}
          </span>
          <a href="/api/stripe/portal" style={{ ...chipStyle, color: ACCENT }}>
            Billing
          </a>
          <a href="/support" style={{ ...chipStyle, color: MUTED }}>
            Support
          </a>
          <button onClick={handleSignOut} style={{ ...chipStyle, color: MUTED, border: `1px solid ${BORDER}` }}>
            Sign out
          </button>
        </>
      ) : (
        <a href="/login" style={{ ...chipStyle, color: MUTED }}>
          Sign in
        </a>
      )}
    </nav>
  );
}
