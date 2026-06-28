"use client";

import { useState } from "react";
import styles from "./UsageSummaryPanel.module.css";
import { formatCostUsd, formatTokens } from "@/lib/capra-seed/pricing";
import type { SectionId, SectionUsage } from "@/types/capra-seed";

interface Props {
  bySection: Partial<Record<SectionId, SectionUsage>>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
}

const SECTION_LABELS: Record<SectionId, string> = {
  overview:    "Overview",
  website:     "Website Copy",
  market:      "Market Analysis",
  revenue:     "Revenue Model",
  competitors: "Competitors",
  pricing:     "Pricing Strategy",
  swot:        "SWOT Analysis",
  regions:     "Target Regions",
  costs:       "Startup Costs",
  equipment:   "Equipment",
  legal:       "Legal & Compliance",
  action:      "Action Plan",
};

export default function UsageSummaryPanel({ bySection, totalInputTokens, totalOutputTokens, totalEstimatedCostUsd }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sections = Object.entries(bySection) as [SectionId, SectionUsage][];

  return (
    <div className={styles.panel}>
      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.label}>Tokens used</span>
          <span className={styles.value}>
            {formatTokens(totalInputTokens + totalOutputTokens)}
          </span>
          <span className={styles.sub}>
            {formatTokens(totalInputTokens)} in / {formatTokens(totalOutputTokens)} out
          </span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.label}>Estimated cost</span>
          <span className={`${styles.value} ${styles.cost}`}>
            {formatCostUsd(totalEstimatedCostUsd)}
          </span>
          <span className={styles.sub}>approximate</span>
        </div>
        {sections.length > 0 && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Hide" : "By section"} {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>

      {expanded && sections.length > 0 && (
        <div className={styles.breakdown}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Section</th>
                <th className={styles.th}>Model</th>
                <th className={styles.th}>Tokens</th>
                <th className={styles.th}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(([id, u]) => (
                <tr key={id} className={styles.row}>
                  <td className={styles.td}>{SECTION_LABELS[id] ?? id}</td>
                  <td className={`${styles.td} ${styles.mono}`}>{u.model.replace("claude-", "")}</td>
                  <td className={`${styles.td} ${styles.mono}`}>
                    {u.inputTokens != null ? formatTokens((u.inputTokens) + (u.outputTokens ?? 0)) : "—"}
                  </td>
                  <td className={`${styles.td} ${styles.mono}`}>
                    {u.estimatedCostUsd != null ? formatCostUsd(u.estimatedCostUsd) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
