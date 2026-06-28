import BaseCard from "./BaseCard";
import styles from "./CostsCard.module.css";
import type { CostsData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: CostsData;
}

export default function CostsCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Startup Cost Estimates"
      icon="◫"
      accentColor="linear-gradient(90deg, var(--success), #7b5ea7)"
      status={status}
    >
      {data && (
        <div className={styles.costs}>
          <p className={styles.heuristicNote}>
            ⚠ These are rough estimates only — actual costs will vary by location, supplier, and circumstances
          </p>

          <div className={styles.summary}>
            <div className={styles.range}>
              <span className={styles.rangeLabel}>Estimated Range</span>
              <span className={styles.rangeValue}>{data.estimatedRange}</span>
              <span className={styles.currency}>{data.currency}</span>
            </div>
            <p className={styles.summaryText}>{data.summary}</p>
          </div>

          <div className={styles.categories}>
            {data.categories.map((cat, i) => (
              <div key={i} className={styles.category}>
                <div className={styles.catHeader}>
                  <span className={styles.catName}>{cat.name}</span>
                  <span className={styles.catCost}>{cat.estimatedCost}</span>
                </div>
                <p className={styles.catNotes}>{cat.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </BaseCard>
  );
}
