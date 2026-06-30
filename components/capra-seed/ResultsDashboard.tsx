"use client";

import { useState } from "react";
import styles from "./ResultsDashboard.module.css";
import OverviewCard from "./cards/OverviewCard";
import WebsiteCard from "./cards/WebsiteCard";
import MarketCard from "./cards/MarketCard";
import RevenueCard from "./cards/RevenueCard";
import CompetitorsCard from "./cards/CompetitorsCard";
import PricingCard from "./cards/PricingCard";
import SwotCard from "./cards/SwotCard";
import RegionsCard from "./cards/RegionsCard";
import CostsCard from "./cards/CostsCard";
import EquipmentCard from "./cards/EquipmentCard";
import LegalCard from "./cards/LegalCard";
import ActionCard from "./cards/ActionCard";
import UsageSummaryPanel from "./UsageSummaryPanel";
import BuilderHandoffCard from "./BuilderHandoffCard";
import CapraStarterCard from "./CapraStarterCard";
import ExecSummaryCard from "./ExecSummaryCard";
import SectionNav from "./SectionNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import type {
  AnalysisState,
  SectionId,
  SectionUsage,
  SaveState,
  ReportInputs,
} from "@/types/capra-seed";

interface Props {
  state: AnalysisState;
  progress: number;
  idea: string;
  onReset: () => void;
  inputs?: ReportInputs;
  usageBySection?: Partial<Record<SectionId, SectionUsage>>;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalEstimatedCostUsd?: number;
  saveState?: SaveState;
  onSave?: () => void;
  onViewSaved?: () => void;
}

/** Truncate idea to first N words for a short fallback title. */
function shortTitle(text: string, words = 8): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(" ") + "…";
}

/** Hard-truncate text to maxLen chars with trailing ellipsis. */
function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

export default function ResultsDashboard({
  state,
  progress,
  idea,
  onReset,
  inputs,
  usageBySection = {},
  totalInputTokens = 0,
  totalOutputTokens = 0,
  totalEstimatedCostUsd = 0,
  saveState = "idle",
  onSave,
  onViewSaved,
}: Props) {
  const isDone   = progress >= 100;
  const hasUsage = totalInputTokens > 0 || totalOutputTokens > 0;

  const [briefOpen, setBriefOpen] = useState(false);

  // Derive a short, meaningful report title from the AI overview when available.
  const reportTitle    = state.overview.data?.tagline ?? shortTitle(idea);
  const reportSubtitle = state.overview.data?.description
    ? truncateText(state.overview.data.description, 130)
    : null;

  function getSaveLabel() {
    if (saveState === "saving") return "Saving…";
    if (saveState === "saved")  return "Saved ✓";
    if (saveState === "error")  return "Save failed";
    return "Save Report";
  }

  return (
    <div className={styles.dashboard}>
      {/* Fixed progress bar */}
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-label="Analysis progress"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${styles.progressFill} ${isDone ? styles.done : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header — compact title + subtitle + collapsible original brief */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>CapraStarter</span>
          <h1 className={styles.title}>{reportTitle}</h1>
          {reportSubtitle && (
            <p className={styles.subtitle}>{reportSubtitle}</p>
          )}
          <button
            type="button"
            className={styles.briefToggle}
            onClick={() => setBriefOpen(v => !v)}
            aria-expanded={briefOpen}
          >
            {briefOpen ? "▲ hide brief" : "▼ original brief"}
          </button>
          {briefOpen && (
            <p className={styles.briefText}>{idea}</p>
          )}
        </div>
        <div className={styles.headerRight}>
          {isDone ? (
            <span className={styles.completeBadge} aria-live="polite">
              <span className={styles.dot} /> Complete
            </span>
          ) : (
            <span className={styles.analyzingBadge} aria-live="polite">
              <span className={styles.spinner} /> Analyzing…
            </span>
          )}
          {isDone && onSave && (
            <button
              type="button"
              className={`${styles.saveBtn} ${saveState === "saved" ? styles.saveBtnSaved : ""} ${saveState === "error" ? styles.saveBtnError : ""}`}
              onClick={onSave}
              disabled={saveState === "saving" || saveState === "saved"}
            >
              {getSaveLabel()}
            </button>
          )}
          {isDone && onViewSaved && (
            <button type="button" className={styles.viewSavedBtn} onClick={onViewSaved}>
              Saved Reports
            </button>
          )}
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            ← New Idea
          </button>
        </div>
      </header>

      {/* Sticky section navigation */}
      <SectionNav />

      {/* Usage panel — visible once complete */}
      {isDone && hasUsage && (
        <div className={styles.usageRow}>
          <UsageSummaryPanel
            bySection={usageBySection}
            totalInputTokens={totalInputTokens}
            totalOutputTokens={totalOutputTokens}
            totalEstimatedCostUsd={totalEstimatedCostUsd}
          />
        </div>
      )}

      {/* ── Main content grid ──────────────────────────────────────────────── */}
      <ErrorBoundary>
      <main className={styles.grid}>

        {/* ── SUMMARY — exec stats + business model overview ───────────────── */}
        <div id="section-summary" className={`${styles.sectionDivider} ${styles.sectionFirst}`}>
          <span className={styles.sectionLabel}>Summary</span>
        </div>
        <div className={styles.full}>
          <ExecSummaryCard state={state} />
        </div>
        <div className={styles.full}>
          <OverviewCard status={state.overview.status} data={state.overview.data} />
        </div>

        {/* ── MARKET — size, competitors, regions ──────────────────────────── */}
        <div id="section-market" className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>Market</span>
        </div>
        <div className={styles.half}>
          <MarketCard status={state.market.status} data={state.market.data} />
        </div>
        <div className={styles.half}>
          <RegionsCard status={state.regions.status} data={state.regions.data} />
        </div>
        <div className={styles.full}>
          <CompetitorsCard status={state.competitors.status} data={state.competitors.data} />
        </div>

        {/* ── FINANCIALS — revenue, pricing, costs ─────────────────────────── */}
        <div id="section-financials" className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>Financials</span>
        </div>
        <div className={styles.half}>
          <RevenueCard status={state.revenue.status} data={state.revenue.data} />
        </div>
        <div className={styles.half}>
          <PricingCard status={state.pricing.status} data={state.pricing.data} />
        </div>
        <div className={styles.full}>
          <CostsCard status={state.costs.status} data={state.costs.data} />
        </div>

        {/* ── OPERATIONS — equipment needs, legal & compliance ─────────────── */}
        <div id="section-ops" className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>Operations</span>
        </div>
        <div className={styles.full}>
          <EquipmentCard status={state.equipment.status} data={state.equipment.data} />
        </div>
        <div className={styles.full}>
          <LegalCard status={state.legal.status} data={state.legal.data} />
        </div>

        {/* ── WEBSITE — landing page preview + builder CTA ─────────────────── */}
        <div id="section-website" className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>Website</span>
        </div>
        <div className={styles.full}>
          <WebsiteCard status={state.website.status} data={state.website.data} />
        </div>
        {/* CapraStarter brand kit CTA — shows as soon as website section has data */}
        {state.website.data && (
          <div className={styles.full}>
            <CapraStarterCard idea={idea} state={state} inputs={inputs} />
          </div>
        )}
        {/* Builder handoff lives here — primary CTA adjacent to website preview */}
        {isDone && (
          <div className={styles.full}>
            <BuilderHandoffCard idea={idea} state={state} inputs={inputs} />
          </div>
        )}

        {/* ── LAUNCH — strategic assessment + go-to-market action plan ─────── */}
        <div id="section-launch" className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>Launch</span>
        </div>
        <div className={styles.full}>
          <SwotCard status={state.swot.status} data={state.swot.data} />
        </div>
        <div className={styles.full}>
          <ActionCard status={state.action.status} data={state.action.data} />
        </div>
      </main>
      </ErrorBoundary>
    </div>
  );
}
