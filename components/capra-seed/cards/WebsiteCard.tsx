import BaseCard from "./BaseCard";
import styles from "./WebsiteCard.module.css";
import type { WebsiteData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: WebsiteData;
}

export default function WebsiteCard({ status, data }: Props) {
  const brandSlug = data?.brandName?.toLowerCase().replace(/\s+/g, "") ?? "brand";

  return (
    <BaseCard
      title="Landing Page Preview"
      icon="◈"
      accentColor="linear-gradient(90deg, var(--accent2), var(--accent3))"
      status={status}
    >
      {data && (
        <div className={styles.browser}>
          {/* Fake browser chrome */}
          <div className={styles.browserBar}>
            <div className={styles.trafficLights}>
              <span className={`${styles.light} ${styles.red}`} />
              <span className={`${styles.light} ${styles.yellow}`} />
              <span className={`${styles.light} ${styles.green}`} />
            </div>
            <div className={styles.urlBar}>{brandSlug}.com</div>
          </div>

          {/* Simulated page content */}
          <div className={styles.page}>
            <div className={styles.heroSection}>
              <span className={styles.brandName}>{data.brandName}</span>
              <h2 className={styles.heroHeadline}>{data.heroHeadline}</h2>
              <p className={styles.subheadline}>{data.subheadline}</p>
              <span className={styles.ctaBtn}>{data.ctaText}</span>
            </div>

            <div className={styles.features}>
              {[
                { title: data.featureTitle1, desc: data.featureDesc1 },
                { title: data.featureTitle2, desc: data.featureDesc2 },
                { title: data.featureTitle3, desc: data.featureDesc3 },
              ].map((f, i) => (
                <div key={i} className={styles.feature}>
                  <span className={styles.featureTitle}>{f.title}</span>
                  <span className={styles.featureDesc}>{f.desc}</span>
                </div>
              ))}
            </div>

            <p className={styles.socialProof}>{data.socialProof}</p>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
