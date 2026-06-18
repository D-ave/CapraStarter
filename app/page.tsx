"use client";

import { useState, useEffect } from "react";

interface ColorEntry { name: string; hex: string; use: string; }
interface Palette { name: string; description: string; colors: ColorEntry[]; }
interface BrandKit {
  palettes: Palette[];
  taglines: string[];
  logoConcept: string;
  fonts: { heading: { name: string; style: string }; body: { name: string; style: string } };
  personality: string[];
  targetAudience: string;
  brandVoice: string;
  competitors: string[];
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function ColorSwatch({ color }: { color: ColorEntry }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div onClick={copy} title={`Click to copy ${color.hex}`} style={{
      cursor: "pointer", borderRadius: 8, overflow: "hidden",
      border: "1px solid var(--border)", flex: "1 1 80px", minWidth: 80
    }}>
      <div style={{ height: 56, background: color.hex }} />
      <div style={{ padding: "8px 10px", background: "var(--surface2)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg)" }}>{color.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
          {copied ? "Copied!" : color.hex}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{color.use}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [selectedTagline, setSelectedTagline] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [capraseedIdea, setCapraseedIdea] = useState<string | null>(null);

  // Pre-fill from CapraSeed URL params: ?brand=X&industry=Y&vibe=Z&idea=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("brand")) setBrandName(p.get("brand")!);
    if (p.get("industry")) setIndustry(p.get("industry")!);
    if (p.get("vibe")) setVibe(p.get("vibe")!);
    if (p.get("keywords")) setKeywords(p.get("keywords")!);
    if (p.get("idea")) setCapraseedIdea(p.get("idea")!);
  }, []);

  async function generate() {
    if (!brandName.trim()) return;
    setLoading(true);
    setError("");
    setKit(null);
    try {
      const res = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, industry, keywords, vibe }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setKit(data);
      setSelectedPalette(0);
      setSelectedTagline(0);
      setSaveState("idle");
      // Auto-save to Supabase
      fetch("/api/save-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, industry, keywords, vibe, kit: data, capraseedIdea }),
      }).then(r => r.json()).then(d => { if (d.saved) setSaveState("saved"); }).catch(() => {});
      // Inject Google Fonts
      if (data.fonts?.heading?.name || data.fonts?.body?.name) {
        const families = [data.fonts.heading?.name, data.fonts.body?.name]
          .filter(Boolean)
          .map((n: string) => n.replace(/ /g, "+"))
          .join("&family=");
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@400;700;900&display=swap`;
        document.head.appendChild(link);
      }
    } catch {
      setError("Generation failed. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }

  const palette = kit?.palettes?.[selectedPalette];

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="badge" style={{ marginBottom: 20 }}>Powered by Claude AI</div>
          <h1 className="hero-title">
            Your brand kit,<br />
            <span className="gradient-text">ready in seconds.</span>
          </h1>
          <p className="hero-sub">
            Enter your brand name and a few details. Get colors, taglines, fonts, and a full brand strategy — instantly.
          </p>

          {/* Input form */}
          <div className="card" style={{ maxWidth: 580, margin: "0 auto", textAlign: "left" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                BRAND NAME *
              </label>
              <input
                className="input"
                placeholder="e.g. Luminary, NestPath, SwiftCart…"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generate()}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                  INDUSTRY
                </label>
                <input
                  className="input"
                  placeholder="e.g. Fintech, Health…"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                  VIBE
                </label>
                <input
                  className="input"
                  placeholder="e.g. Bold, Playful, Minimal…"
                  value={vibe}
                  onChange={e => setVibe(e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                KEYWORDS / VALUES
              </label>
              <input
                className="input"
                placeholder="e.g. trust, innovation, community, speed…"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
            </div>
            {error && <p style={{ color: "var(--alert)", fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "14px 20px" }}
              onClick={generate}
              disabled={loading || !brandName.trim()}
            >
              {loading ? "Generating your brand kit…" : "✦ Generate Brand Kit"}
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      {kit && (
        <section className="container" style={{ paddingBottom: 80 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
              Brand Kit for <span className="gradient-text">{brandName}</span>
            </h2>
            <p className="muted">Click any element to copy · Pick your favorites below</p>
          </div>

          <div className="kit-grid">
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Color Palettes */}
              <div className="card">
                <div className="section-title">Color Palettes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {kit.palettes.map((p, i) => (
                    <div
                      key={i}
                      className={`palette-card ${selectedPalette === i ? "active" : ""}`}
                      onClick={() => setSelectedPalette(i)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {p.colors.map((c, ci) => (
                            <div key={ci} style={{ width: 18, height: 18, borderRadius: 4, background: c.hex, border: "1px solid rgba(255,255,255,0.1)" }} />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{p.description}</p>
                    </div>
                  ))}
                </div>

                {palette && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
                      {palette.name.toUpperCase()} — SWATCHES
                    </div>
                    <div className="swatch-grid">
                      {palette.colors.map((c, i) => <ColorSwatch key={i} color={c} />)}
                    </div>
                  </div>
                )}
              </div>

              {/* Taglines */}
              <div className="card">
                <div className="section-title">Tagline Options</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {kit.taglines.map((t, i) => (
                    <button
                      key={i}
                      className={`tagline-btn ${selectedTagline === i ? "active" : ""}`}
                      onClick={() => setSelectedTagline(i)}
                    >
                      &ldquo;{t}&rdquo;
                    </button>
                  ))}
                </div>
                {kit.taglines[selectedTagline] && (
                  <button
                    style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => navigator.clipboard.writeText(kit.taglines[selectedTagline])}
                  >
                    Copy selected →
                  </button>
                )}
              </div>

              {/* Logo Concept */}
              <div className="card">
                <div className="section-title">Logo Concept Brief</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fg)" }}>{kit.logoConcept}</p>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Typography */}
              <div className="card">
                <div className="section-title">Typography</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>HEADING</div>
                    <div style={{ fontFamily: `"${kit.fonts.heading.name}", sans-serif`, fontSize: 26, fontWeight: 900, lineHeight: 1.2 }}>
                      {brandName}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--accent2)", marginTop: 4 }}>
                      {kit.fonts.heading.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{kit.fonts.heading.style}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>BODY</div>
                    <div style={{ fontFamily: `"${kit.fonts.body.name}", sans-serif`, fontSize: 15, lineHeight: 1.6, color: "var(--fg)" }}>
                      The quick brown fox jumps over the lazy dog.
                    </div>
                    <div style={{ fontSize: 13, color: "var(--accent2)", marginTop: 4 }}>
                      {kit.fonts.body.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{kit.fonts.body.style}</div>
                  </div>
                  <a
                    href={`https://fonts.google.com/?query=${encodeURIComponent(kit.fonts.heading.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13 }}
                  >
                    Browse on Google Fonts →
                  </a>
                </div>
              </div>

              {/* Brand Personality */}
              <div className="card">
                <div className="section-title">Brand Personality</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {kit.personality.map((w, i) => (
                    <span key={i} className="badge" style={{ color: "var(--accent2)", borderColor: "var(--accent)", fontSize: 13 }}>{w}</span>
                  ))}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>TARGET AUDIENCE</div>
                  <p style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.6, margin: 0 }}>{kit.targetAudience}</p>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>BRAND VOICE</div>
                  <p style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.6, margin: 0 }}>{kit.brandVoice}</p>
                </div>
              </div>

              {/* Competitors */}
              <div className="card">
                <div className="section-title">Competitive Landscape</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {kit.competitors.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                      <span style={{ color: "var(--muted)" }}>{i + 1}.</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="card" style={{ background: "rgba(124,58,237,0.08)", borderColor: "var(--accent)" }}>
                <div className="section-title">Next Steps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={() => window.print()}>
                    Print / Save as PDF
                  </button>
                  <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={generate} disabled={loading}>
                    ↻ Regenerate Kit
                  </button>
                  {saveState === "saved"
                    ? <span style={{ textAlign: "center", fontSize: 13, color: "var(--ok)" }}>✓ Saved to CapraStarter</span>
                    : saveState === "saving"
                    ? <span style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>Saving…</span>
                    : kit && (
                      <button className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={async () => {
                        setSaveState("saving");
                        const r = await fetch("/api/save-kit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandName, industry, keywords, vibe, kit, capraseedIdea }) });
                        const d = await r.json();
                        setSaveState(d.saved ? "saved" : "idle");
                      }}>
                        Save Kit
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {!kit && (
        <section id="how-it-works" style={{ padding: "60px 20px", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <h2 style={{ textAlign: "center", fontSize: "1.4rem", fontWeight: 800, marginBottom: 40 }}>
              How it works
            </h2>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Enter your brand</div>
                <p className="muted" style={{ fontSize: 14 }}>Name, industry, and the vibe you're going for.</p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>AI generates your kit</div>
                <p className="muted" style={{ fontSize: 14 }}>Claude AI creates 3 color palettes, 5 taglines, font pairs, and full strategy.</p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Pick and export</div>
                <p className="muted" style={{ fontSize: 14 }}>Click swatches to copy hex codes. Print to PDF. Done.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
