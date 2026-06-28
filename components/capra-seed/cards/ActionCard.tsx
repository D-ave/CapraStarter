"use client";

import { useState } from "react";
import BaseCard from "./BaseCard";
import styles from "./ActionCard.module.css";
import type { ActionItem, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: ActionItem[];
}

const PHASES = ["Week 1-2", "Week 3-4", "Month 2", "Month 3"] as const;
type Phase = typeof PHASES[number];

const PHASE_NAME_CLASS: Record<Phase, string> = {
  "Week 1-2": styles.nameWeek12,
  "Week 3-4": styles.nameWeek34,
  "Month 2":  styles.nameMonth2,
  "Month 3":  styles.nameMonth3,
};

export default function ActionCard({ status, data }: Props) {
  // Week 1-2 open by default — the most immediately actionable phase
  const [openPhases, setOpenPhases] = useState<Set<Phase>>(
    new Set<Phase>(["Week 1-2"])
  );

  function togglePhase(phase: Phase) {
    setOpenPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  }

  return (
    <BaseCard
      title="Go-to-Market Action Plan"
      icon="→"
      accentColor="linear-gradient(90deg, var(--accent), var(--success))"
      status={status}
    >
      {data && data.length > 0 && (() => {
        // Group items by known phase, preserving global step numbers
        const byPhase = PHASES
          .map(phase => ({ phase, items: data.filter(i => i.phase === phase) }))
          .filter(g => g.items.length > 0);

        // Items with an unrecognised phase value (defensive — type should prevent this)
        const otherItems = data.filter(
          item => !(PHASES as readonly string[]).includes(item.phase)
        );

        // Pre-compute the global start index for each phase group
        let offset = 0;
        const groupsWithOffset = byPhase.map(g => {
          const start = offset;
          offset += g.items.length;
          return { ...g, start };
        });

        return (
          <div className={styles.phases}>
            {groupsWithOffset.map(({ phase, items, start }) => {
              const isOpen = openPhases.has(phase);
              return (
                <div key={phase} className={styles.phaseGroup}>
                  <button
                    type="button"
                    className={styles.phaseHeader}
                    onClick={() => togglePhase(phase)}
                    aria-expanded={isOpen}
                  >
                    <span className={`${styles.phaseName} ${PHASE_NAME_CLASS[phase]}`}>
                      {phase}
                    </span>
                    <span className={styles.phaseCount}>
                      {items.length} step{items.length !== 1 ? "s" : ""}
                    </span>
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <ol className={styles.list}>
                      {items.map((item, localIdx) => (
                        <li key={localIdx} className={styles.item}>
                          <span className={styles.number}>
                            {String(start + localIdx + 1).padStart(2, "0")}
                          </span>
                          <span className={styles.step}>{item.step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}

            {/* Fallback for any items outside the 4 known phases */}
            {otherItems.length > 0 && (
              <div className={styles.phaseGroup}>
                {otherItems.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <span className={styles.number}>{String(offset + i + 1).padStart(2, "0")}</span>
                    <span className={styles.step}>{item.step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </BaseCard>
  );
}
