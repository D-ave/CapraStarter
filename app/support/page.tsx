"use client";

import { useState, useEffect, useCallback } from "react";

const BG = "#0a0a0f";
const SURFACE = "#0f0f16";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";
const TEXT = "rgba(255,255,255,0.92)";
const ACCENT = "#e8c547";
const OK = "#4ade80";
const ERR = "#f87171";

const CATEGORIES = ["General", "Billing", "Bug report", "Feature request", "Account", "API"];

const STATUS_COLOR: Record<string, string> = {
  open: "#4ade80",
  pending: "#f59e0b",
  resolved: "rgba(255,255,255,0.45)",
  closed: "rgba(255,255,255,0.3)",
};

type Ticket = {
  id: string;
  ticket_number: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? []);
      }
    } catch {
      /* non-critical */
    }
    setLoadingTickets(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send");
      } else {
        setSent(true);
        setSubject("");
        setMessage("");
        setCategory("General");
        fetchTickets();
      }
    } catch {
      setError("Network error — please try again");
    }
    setSending(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    color: TEXT,
    outline: "none",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, sans-serif" }}>
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "72px 24px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Support</h1>
        <p style={{ color: MUTED, marginBottom: 36, fontSize: 14 }}>
          Need help? Send us a message and we&apos;ll get back to you shortly.
        </p>

        {sent ? (
          <div
            style={{
              padding: "24px",
              background: "rgba(74,222,128,0.06)",
              border: `1px solid rgba(74,222,128,0.2)`,
              borderRadius: 12,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: OK }}>Message sent</h2>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>
              We&apos;ll respond to your email within 1 business day.
            </p>
            <button
              onClick={() => setSent(false)}
              style={{
                padding: "8px 18px",
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                color: TEXT,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                required
                rows={6}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {error && <p style={{ fontSize: 13, color: ERR, margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={sending || !subject.trim() || !message.trim()}
              style={{
                background: ACCENT,
                color: "#1a1500",
                border: "none",
                borderRadius: 9,
                padding: "12px 0",
                fontWeight: 700,
                fontSize: 14,
                cursor: sending || !subject.trim() || !message.trim() ? "not-allowed" : "pointer",
                opacity: sending || !subject.trim() || !message.trim() ? 0.55 : 1,
              }}
            >
              {sending ? "Sending…" : "Send message →"}
            </button>
          </form>
        )}

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.01em" }}>Your tickets</h2>

          {loadingTickets ? (
            <p style={{ color: MUTED, fontSize: 13 }}>Loading…</p>
          ) : tickets.length === 0 ? (
            <p style={{ color: MUTED, fontSize: 13 }}>No tickets yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ color: MUTED, fontWeight: 400, marginRight: 8 }}>#{ticket.ticket_number}</span>
                      {ticket.title}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                      {new Date(ticket.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: `${STATUS_COLOR[ticket.status] ?? MUTED}18`,
                      color: STATUS_COLOR[ticket.status] ?? MUTED,
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
