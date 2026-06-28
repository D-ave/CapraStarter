"use client";

import { useState, useCallback } from "react";
import Hero from "@/components/capra-seed/Hero";
import ResultsDashboard from "@/components/capra-seed/ResultsDashboard";
import SavedReportsList from "@/components/capra-seed/SavedReportsList";
import type {
  AnalysisState,
  SectionId,
  SectionUsage,
  CapraSeedRequestV1,
  CapraSeedResponseV1,
  SaveState,
} from "@/types/capra-seed";

// Initial blank state for all sections
const BLANK_STATE: AnalysisState = {
  overview:     { status: "idle" },
  website:      { status: "idle" },
  market:       { status: "idle" },
  revenue:      { status: "idle" },
  competitors:  { status: "idle" },
  pricing:      { status: "idle" },
  swot:         { status: "idle" },
  regions:      { status: "idle" },
  costs:        { status: "idle" },
  equipment:    { status: "idle" },
  legal:        { status: "idle" },
  action:       { status: "idle" },
};

// Analysis runs in 7 parallel waves
const WAVES: SectionId[][] = [
  ["overview", "website"],    // Wave 1 — 0→20%
  ["market", "revenue"],      // Wave 2 — 20→38%
  ["competitors"],            // Wave 3 — 38→52%
  ["pricing", "swot"],        // Wave 4 — 52→65%
  ["regions", "costs"],       // Wave 5 — 65→78%
  ["equipment", "legal"],     // Wave 6 — 78→92%
  ["action"],                 // Wave 7 — 92→100%
];

const WAVE_PROGRESS = [20, 38, 52, 65, 78, 92, 100];

async function fetchSection(
  section: SectionId,
  params: Omit<CapraSeedRequestV1, "section">
): Promise<{ data: unknown; usage: SectionUsage | null }> {
  const res = await fetch("/api/capra-seed/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ section, ...params }),
  });
  const json: CapraSeedResponseV1 = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "Analysis failed");
  return { data: json.data, usage: json.usage ?? null };
}

function computeUsageTotals(bySection: Partial<Record<SectionId, SectionUsage>>) {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalEstimatedCostUsd = 0;
  for (const u of Object.values(bySection)) {
    if (!u) continue;
    totalInputTokens  += u.inputTokens  ?? 0;
    totalOutputTokens += u.outputTokens ?? 0;
    totalEstimatedCostUsd += u.estimatedCostUsd ?? 0;
  }
  return { totalInputTokens, totalOutputTokens, totalEstimatedCostUsd };
}

export default function CapraSeedPage() {
  const [phase, setPhase] = useState<"hero" | "results" | "saved-reports">("hero");
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<AnalysisState>(BLANK_STATE);
  const [currentIdea, setCurrentIdea] = useState("");
  const [currentInputs, setCurrentInputs] = useState<Omit<CapraSeedRequestV1, "section"> | null>(null);
  const [usageBySection, setUsageBySection] = useState<Partial<Record<SectionId, SectionUsage>>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const setSectionStatus = useCallback(
    (section: SectionId, status: "loading" | "done" | "error", data?: unknown) => {
      setState((prev) => ({
        ...prev,
        [section]: { status, ...(data !== undefined ? { data } : {}) },
      }));
    },
    []
  );

  const setSectionUsage = useCallback(
    (section: SectionId, usage: SectionUsage) => {
      setUsageBySection((prev) => ({ ...prev, [section]: usage }));
    },
    []
  );

  const runAnalysis = useCallback(
    async (params: Omit<CapraSeedRequestV1, "section">) => {
      setCurrentIdea(params.idea);
      setCurrentInputs(params);
      setProgress(0);
      setState(BLANK_STATE);
      setUsageBySection({});
      setSaveState("idle");
      setPhase("results");

      for (let waveIdx = 0; waveIdx < WAVES.length; waveIdx++) {
        const wave = WAVES[waveIdx];

        for (const section of wave) {
          setSectionStatus(section, "loading");
        }

        await Promise.all(
          wave.map(async (section) => {
            try {
              const { data, usage } = await fetchSection(section, params);
              setSectionStatus(section, "done", data);
              if (usage) setSectionUsage(section, usage);
            } catch {
              setSectionStatus(section, "error");
            }
          })
        );

        setProgress(WAVE_PROGRESS[waveIdx]);
      }
    },
    [setSectionStatus, setSectionUsage]
  );

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    try {
      const { totalInputTokens, totalOutputTokens, totalEstimatedCostUsd } =
        computeUsageTotals(usageBySection);

      const res = await fetch("/api/capra-seed/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea: currentIdea,
          inputs: {
            targetAudience: currentInputs?.targetAudience,
            region: currentInputs?.region,
            tone: currentInputs?.tone,
            pricingPreference: currentInputs?.pricingPreference,
          },
          state,
          usage: {
            bySection: usageBySection,
            totalInputTokens,
            totalOutputTokens,
            totalEstimatedCostUsd,
          },
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [currentIdea, currentInputs, state, usageBySection]);

  const handleOpenReport = useCallback(async (id: string) => {
    console.log(`[CapraSeed] Opening report: ${id}`);

    const res = await fetch(`/api/capra-seed/reports/${id}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = (errJson as { error?: string }).error ?? `Load failed (${res.status})`;
      console.error(`[CapraSeed] Report load error: ${msg}`);
      throw new Error(msg);
    }

    const json = await res.json();
    const report = json.report;

    // Reconstruct AnalysisState from saved sections
    const restored: AnalysisState = { ...BLANK_STATE };
    for (const key of Object.keys(report.sections ?? {}) as SectionId[]) {
      const s = report.sections[key];
      if (s) restored[key] = { status: s.status ?? "done", data: s.data };
    }

    // Reconstruct usage
    const savedUsage: Partial<Record<SectionId, SectionUsage>> =
      report.usage?.bySection ?? {};

    setCurrentIdea(report.idea ?? "");
    setCurrentInputs(report.inputs ?? null);
    setState(restored);
    setUsageBySection(savedUsage);
    setProgress(100);
    setSaveState("saved"); // already saved
    setPhase("results");
    console.log(`[CapraSeed] Report ${id} loaded successfully`);
  }, []);

  const handleReset = useCallback(() => {
    setPhase("hero");
    setProgress(0);
    setState(BLANK_STATE);
    setCurrentIdea("");
    setCurrentInputs(null);
    setUsageBySection({});
    setSaveState("idle");
  }, []);

  const handleViewSaved = useCallback(() => {
    setPhase("saved-reports");
  }, []);

  if (phase === "hero") {
    const PRICING_TIERS = [
      {
        name: "Free", price: "€0", period: "forever", highlight: false,
        features: ["1 venture analysis", "12-section blueprint", "Copy key insights", "Preview only — no export"],
        cta: "Start free", href: "/",
      },
      {
        name: "Analyst", price: "€19", period: "/mo", highlight: false,
        features: ["10 analyses / month", "PDF export full report", "Saved reports library", "Multi-region analysis"],
        cta: "Start Analyst", href: "/api/stripe/checkout?tier=analyst",
      },
      {
        name: "Pro", price: "€49", period: "/mo", highlight: true,
        features: ["Unlimited analyses", "All regions & tones", "Saved reports library", "PDF + CSV export", "Priority processing"],
        cta: "Start Pro", href: "/api/stripe/checkout?tier=pro",
      },
      {
        name: "Studio", price: "€149", period: "/mo", highlight: false,
        features: ["Everything in Pro", "Team accounts (5 seats)", "White-label reports", "API access", "Dedicated support"],
        cta: "Contact us", href: "/api/stripe/checkout?tier=studio",
      },
    ];

    const accent = "#e8c547";
    const bg = "#0a0a0f";
    const surface = "rgba(255,255,255,0.04)";
    const border = "rgba(255,255,255,0.08)";
    const muted = "rgba(255,255,255,0.45)";
    const ok = "#22c55e";

    return (
      <>
        <Hero onAnalyze={runAnalysis} onViewSaved={handleViewSaved} />

        {/* Pricing */}
        <section id="pricing" style={{ padding: "64px 24px 80px", borderTop: `1px solid ${border}`, background: bg }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 800, marginBottom: 10, color: "#fff", letterSpacing: "-0.02em" }}>
              Pricing
            </h2>
            <p style={{ textAlign: "center", color: muted, marginBottom: 48, fontSize: "0.95rem" }}>
              One analysis can change the whole trajectory of your venture.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
              {PRICING_TIERS.map((tier) => (
                <div key={tier.name} style={{
                  background: tier.highlight ? "rgba(232,197,71,0.07)" : surface,
                  border: `1px solid ${tier.highlight ? "rgba(232,197,71,0.35)" : border}`,
                  borderRadius: 14,
                  padding: "28px 22px",
                  display: "flex", flexDirection: "column", gap: 16,
                  position: "relative",
                }}>
                  {tier.highlight && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: accent, color: bg, fontSize: 11, fontWeight: 800, padding: "3px 14px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      Most popular
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{tier.name}</div>
                    <div style={{ color: "#fff", fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>
                      {tier.price}<span style={{ fontSize: "0.85rem", fontWeight: 500, color: muted }}>{tier.period}</span>
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.4 }}>
                        <span style={{ color: ok, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  {tier.href ? (
                    <a href={tier.href} style={{
                      background: tier.highlight ? accent : "transparent",
                      color: tier.highlight ? bg : "rgba(255,255,255,0.7)",
                      border: tier.highlight ? "none" : `1px solid ${border}`,
                      borderRadius: 9, padding: "10px 0", width: "100%",
                      fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                      textDecoration: "none", display: "block", textAlign: "center",
                    }}>
                      {tier.cta}
                    </a>
                  ) : (
                    <button style={{
                      background: tier.highlight ? accent : "transparent",
                      color: tier.highlight ? bg : "rgba(255,255,255,0.7)",
                      border: tier.highlight ? "none" : `1px solid ${border}`,
                      borderRadius: 9, padding: "10px 0", width: "100%",
                      fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}>
                      {tier.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer style={{ borderTop: `1px solid ${border}`, background: bg, padding: "20px 24px", textAlign: "center", fontSize: 13, color: muted }}>
          © {new Date().getFullYear()} CapraStarter · Powered by Claude AI
        </footer>
      </>
    );
  }

  if (phase === "saved-reports") {
    return <SavedReportsList onOpen={handleOpenReport} onBack={handleReset} />;
  }

  const { totalInputTokens, totalOutputTokens, totalEstimatedCostUsd } =
    computeUsageTotals(usageBySection);

  return (
    <ResultsDashboard
      state={state}
      progress={progress}
      idea={currentIdea}
      onReset={handleReset}
      inputs={{
        targetAudience: currentInputs?.targetAudience,
        region: currentInputs?.region,
        tone: currentInputs?.tone,
        pricingPreference: currentInputs?.pricingPreference,
      }}
      usageBySection={usageBySection}
      totalInputTokens={totalInputTokens}
      totalOutputTokens={totalOutputTokens}
      totalEstimatedCostUsd={totalEstimatedCostUsd}
      saveState={saveState}
      onSave={handleSave}
      onViewSaved={handleViewSaved}
    />
  );
}
