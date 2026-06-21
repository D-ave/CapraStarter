"use client"

import { createClient } from "@/lib/supabase-client"

export default function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <button onClick={signOut} className="btn btn-ghost" style={{ fontSize: 14 }}>
      Sign out
    </button>
  )
}
