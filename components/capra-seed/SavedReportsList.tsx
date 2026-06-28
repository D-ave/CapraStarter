"use client";

import { useEffect, useState } from "react";
import styles from "./SavedReportsList.module.css";
import { formatCostUsd, formatTokens } from "@/lib/capra-seed/pricing";
import type { SavedCapraSeedReportListItem } from "@/types/capra-seed";

interface Props {
  onOpen: (id: string) => Promise<void>;
  onBack: () => void;
}

export default function SavedReportsList({ onOpen, onBack }: Props) {
  const [reports, setReports] = useState<SavedCapraSeedReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/capra-seed/reports")
      .then((r) => r.json())
      .then((json) => {
        setReports(json.reports ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load saved reports.");
        setLoading(false);
      });
  }, []);

  async function handleOpen(id: string) {
    if (openingId !== null) return; // prevent double-click while one is in flight
    setOpeningId(id);
    setOpenError(null);
    try {
      await onOpen(id);
      // On success, phase changes to "results" and this component unmounts.
      // No cleanup needed here.
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : "Failed to open report");
      setOpeningId(null);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>CapraStarter</span>
          <h1 className={styles.title}>Saved Reports</h1>
        </div>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← New Idea
        </button>
      </header>

      <main className={styles.main}>
        {loading && (
          <div className={styles.empty}>
            <span className={styles.spinner} />
            <span>Loading reports…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.empty}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No saved reports yet.</p>
            <p className={styles.emptyHint}>Run an analysis and click &quot;Save Report&quot; to keep a copy.</p>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <>
            {openError && (
              <div className={styles.openErrorBanner}>
                Could not open report: {openError}
              </div>
            )}

            <div className={styles.grid}>
              {reports.map((r) => (
                <div key={r.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{r.title}</h3>
                  <p className={styles.snippet} title={r.ideaSnippet}>
                    {r.ideaSnippet}
                  </p>

                  <div className={styles.meta}>
                    <span className={styles.date}>{formatDate(r.createdAt)}</span>
                    <span className={styles.metaDivider}>·</span>
                    <span className={styles.tokens}>
                      {formatTokens(r.totalInputTokens + r.totalOutputTokens)} tokens
                    </span>
                    {r.totalEstimatedCostUsd > 0 && (
                      <>
                        <span className={styles.metaDivider}>·</span>
                        <span className={styles.cost}>{formatCostUsd(r.totalEstimatedCostUsd)}</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`${styles.openBtn} ${openingId === r.id ? styles.openBtnLoading : ""}`}
                    onClick={() => handleOpen(r.id)}
                    disabled={openingId !== null}
                  >
                    {openingId === r.id ? (
                      <><span className={styles.btnSpinner} /> Opening…</>
                    ) : (
                      "Open Report →"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
