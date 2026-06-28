import BaseCard from "./BaseCard";
import styles from "./OverviewCard.module.css";
import type { OverviewData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: OverviewData;
}

export default function OverviewCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Overview"
      icon="✦"
      accentColor="linear-gradient(90deg, var(--accent), var(--accent2))"
      status={status}
    >
      {data && (
        <div className={styles.overview}>
          <h2 className={styles.tagline}>{data.tagline}</h2>
          <p className={styles.description}>{data.description}</p>
          <div className={styles.grid}>
            <div className={styles.item}>
              <span className={styles.label}>Target Audience</span>
              <span className={styles.value}>{data.targetAudience}</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Value Proposition</span>
              <span className={styles.value}>{data.valueProp}</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Business Model</span>
              <span className={styles.value}>{data.businessModel}</span>
            </div>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
