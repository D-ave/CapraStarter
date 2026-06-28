import BaseCard from "./BaseCard";
import styles from "./EquipmentCard.module.css";
import type { EquipmentData, SectionStatus } from "@/types/capra-seed";

interface Props {
  status: SectionStatus;
  data?: EquipmentData;
}

function ItemList({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} className={`${styles.item} ${accent ? styles.accent : ""}`}>
          <span className={styles.bullet} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function EquipmentCard({ status, data }: Props) {
  return (
    <BaseCard
      title="Equipment & Workspace"
      icon="⊡"
      accentColor="linear-gradient(90deg, var(--accent2), var(--success))"
      status={status}
    >
      {data && (
        <div className={styles.equipment}>
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Required Equipment</span>
            <ItemList items={data.required} accent />
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Optional / Nice to Have</span>
            <ItemList items={data.optional} />
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Workspace Requirements</span>
            <ItemList items={data.workspaceNeeds} />
          </div>

          {data.safetyNotes.length > 0 && (
            <div className={styles.safety}>
              <span className={styles.safetyLabel}>⚠ Safety Notes</span>
              <ul className={styles.list}>
                {data.safetyNotes.map((note, i) => (
                  <li key={i} className={`${styles.item} ${styles.safetyItem}`}>
                    <span className={styles.bullet} />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </BaseCard>
  );
}
