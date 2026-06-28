"use client";

import { useState, useMemo } from "react";
import styles from "./BuilderHandoffCard.module.css";
import { buildHandoffPayload } from "@/lib/capra-seed/builder-handoff";
import type {
  AnalysisState,
  ReportInputs,
  SiteBuilderInputV1,
  BuilderSendState,
} from "@/types/capra-seed";

interface Props {
  idea: string;
  state: AnalysisState;
  inputs?: ReportInputs;
}

const SITE_BUILDER_API_URL =
  process.env.NEXT_PUBLIC_SITE_BUILDER_API_URL ||
  "http://localhost:3001/api/forge/jobs";

const SITE_BUILDER_JOBS_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_BUILDER_JOBS_BASE_URL ||
  "http://localhost:3001/forge/jobs";

function buildBuilderJobUrl(jobId: string): string {
  return `${SITE_BUILDER_JOBS_BASE_URL.replace(/\/$/, "")}/${encodeURIComponent(jobId)}`;
}

// ── Readiness badge ───────────────────────────────────────────────────────────

function ReadinessBadge({ readiness }: { readiness: SiteBuilderInputV1["readiness"] }) {
  const label =
    readiness === "ready"        ? "Ready" :
    readiness === "partial"      ? "Partial" :
    "Incomplete";
  return (
    <span className={`${styles.badge} ${styles[`badge_${readiness.replace("-", "_")}`]}`}>
      {readiness === "ready" ? "✓" : readiness === "partial" ? "◐" : "○"} {label}
    </span>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

// ── Prompt builder ────────────────────────────────────────────────────────────
// Converts a SiteBuilderInputV1 into the prompt string expected by the
// static-site builder worker (POST /api/forge/jobs { kind, prompt }).

function buildBuilderPrompt(p: SiteBuilderInputV1): string {
  const featureCards = p.features.length > 0
    ? p.features.map(f => `  • ${f.title}: ${f.description}`).join("\n")
    : "  • (no features listed)";
  const pages = p.suggestedPages.length > 0 ? p.suggestedPages.join(", ") : "home";

  return `\
You are building a premium, visually rich marketing landing page. Do NOT produce a generic starter site or blank template. Every section must be fully populated with real content.

BRAND
  Name: ${p.brandName}
  Description: ${p.businessDescription}
  Tone: ${p.tone}
  Target audience: ${p.targetAudience}
  Pricing model: ${p.pricingModel}
${p.socialProof ? `  Social proof: ${p.socialProof}` : ""}

HERO SECTION
  Headline: ${p.heroHeadline}
  Subheadline: ${p.subheadline}
  Primary CTA button: ${p.ctaText}

  Design requirements:
  - Full-width hero with a strong visual hierarchy
  - Headline must be large, bold, and immediately legible
  - CTA must be a prominent, styled button — not a plain link
  - Use generous padding; the hero should feel spacious and premium

FEATURES / VALUE SECTION
${featureCards}

  Design requirements:
  - Render each feature as a distinct card with an icon placeholder, title, and description
  - Cards should be laid out in a responsive grid (2–3 columns on desktop)
  - Use subtle borders or shadows to give cards depth

NAVIGATION
  Pages: ${pages}
  - Include a minimal top nav with the brand name and page links

FOOTER
  - Include a simple footer with brand name and a short tagline derived from the subheadline

DESIGN SYSTEM
  - Color palette: derive from the brand tone ("${p.tone}") — warm neutrals and earthy tones for handcrafted/sustainable brands, cool clean tones for tech/SaaS
  - Typography: use a serif or semi-serif for headings to convey craft and quality; sans-serif for body
  - Spacing: generous whitespace throughout — sections should breathe, not feel cramped
  - No filler lorem ipsum anywhere — every visible text element must use the real content above

OUTPUT REQUIREMENTS
  - Output index.html, style.css, and script.js as separate files
  - style.css must produce a polished, publication-quality layout — not a default browser stylesheet
  - All sections (hero, features, nav, footer) must be visibly styled and complete
  - The page must look production-ready at 1280px viewport width`.trim();
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function BuilderHandoffCard({ idea, state, inputs }: Props) {
  const payload = useMemo(
    () => buildHandoffPayload(idea, state, inputs),
    [idea, state, inputs]
  );

  const [sendState, setSendState] = useState<BuilderSendState>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!payload) return null;

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleSendToBuilder() {
    if (!payload || sendState === "sending" || sendState === "sent") return;
    setSendState("sending");
    setSendError(null);
    try {
      const res = await fetch(SITE_BUILDER_API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "static-site", prompt: buildBuilderPrompt(payload) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `Builder returned ${res.status}`);
      }
      setJobId(json.id ?? json.jobId ?? null);
      setSendState("sent");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
      setSendState("error");
    }
  }

  async function handleExportPayload() {
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard not available — fallback: no-op (could trigger download instead)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.sectionBadge}>Site Builder</span>
          <h2 className={styles.title}>Site Blueprint</h2>
          <p className={styles.subtitle}>
            Extracted from your CapraStarter analysis and prepared for a launch-page build.
          </p>
        </div>
        <ReadinessBadge readiness={payload.readiness} />
      </div>

      {/* Missing fields warning */}
      {payload.missingFields.length > 0 && (
        <div className={styles.warning}>
          <span className={styles.warningIcon}>⚠</span>
          <span>
            Some fields were absent from the analysis and will use fallback values:{" "}
            <strong>{payload.missingFields.join(", ")}</strong>
          </span>
        </div>
      )}

      {/* Payload preview grid */}
      <div className={styles.preview}>
        <div className={styles.previewSection}>
          <span className={styles.previewLabel}>Site identity</span>
          <FieldRow label="Brand name"    value={payload.brandName} />
          <FieldRow label="Site slug"     value={payload.forgeSpec.appName} />
          <FieldRow label="Tone"          value={payload.tone} />
        </div>

        <div className={styles.previewSection}>
          <span className={styles.previewLabel}>Landing page content</span>
          <FieldRow label="Hero headline" value={payload.heroHeadline} />
          <FieldRow label="Subheadline"   value={payload.subheadline} />
          <FieldRow label="CTA"           value={payload.ctaText} />
          <FieldRow label="Social proof"  value={payload.socialProof} />
        </div>

        <div className={styles.previewSection}>
          <span className={styles.previewLabel}>Features ({payload.features.length})</span>
          {payload.features.length > 0 ? (
            payload.features.map((f, i) => (
              <FieldRow key={i} label={`Feature ${i + 1}`} value={f.title} />
            ))
          ) : (
            <span className={styles.empty}>No feature blocks available</span>
          )}
        </div>

        <div className={styles.previewSection}>
          <span className={styles.previewLabel}>Site structure</span>
          <FieldRow label="Pages"         value={payload.suggestedPages.join(", ")} />
          <FieldRow label="Pricing model" value={payload.pricingModel} />
          <FieldRow label="Audience"      value={payload.targetAudience} />
        </div>
      </div>

      {/* Action row */}
      <div className={styles.actions}>
        <div className={styles.actionButtons}>
          {/* Primary: Create real static-site builder job */}
          <button
            type="button"
            className={`${styles.sendBtn} ${sendState === "sent" ? styles.sendBtnSent : ""} ${sendState === "error" ? styles.sendBtnError : ""}`}
            onClick={handleSendToBuilder}
            disabled={sendState === "sending" || sendState === "sent"}
          >
            {sendState === "sending" ? (
              <><span className={styles.spinner} /> Sending…</>
            ) : sendState === "sent" ? (
              "✓ Sent to Builder"
            ) : sendState === "error" ? (
              "Send failed — retry?"
            ) : (
              "Send to Builder →"
            )}
          </button>

          {/* Secondary: Export full payload */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportPayload}
          >
            {copied ? "✓ Copied" : "Export payload"}
          </button>
        </div>

        {/* Builder job result */}
        {sendState === "sent" && jobId && (
          <div className={styles.jobResult}>
            <span className={styles.jobLabel}>Builder job</span>
            <code className={styles.jobId}>{jobId}</code>
            <a className={styles.jobLink} href={buildBuilderJobUrl(jobId)} target="_blank" rel="noreferrer">
              View in Jobs →
            </a>
          </div>
        )}

        {/* Send error */}
        {sendState === "error" && sendError && (
          <div className={styles.errorMsg}>{sendError}</div>
        )}
      </div>

      {/* Integration seam notice */}
      <div className={styles.seam}>
        <span className={styles.seamIcon}>ℹ</span>
        <div className={styles.seamText}>
          <strong>Current scope:</strong> Submits a real <code>static-site</code> job to the
          configured site builder endpoint. The <code>SiteBuilderInputV1</code> payload is
          mapped to the worker prompt (headline, CTA, features, pages, tone, audience).
          Point <code>NEXT_PUBLIC_SITE_BUILDER_API_URL</code> and{" "}
          <code>NEXT_PUBLIC_SITE_BUILDER_JOBS_BASE_URL</code> at the builder service. The worker generates{" "}
          <code>index.html</code>, <code>style.css</code>, and <code>script.js</code> under{" "}
          <code>.forge/artifacts/&lt;id&gt;/out/</code> and exposes a preview URL once done.
        </div>
      </div>
    </div>
  );
}
