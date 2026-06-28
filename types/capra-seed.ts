// ─── CapraSeed Types ─────────────────────────────────────────────────────────
// Canonical types for the CapraSeed lab slice.
// All UI, API, and lib code must import from this file.

export type SectionId =
  | "overview"
  | "website"
  | "market"
  | "revenue"
  | "competitors"
  | "pricing"
  | "swot"
  | "regions"
  | "costs"
  | "equipment"
  | "legal"
  | "action";

// ─── Section Data Shapes ─────────────────────────────────────────────────────

export interface OverviewData {
  tagline: string;
  description: string;
  targetAudience: string;
  valueProp: string;
  businessModel: string;
}

export interface WebsiteData {
  brandName: string;
  heroHeadline: string;
  subheadline: string;
  ctaText: string;
  featureTitle1: string;
  featureDesc1: string;
  featureTitle2: string;
  featureDesc2: string;
  featureTitle3: string;
  featureDesc3: string;
  socialProof: string;
}

export interface MarketData {
  marketSize: string;
  cagr: string;
  trend1: string;
  trend2: string;
  trend3: string;
  opportunity: string;
  challenge: string;
}

export interface RevenueData {
  year1Revenue: string;
  year2Revenue: string;
  year3Revenue: string;
  breakEvenMonths: number;
  avgRevenuePerUser: string;
  keyAssumption: string;
}

export interface Competitor {
  name: string;
  description: string;
  differentiator: string;
  type: "Direct" | "Indirect" | "Emerging";
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
}

export interface PricingData {
  model: string;
  tiers: PricingTier[];
  rationale: string;
}

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface RegionRecommendation {
  name: string;
  reason: string;
  marketFit: "low" | "medium" | "high";
  easeOfEntry: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
}

export interface RegionsData {
  regions: RegionRecommendation[];
}

export interface CostCategory {
  name: string;
  estimatedCost: string;
  notes: string;
}

export interface CostsData {
  estimatedRange: string;
  currency: string;
  summary: string;
  categories: CostCategory[];
}

export interface EquipmentData {
  required: string[];
  optional: string[];
  workspaceNeeds: string[];
  safetyNotes: string[];
}

export interface LegalData {
  summary: string;
  registrations: string[];
  permits: string[];
  compliance: string[];
  insurance: string[];
  taxNotes: string[];
  disclaimer: string;
}

export interface ActionItem {
  step: string;
  phase: "Week 1-2" | "Week 3-4" | "Month 2" | "Month 3";
}

// ─── State ────────────────────────────────────────────────────────────────────

export type SectionStatus = "idle" | "loading" | "done" | "error";

export interface SectionState<T = unknown> {
  status: SectionStatus;
  data?: T;
}

export interface AnalysisState {
  overview: SectionState<OverviewData>;
  website: SectionState<WebsiteData>;
  market: SectionState<MarketData>;
  revenue: SectionState<RevenueData>;
  competitors: SectionState<Competitor[]>;
  pricing: SectionState<PricingData>;
  swot: SectionState<SwotData>;
  regions: SectionState<RegionsData>;
  costs: SectionState<CostsData>;
  equipment: SectionState<EquipmentData>;
  legal: SectionState<LegalData>;
  action: SectionState<ActionItem[]>;
}

// ─── Usage & Cost ─────────────────────────────────────────────────────────────

export interface SectionUsage {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
}

export interface ReportUsageSummary {
  bySection: Partial<Record<SectionId, SectionUsage>>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
}

// ─── Saved Reports ────────────────────────────────────────────────────────────

export interface ReportInputs {
  targetAudience?: string;
  region?: string;
  tone?: string;
  pricingPreference?: string;
}

export interface SavedCapraSeedReport {
  id: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  idea: string;
  title?: string;      // Short display title — may be absent in older saved reports
  inputs: ReportInputs;
  sections: Partial<Record<SectionId, { status: SectionStatus; data?: unknown }>>;
  usage: ReportUsageSummary;
}

export interface SavedCapraSeedReportListItem {
  id: string;
  title: string;       // Short display title — always present (derived at list time if absent)
  ideaSnippet: string; // Full idea text truncated, used as subtitle
  createdAt: string;
  updatedAt: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
}

// ─── API Contracts ────────────────────────────────────────────────────────────

export interface CapraSeedRequestV1 {
  section: SectionId;
  idea: string;
  targetAudience?: string;
  region?: string;
  tone?: string;
  pricingPreference?: string;
}

export interface CapraSeedResponseV1<T = unknown> {
  data: T;
  usage: SectionUsage | null;
}

export interface CapraSeedErrorV1 {
  error: string;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Site Builder Handoff ─────────────────────────────────────────────────────
// Normalized payload that bridges CapraSeed analysis output to the configured
// site builder. Kept separate from the raw analysis state and the builder's
// own compatibility contract so neither side is polluted.

export type BuilderReadiness = "ready" | "partial" | "missing-data";

export interface SiteBuilderFeature {
  title: string;
  description: string;
}

export interface SiteBuilderInputV1 {
  /** Schema version for forward-compatibility checks. */
  schemaVersion: "1";

  // ── Site identity ──────────────────────────────────────────────────────────
  brandName: string;

  // ── Landing page content ───────────────────────────────────────────────────
  heroHeadline: string;
  subheadline: string;
  ctaText: string;
  features: SiteBuilderFeature[];
  socialProof: string;

  // ── Business context ───────────────────────────────────────────────────────
  businessDescription: string;
  targetAudience: string;
  pricingModel: string;

  // ── Site structure ─────────────────────────────────────────────────────────
  suggestedPages: string[];

  // ── Style guidance ─────────────────────────────────────────────────────────
  tone: string;

  // ── Metadata ───────────────────────────────────────────────────────────────
  generatedFrom: "capra-seed";
  sourceIdea: string;

  // ── Readiness ──────────────────────────────────────────────────────────────
  readiness: BuilderReadiness;
  missingFields: string[];

  // ── Builder-compatible stub ────────────────────────────────────────────────
  // Minimal payload the current builder (/api/build) actually accepts.
  // Does NOT carry rich content — that requires a builder template upgrade.
  forgeSpec: {
    appName: string;       // slugified brandName
    template: "hello-next";
    description: string;   // condensed description, ≤ 400 chars
  };

  // ── Image references ───────────────────────────────────────────────────────
  // Optional. When present, structured builder specs and prompts include them.
  // The pipeline is fully backward-compatible when absent.
  images?: ForgeImageRef[];

  // ── Layout-aware builder contract ──────────────────────────────────────────
  // When present, BuilderHandoffCard dispatches to the V1 prompt path which
  // sends an archetype-tagged structured prompt to the builder worker.
  forgeSpecV1?: ForgeSpecV1;
}

export type BuilderSendState = "idle" | "sending" | "sent" | "error";

// ─── Image References ─────────────────────────────────────────────────────────
// Minimal typed reference model for visual assets that travel with the builder
// contract. Kept optional throughout — the pipeline degrades gracefully when
// no images are present.

export type ForgeImageRole =
  | "hero"
  | "feature"
  | "gallery"
  | "background"
  | "logo";

export type ForgeImageOrigin = "uploaded" | "generated" | "derived";

export type ForgeImageStyleHint =
  | "product-closeup"
  | "lifestyle"
  | "studio"
  | "editorial"
  | "iconic";

export interface ForgeImageRef {
  /** Stable identifier used to cross-reference images from hero.imageId / section.imageIds. */
  id: string;
  role: ForgeImageRole;
  /** Absolute URL or data-URI usable by the builder worker as <img src>. */
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  origin?: ForgeImageOrigin;
  styleHint?: ForgeImageStyleHint;
}

// ─── Layout-Aware Builder Contract ────────────────────────────────────────────
// A structured, section-typed payload that lets the builder worker render an
// archetype-aware site instead of interpreting a flat text prompt.
// Kept additive: SiteBuilderInputV1.forgeSpecV1 is optional.

export interface ForgeSpecFeatureGridSection {
  type: "feature-grid";
  headline?: string;
  features: { title: string; description: string; icon?: string }[];
}

export interface ForgeSpecValuePropsSection {
  type: "value-props";
  headline?: string;
  props: { title: string; description: string }[];
}

export interface ForgeSpecStorySection {
  type: "story";
  headline?: string;
  body: string;
  audienceFit?: string;
}

export interface ForgeSpecTestimonialsSection {
  type: "testimonials";
  headline?: string;
  items: { quote: string; author?: string }[];
}

export interface ForgeSpecPricingSummarySection {
  type: "pricing-summary";
  headline?: string;
  model: string;
  tiers: { name: string; price: string; period: string; highlight?: boolean }[];
}

export interface ForgeSpecCtaBannerSection {
  type: "cta-banner";
  headline: string;
  subtext?: string;
  ctaText: string;
}

export interface ForgeSpecContactFormSection {
  type: "contact-form";
  headline?: string;
  fields: string[];
  ctaText: string;
}

export type ForgeSpecV1Section =
  | ForgeSpecFeatureGridSection
  | ForgeSpecValuePropsSection
  | ForgeSpecStorySection
  | ForgeSpecTestimonialsSection
  | ForgeSpecPricingSummarySection
  | ForgeSpecCtaBannerSection
  | ForgeSpecContactFormSection;

export interface ForgeSpecV1 {
  version: "1";
  siteType: "landing-page";
  /** Archetype key that selects the worker template. Currently: "product-luxury". */
  siteArchetype: "product-luxury" | (string & {});

  brand: {
    name: string;
    tagline?: string;
    tone: string;
    targetAudience?: string;
  };

  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaSecondary?: string;
    /** References a ForgeImageRef.id from images[]. When set, the hero renders that image. */
    imageId?: string;
  };

  navigation: {
    links: string[];
  };

  /** Ordered content sections rendered after the hero. */
  sections: ForgeSpecV1Section[];

  /**
   * Optional image pool. Sections and hero reference entries by id.
   * When absent, all image rendering degrades to text-first fallbacks.
   */
  images?: ForgeImageRef[];

  seo: {
    title: string;
    description: string;
  };
}
