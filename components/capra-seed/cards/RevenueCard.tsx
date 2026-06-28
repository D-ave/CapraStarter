import BaseCard from "./BaseCard";
import styles from "./RevenueCard.module.css";
import type { RevenueData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: RevenueData;
}

export default function RevenueCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Revenue Projections"
      icon="◐"
      accentColor="linear-gradient(90deg, var(--success), var(--accent2))"
      status={status}
    >
      {data && (
        <div className={styles.revenue}>
          <p className={styles.heuristicNote}>
            ⚠ Projections are heuristic estimates — not financial advice
          </p>

          <div className={styles.projections}>
            {[
              { label: "Year 1", value: data.year1Revenue },
              { label: "Year 2", value: data.year2Revenue },
              { label: "Year 3", value: data.year3Revenue },
            ].map(({ label, value }) => (
              <div key={label} className={styles.year}>
                <span className={styles.yearLabel}>{label}</span>
                <span className={styles.yearValue}>{value}</span>
              </div>
            ))}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Break-even</span>
              <span className={styles.statValue}>{data.breakEvenMonths} mo</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Avg Rev / User</span>
              <span className={styles.statValue}>{data.avgRevenuePerUser}</span>
            </div>
          </div>

          <div className={styles.assumption}>
            <span className={styles.assumptionLabel}>Key Assumption</span>
            <p className={styles.assumptionText}>{data.keyAssumption}</p>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
