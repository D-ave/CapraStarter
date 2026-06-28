// Supabase-backed report storage — used when a user is authenticated.
// Mirrors the public API shape of storage.ts but targets the `reports` table.

import type { SupabaseClient } from "@supabase/supabase-js";
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
import { randomUUID } from "crypto";

export function createReport(params: {
  idea: string;
  inputs: ReportInputs;
  state: AnalysisState;
  usage: ReportUsageSummary;
}): SavedCapraSeedReport {
  const now = new Date().toISOString();
  const id = randomUUID();
  const tagline = params.state.overview?.data?.tagline;
  const title = deriveTitle(params.idea, tagline);

  const sections: SavedCapraSeedReport["sections"] = {};
  for (const key of Object.keys(params.state) as SectionId[]) {
    const s = params.state[key];
    sections[key] = { status: s.status as SectionStatus, data: s.data };
  }

  return { id, createdAt: now, updatedAt: now, idea: params.idea, title, inputs: params.inputs, sections, usage: params.usage };
}

export async function saveReport(
  supabase: SupabaseClient,
  userId: string,
  report: SavedCapraSeedReport,
): Promise<void> {
  const { error } = await supabase.from("reports").upsert({
    id: report.id,
    user_id: userId,
    idea: report.idea,
    title: report.title,
    inputs: report.inputs,
    sections: report.sections,
    usage: report.usage,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  });
  if (error) throw new Error(error.message);
}

export async function loadReport(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<SavedCapraSeedReport | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    idea: data.idea,
    title: data.title,
    inputs: data.inputs,
    sections: data.sections,
    usage: data.usage,
  };
}

export async function listReports(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedCapraSeedReportListItem[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, idea, title, created_at, updated_at, usage")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map((row) => {
    const tagline = undefined;
    const title = row.title ?? deriveTitle(row.idea, tagline);
    return {
      id: row.id,
      title,
      ideaSnippet: row.idea.length > 120 ? row.idea.slice(0, 120) + "…" : row.idea,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalInputTokens: row.usage?.totalInputTokens ?? 0,
      totalOutputTokens: row.usage?.totalOutputTokens ?? 0,
      totalEstimatedCostUsd: row.usage?.totalEstimatedCostUsd ?? 0,
    };
  });
}

export async function deleteReport(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
