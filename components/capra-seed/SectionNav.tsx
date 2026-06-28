"use client";

import { useEffect, useState } from "react";
import styles from "./SectionNav.module.css";

const NAV_ITEMS = [
  { id: "section-summary",    label: "Summary" },
  { id: "section-market",     label: "Market" },
  { id: "section-financials", label: "Financials" },
  { id: "section-ops",        label: "Operations" },
  { id: "section-website",    label: "Website" },
  { id: "section-launch",     label: "Launch" },
] as const;

export default function SectionNav() {
  const [active, setActive] = useState<string>("section-summary");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className={styles.nav} aria-label="Report sections">
      <div className={styles.inner}>
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`${styles.item} ${active === id ? styles.active : ""}`}
            onClick={() => goTo(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
