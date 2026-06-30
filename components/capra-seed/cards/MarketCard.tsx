import BaseCard from "./BaseCard";
import styles from "./MarketCard.module.css";
import { stripCites } from "@/lib/capra-seed/utils";
import type { MarketData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: MarketData;
}

export default function MarketCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Market Analysis"
      icon="◎"
      accentColor="linear-gradient(90deg, var(--accent2), #7b5ea7)"
      status={status}
    >
      {data && (
        <div className={styles.market}>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Market Size (TAM)</span>
              <span className={styles.metricValue}>{data.marketSize}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>CAGR</span>
              <span className={styles.metricValue}>{data.cagr}</span>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Key Trends</span>
            <div className={styles.trends}>
              {[data.trend1, data.trend2, data.trend3].map((trend, i) => (
                <div key={i} className={styles.trend}>
                  <div className={styles.trendDot} />
                  <span>{stripCites(trend)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Opportunity</span>
            <div className={styles.insight}>{stripCites(data.opportunity)}</div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Key Challenge</span>
            <div className={`${styles.insight} ${styles.insightNeg}`}>
              {stripCites(data.challenge)}
            </div>
          </div>

          <p className={styles.footnote}>Model-estimated — verify with primary research</p>
        </div>
      )}
    </BaseCard>
  );
}
