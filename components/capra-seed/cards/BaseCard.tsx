"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./BaseCard.module.css";
import type { SectionStatus } from "@/types/capra-seed";

interface BaseCardProps {
  title: string;
  icon?: string;
  accentColor: string;
  status: SectionStatus;
  children?: React.ReactNode;
}

export default function BaseCard({
  title,
  icon,
  accentColor,
  status,
  children,
}: BaseCardProps) {
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = hasIntersected || status === "done";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.card} ${visible ? styles.visible : ""}`}
    >
      <div className={styles.accentBar} style={{ background: accentColor }} />

      <div className={styles.header}>
        <span className={styles.title}>{title}</span>

        {status === "loading" && (
          <span className={`${styles.statusBadge} ${styles.loading}`}>
            <span className={styles.spinner} />
            Analyzing
          </span>
        )}
        {status === "error" && (
          <span className={`${styles.statusBadge} ${styles.error}`}>
            <span className={styles.dot} />
            Error
          </span>
        )}
      </div>

      {status === "idle" && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} style={{ opacity: 0.3 }} />
          <div className={styles.skeletonLine} style={{ opacity: 0.2, width: "70%" }} />
        </div>
      )}

      {status === "loading" && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      )}

      {status === "done" && children && (
        <div className={styles.content}>{children}</div>
      )}

      {status === "error" && (
        <div className={styles.content}>
          <p className={styles.errorText}>
            Analysis failed for this section. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
