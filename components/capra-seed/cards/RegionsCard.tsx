import BaseCard from "./BaseCard";
import styles from "./RegionsCard.module.css";
import { stripCites } from "@/lib/capra-seed/utils";
import type { RegionsData, RegionRecommendation, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: RegionsData;
}

const FIT_STYLE: Record<RegionRecommendation["marketFit"], string> = {
  low:    styles.low,
  medium: styles.medium,
  high:   styles.high,
};

function RatingPip({ level }: { level: "low" | "medium" | "high" }) {
  return (
    <span className={`${styles.pip} ${FIT_STYLE[level]}`}>
      {level}
    </span>
  );
}

export default function RegionsCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Recommended Launch Regions"
      icon="◉"
      accentColor="linear-gradient(90deg, #7b5ea7, var(--accent2))"
      status={status}
    >
      {data && data.regions && data.regions.length > 0 && (
        <div className={styles.wrapper}>
          <div className={styles.grid}>
            {data.regions.map((r, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <span className={styles.name}>{r.name}</span>
                </div>
                <p className={styles.reason}>{stripCites(r.reason)}</p>
                <div className={styles.ratings}>
                  <div className={styles.rating}>
                    <span className={styles.ratingLabel}>Market Fit</span>
                    <RatingPip level={r.marketFit} />
                  </div>
                  <div className={styles.rating}>
                    <span className={styles.ratingLabel}>Ease of Entry</span>
                    <RatingPip level={r.easeOfEntry} />
                  </div>
                  <div className={styles.rating}>
                    <span className={styles.ratingLabel}>Risk Level</span>
                    <RatingPip level={r.riskLevel} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.footnote}>Model-estimated — verify before committing to a region</p>
        </div>
      )}
    </BaseCard>
  );
}
