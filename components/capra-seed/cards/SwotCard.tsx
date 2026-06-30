import BaseCard from "./BaseCard";
import styles from "./SwotCard.module.css";
import { stripCites } from "@/lib/capra-seed/utils";
import type { SwotData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: SwotData;
}

const QUADRANTS = [
  { key: "strengths" as const,     label: "Strengths",    mod: "quad1" },
  { key: "weaknesses" as const,    label: "Weaknesses",   mod: "quad2" },
  { key: "opportunities" as const, label: "Opportunities",mod: "quad3" },
  { key: "threats" as const,       label: "Threats",      mod: "quad4" },
];

export default function SwotCard({ status, data }: Props) {
  return (
    <BaseCard
      title="SWOT Analysis"
      icon="⊞"
      accentColor="linear-gradient(90deg, #7b5ea7, var(--accent3))"
      status={status}
    >
      {data && (
        <div className={styles.grid}>
          {QUADRANTS.map(({ key, label, mod }) => (
            <div key={key} className={`${styles.quadrant} ${styles[mod]}`}>
              <span className={styles.quadLabel}>{label}</span>
              <ul className={styles.list}>
                {(data[key] ?? []).map((item, i) => (
                  <li key={i} className={styles.item}>
                    <span className={styles.bullet} />
                    {stripCites(item)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </BaseCard>
  );
}
