import BaseCard from "./BaseCard";
import styles from "./CostsCard.module.css";
import { stripCites } from "@/lib/capra-seed/utils";
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
                <p className={styles.catNotes}>{stripCites(cat.notes)}</p>
              </div>
            ))}
          </div>
          <p className={styles.footnote}>Rough estimates — actual costs vary by location and supplier</p>
        </div>
      )}
    </BaseCard>
  );
}
