import BaseCard from "./BaseCard";
import styles from "./PricingCard.module.css";
import type { PricingData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: PricingData;
}

export default function PricingCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Pricing Strategy"
      icon="◇"
      accentColor="linear-gradient(90deg, var(--accent), #e07a5f)"
      status={status}
    >
      {data && (
        <div className={styles.pricing}>
          <div className={styles.modelRow}>
            <span className={styles.modelLabel}>Model</span>
            <span className={styles.modelName}>{data.model}</span>
          </div>

          <div className={styles.tiers}>
            {data.tiers.map((tier, i) => {
              const isRecommended = i === 1;
              return (
                <div
                  key={i}
                  className={`${styles.tier} ${isRecommended ? styles.recommended : ""}`}
                >
                  {isRecommended && (
                    <span className={styles.recommendedLabel}>Recommended</span>
                  )}
                  <div className={styles.tierHeader}>
                    <span className={styles.tierName}>{tier.name}</span>
                    <div className={styles.tierPrice}>
                      <span className={styles.price}>{tier.price}</span>
                      {tier.period && (
                        <span className={styles.period}>{tier.period}</span>
                      )}
                    </div>
                  </div>
                  <ul className={styles.featureList}>
                    {tier.features.map((f, j) => (
                      <li key={j} className={styles.featureItem}>
                        <span className={styles.check}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className={styles.rationale}>{data.rationale}</p>
        </div>
      )}
    </BaseCard>
  );
}
