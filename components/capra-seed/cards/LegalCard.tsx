"use client";

import { useState } from "react";
import BaseCard from "./BaseCard";
import styles from "./LegalCard.module.css";
import type { LegalData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: LegalData;
}

function LegalList({ items, accentClass }: { items: string[]; accentClass?: string }) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} className={`${styles.item} ${accentClass ?? ""}`}>
          <span className={styles.bullet} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function LegalCard({ status, data }: Props) {
  const [expanded, setExpanded] = useState(false);

  const detailCount = data
    ? (data.registrations?.length ?? 0) +
      (data.permits?.length ?? 0) +
      (data.compliance?.length ?? 0) +
      (data.insurance?.length ?? 0)
    : 0;

  return (
    <BaseCard
      title="Legal & Compliance"
      icon="⊟"
      accentColor="linear-gradient(90deg, var(--accent3), #7b5ea7)"
      status={status}
    >
      {data && (
        <div className={styles.legal}>
          <div className={styles.notAdvice}>
            ⚠ General guidance only — not legal advice. Consult a qualified professional before making legal or tax decisions.
          </div>

          {/* Summary is always visible */}
          <p className={styles.summary}>{data.summary}</p>

          {/* Collapsed state: show item count and expand trigger */}
          {!expanded && (
            <button
              type="button"
              className={styles.expandToggle}
              onClick={() => setExpanded(true)}
            >
              Show full legal details
              <span className={styles.expandCount}>{detailCount} items</span>
            </button>
          )}

          {/* Expanded state: full 4-column grid + tax notes */}
          {expanded && (
            <>
              <div className={styles.grid}>
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Business Registration</span>
                  <LegalList items={data.registrations ?? []} />
                </div>

                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Permits & Licences</span>
                  <LegalList items={data.permits ?? []} />
                </div>

                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Compliance Areas</span>
                  <LegalList items={data.compliance ?? []} />
                </div>

                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Insurance</span>
                  <LegalList items={data.insurance ?? []} accentClass={styles.insurance} />
                </div>
              </div>

              {(data.taxNotes ?? []).length > 0 && (
                <div className={styles.taxSection}>
                  <span className={styles.sectionLabel}>Tax Notes</span>
                  <LegalList items={data.taxNotes ?? []} />
                </div>
              )}

              <button
                type="button"
                className={`${styles.expandToggle} ${styles.collapseToggle}`}
                onClick={() => setExpanded(false)}
              >
                ▲ Hide details
              </button>
            </>
          )}

          <div className={styles.disclaimer}>
            <span className={styles.disclaimerIcon}>§</span>
            <p>{data.disclaimer}</p>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
