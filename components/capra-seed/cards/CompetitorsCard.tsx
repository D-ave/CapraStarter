import BaseCard from "./BaseCard";
import styles from "./CompetitorsCard.module.css";
import { stripCites } from "@/lib/capra-seed/utils";
import type { Competitor, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: Competitor[];
}

const TYPE_STYLE: Record<Competitor["type"], string> = {
  Direct: styles.direct,
  Indirect: styles.indirect,
  Emerging: styles.emerging,
};

export default function CompetitorsCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Competitive Landscape"
      icon="⊕"
      accentColor="linear-gradient(90deg, var(--accent3), var(--accent2))"
      status={status}
    >
      {data && data.length > 0 && (
        <div className={styles.wrapper}>
          <div className={styles.grid}>
            {data.map((c, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={`${styles.badge} ${TYPE_STYLE[c.type] ?? ""}`}>
                    {c.type}
                  </span>
                </div>
                <p className={styles.description}>{stripCites(c.description)}</p>
                <div className={styles.differentiator}>
                  <span className={styles.diffLabel}>Your edge</span>
                  <span>{stripCites(c.differentiator)}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.footnote}>Model-estimated — verify against current market reality</p>
        </div>
      )}
    </BaseCard>
  );
}
