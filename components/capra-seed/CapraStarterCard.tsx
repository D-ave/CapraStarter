import type { AnalysisState, ReportInputs } from "@/types/capra-seed";

interface Props {
  idea: string;
  state: AnalysisState;
  inputs?: ReportInputs;
}

const CAPRABRAND_URL = "https://caprabrand.com";

export default function CapraStarterCard({ idea, state, inputs }: Props) {
  const website = state.website.data;
  const overview = state.overview.data;

  const brandName = website?.brandName ?? "";
  const industry = inputs?.targetAudience ?? "";
  const vibe = inputs?.tone ?? "";

  const keywords = [
    overview?.businessModel,
    overview?.valueProp,
  ].filter(Boolean).join(", ").slice(0, 120);

  const params = new URLSearchParams();
  if (brandName)  params.set("brand", brandName);
  if (industry)   params.set("industry", industry);
  if (vibe)       params.set("vibe", vibe);
  if (keywords)   params.set("keywords", keywords);
  if (idea)       params.set("idea", idea.slice(0, 300));

  const url = `${CAPRABRAND_URL}/dashboard/brand-kit?${params.toString()}`;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(168,85,247,0.06) 100%)",
      border: "1px solid rgba(124,58,237,0.35)",
      borderRadius: 12,
      padding: "24px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>✦</span>
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--fg, #e8e8f0)" }}>
            Get your Brand Kit on CapraBrand
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted, #6b6b80)", maxWidth: 520, lineHeight: 1.6 }}>
          Generate colours, taglines, fonts, and a full brand strategy for{" "}
          <strong style={{ color: "var(--fg, #e8e8f0)" }}>{brandName || "your venture"}</strong>{" "}
          — pre-filled from this analysis, ready in seconds.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          color: "white", fontWeight: 700, fontSize: 15,
          padding: "12px 24px", borderRadius: 8,
          textDecoration: "none", whiteSpace: "nowrap",
          boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        Build Brand Kit →
      </a>
    </div>
  );
}
