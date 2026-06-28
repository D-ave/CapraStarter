// ─── CapraSeed Report Storage ─────────────────────────────────────────────────
// File-backed JSON persistence for saved reports.
// Data is written with Node.js fs server-side only.
// Local runs use .capraseed/reports; Vercel uses /tmp.

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { deriveTitle } from "./title";
import type {
  SavedCapraSeedReport,
  SavedCapraSeedReportListItem,
  ReportUsageSummary,
  ReportInputs,
  SectionId,
  SectionStatus,
  AnalysisState,
} from "@/types/capra-seed";

function safeNamespace(namespace: string): string {
  return namespace.replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 96) || "local";
}

function sessionDir(namespace: string): string {
  const safe = safeNamespace(namespace);
  return process.env.VERCEL
    ? path.join("/tmp", "capraseed", "reports", safe)
    : path.join(".capraseed", "reports", safe);
}

function ensureDir(namespace: string): void {
  const dir = sessionDir(namespace);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function reportPath(namespace: string, id: string): string {
  // Sanitise: only allow alphanumeric + hyphens to prevent path traversal.
  const safe = id.replace(/[^a-zA-Z0-9\-]/g, "");
  return path.join(sessionDir(namespace), `${safe}.json`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createReport(params: {
  idea: string;
  inputs: ReportInputs;
  state: AnalysisState;
  usage: ReportUsageSummary;
}): SavedCapraSeedReport {
  const now = new Date().toISOString();
  const id = randomUUID();

  // Derive a short display title: prefer the AI-generated tagline from overview.
  const tagline = params.state.overview?.data?.tagline;
  const title = deriveTitle(params.idea, tagline);

  const sections: SavedCapraSeedReport["sections"] = {};
  for (const key of Object.keys(params.state) as SectionId[]) {
    const s = params.state[key];
    sections[key] = { status: s.status as SectionStatus, data: s.data };
  }

  return {
    id,
    createdAt: now,
    updatedAt: now,
    idea: params.idea,
    title,
    inputs: params.inputs,
    sections,
    usage: params.usage,
  };
}

export function saveReport(namespace: string, report: SavedCapraSeedReport): void {
  ensureDir(namespace);
  fs.writeFileSync(reportPath(namespace, report.id), JSON.stringify(report, null, 2), "utf-8");
}

export function loadReport(namespace: string, id: string): SavedCapraSeedReport | null {
  const fp = reportPath(namespace, id);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as SavedCapraSeedReport;
  } catch {
    return null;
  }
}

export function listReports(namespace: string): SavedCapraSeedReportListItem[] {
  ensureDir(namespace);
  let files: string[];
  try {
    files = fs.readdirSync(sessionDir(namespace)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const items: SavedCapraSeedReportListItem[] = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(sessionDir(namespace), file), "utf-8")
      ) as SavedCapraSeedReport;

      // Backward compat: derive title if the saved file predates the title field.
      const tagline = (raw.sections?.overview?.data as { tagline?: string } | undefined)?.tagline;
      const title = raw.title ?? deriveTitle(raw.idea, tagline);

      items.push({
        id: raw.id,
        title,
        ideaSnippet: raw.idea.length > 120 ? raw.idea.slice(0, 120) + "…" : raw.idea,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        totalInputTokens: raw.usage?.totalInputTokens ?? 0,
        totalOutputTokens: raw.usage?.totalOutputTokens ?? 0,
        totalEstimatedCostUsd: raw.usage?.totalEstimatedCostUsd ?? 0,
      });
    } catch {
      // Skip unreadable files silently
    }
  }

  // Newest first
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

export function deleteReport(namespace: string, id: string): boolean {
  const fp = reportPath(namespace, id);
  if (!fs.existsSync(fp)) return false;
  try {
    fs.unlinkSync(fp);
    return true;
  } catch {
    return false;
  }
}
