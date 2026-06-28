"use client";

import styles from "./ExecSummaryCard.module.css";
import type { AnalysisState } from "@/types/capra-seed";

interface Props {
  state: AnalysisState;
}

interface StatDef {
  label: string;
  value: string | null;
  accent: "gold" | "blue" | "green";
  loading: boolean;
}

function deriveStats(state: AnalysisState): StatDef[] {
  const market  = state.market.data;
  const revenue = state.revenue.data;
  const costs   = state.costs.data;
  const pricing = state.pricing.data;
  const regions = state.regions.data;

  const pricingAnchor =
    pricing?.tiers?.[0]
      ? `${pricing.tiers[0].price} / ${pricing.tiers[0].period}`
      : (pricing?.model ?? null);

  const bestRegion = regions?.regions?.[0]?.name ?? null;

  return [
    {
      label: "Market Size",
      value: market?.marketSize ?? null,
      accent: "blue",
      loading: state.market.status !== "done" && state.market.status !== "error",
    },
    {
      label: "Growth (CAGR)",
      value: market?.cagr ?? null,
      accent: "green",
      loading: state.market.status !== "done" && state.market.status !== "error",
    },
    {
      label: "Startup Cost",
      value: costs?.estimatedRange ?? null,
      accent: "gold",
      loading: state.costs.status !== "done" && state.costs.status !== "error",
    },
    {
      label: "Break-even",
      value: revenue ? `${revenue.breakEvenMonths} mo` : null,
      accent: "green",
      loading: state.revenue.status !== "done" && state.revenue.status !== "error",
    },
    {
      label: "Entry Price",
      value: pricingAnchor,
      accent: "blue",
      loading: state.pricing.status !== "done" && state.pricing.status !== "error",
    },
    {
      label: "Top Market",
      value: bestRegion,
      accent: "gold",
      loading: state.regions.status !== "done" && state.regions.status !== "error",
    },
  ];
}

export default function ExecSummaryCard({ state }: Props) {
  const stats = deriveStats(state);

  const topRisk   = state.swot.data?.threats?.[0] ?? null;
  const nextStep  = state.action.data?.find(a => a.phase === "Week 1-2")?.step
    ?? state.action.data?.[0]?.step ?? null;

  const riskLoading   = state.swot.status !== "done" && state.swot.status !== "error";
  const actionLoading = state.action.status !== "done" && state.action.status !== "error";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.badge}>Executive Summary</span>
        <span className={styles.hint}>Key facts across all analysis sections</span>
      </div>

      {/* Six stats at a glance */}
      <div className={styles.stats}>
        {stats.map((s, i) => (
          <div key={i} className={`${styles.stat} ${styles[s.accent]}`}>
            <span className={styles.statLabel}>{s.label}</span>
            {s.loading ? (
              <span className={styles.pulse} />
            ) : s.value ? (
              <span className={styles.statValue}>{s.value}</span>
            ) : (
              <span className={styles.statEmpty}>—</span>
            )}
          </div>
        ))}
      </div>

      {/* Risk + Next step */}
      <div className={styles.footer}>
        <div className={styles.footerCell}>
          <span className={styles.footerLabel}>Biggest Risk</span>
          {riskLoading && !topRisk ? (
            <span className={`${styles.pulse} ${styles.pulseFull}`} />
          ) : topRisk ? (
            <p className={`${styles.footerText} ${styles.riskText}`}>
              {topRisk.length > 110 ? topRisk.slice(0, 110) + "…" : topRisk}
            </p>
          ) : (
            <span className={styles.statEmpty}>—</span>
          )}
        </div>
        <div className={styles.footerCell}>
          <span className={styles.footerLabel}>Next Step — Week 1–2</span>
          {actionLoading && !nextStep ? (
            <span className={`${styles.pulse} ${styles.pulseFull}`} />
          ) : nextStep ? (
            <p className={styles.footerText}>
              {nextStep.length > 110 ? nextStep.slice(0, 110) + "…" : nextStep}
            </p>
          ) : (
            <span className={styles.statEmpty}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}
