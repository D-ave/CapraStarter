// ─── CapraSeed → Site Builder Handoff Mapper ─────────────────────────────────
// Pure function. No API calls. No side effects.
// Converts CapraSeed analysis output into a normalized SiteBuilderInputV1
// payload that is ready to hand off to the configured site builder.

import type {
  AnalysisState,
  ReportInputs,
  SiteBuilderInputV1,
  BuilderReadiness,
  WebsiteData,
  OverviewData,
  PricingData,
  ForgeSpecV1,
  ForgeSpecV1Section,
  ForgeImageRef,
} from "@/types/capra-seed";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a display name into a URL/app-slug safe identifier. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "my-app";
}

/** Truncates a string to maxLen, preserving whole words where possible. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

// ── Structured builder spec ───────────────────────────────────────────────────

/**
 * Derives a ForgeSpecV1 from CapraSeed analysis state.
 *
 * Returns null when neither website nor overview data is available.
 * The result is embedded as `SiteBuilderInputV1.forgeSpecV1` and used by
 * BuilderHandoffCard to dispatch a structured, archetype-aware prompt to
 * the configured static-site worker.
 */
export function buildForgeSpecV1(
  idea: string,
  state: AnalysisState,
  inputs?: ReportInputs,
  images?: ForgeImageRef[]
): ForgeSpecV1 | null {
  const website = state.website.status === "done"
    ? (state.website.data as WebsiteData | undefined)
    : undefined;
  const overview = state.overview.status === "done"
    ? (state.overview.data as OverviewData | undefined)
    : undefined;
  const pricing = state.pricing.status === "done"
    ? (state.pricing.data as PricingData | undefined)
    : undefined;

  if (!website && !overview) return null;

  const brandName =
    website?.brandName ||
    overview?.tagline?.split(/[,—–]/, 1)[0].trim() ||
    idea.split(" ").slice(0, 4).join(" ");

  const heroHeadline = website?.heroHeadline || overview?.valueProp || brandName;
  const subheadline  = website?.subheadline  || overview?.description?.split(".")[0] || "";
  const ctaText      = website?.ctaText      || "Get Started";
  const tone         = inputs?.tone          || "professional";
  const targetAudience =
    overview?.targetAudience || inputs?.targetAudience || "";

  const sections: ForgeSpecV1Section[] = [];

  // 1. Feature grid — from website feature blocks
  const features: { title: string; description: string }[] = [];
  if (website?.featureTitle1) features.push({ title: website.featureTitle1, description: website.featureDesc1 });
  if (website?.featureTitle2) features.push({ title: website.featureTitle2, description: website.featureDesc2 });
  if (website?.featureTitle3) features.push({ title: website.featureTitle3, description: website.featureDesc3 });
  if (features.length > 0) {
    sections.push({ type: "feature-grid", headline: "Why Choose Us", features });
  }

  // 2. Value props — from overview
  if (overview?.valueProp || targetAudience) {
    const props: { title: string; description: string }[] = [];
    if (overview?.valueProp)     props.push({ title: "Our Promise",  description: overview.valueProp });
    if (targetAudience)          props.push({ title: "Built For",    description: targetAudience });
    if (overview?.businessModel) props.push({ title: "How It Works", description: overview.businessModel });
    sections.push({ type: "value-props", headline: "What Sets Us Apart", props });
  }

  // 3. Story — from overview description
  if (overview?.description) {
    sections.push({
      type: "story",
      headline: "Our Story",
      body: overview.description,
      audienceFit: targetAudience || undefined,
    });
  }

  // 4. Testimonials — only if social proof is available
  if (website?.socialProof) {
    sections.push({
      type: "testimonials",
      headline: "What People Are Saying",
      items: [{ quote: website.socialProof }],
    });
  }

  // 5. Pricing summary — only if tiers are available
  if (pricing?.tiers?.length) {
    sections.push({
      type: "pricing-summary",
      headline: "Transparent Pricing",
      model: pricing.model,
      tiers: pricing.tiers.map((t, i) => ({
        name:      t.name,
        price:     t.price,
        period:    t.period,
        highlight: i === 0,
      })),
    });
  }

  // 6. CTA banner — always included
  sections.push({
    type: "cta-banner",
    headline: `Ready to get started with ${brandName}?`,
    subtext: subheadline || undefined,
    ctaText,
  });

  // 7. Contact form — always included
  sections.push({
    type: "contact-form",
    headline: "Get in Touch",
    fields: ["name", "email", "message"],
    ctaText: "Send Message",
  });

  const navLinks = ["Features", "About"];
  if (pricing?.tiers?.length) navLinks.push("Pricing");
  navLinks.push("Contact");

  // Resolve the hero image — first image with role "hero", if any
  const heroImage = images?.find(img => img.role === "hero");

  return {
    version: "1",
    siteType: "landing-page",
    siteArchetype: "product-luxury",
    brand: {
      name: brandName,
      tagline: overview?.tagline || undefined,
      tone,
      targetAudience: targetAudience || undefined,
    },
    hero: {
      headline: heroHeadline,
      subheadline,
      ctaText,
      ...(heroImage ? { imageId: heroImage.id } : {}),
    },
    navigation: { links: navLinks },
    sections,
    ...(images?.length ? { images } : {}),
    seo: {
      title:       `${brandName} — ${overview?.tagline ?? truncate(idea, 60)}`,
      description: truncate(overview?.description ?? idea, 160),
    },
  };
}

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * Builds a SiteBuilderInputV1 from a CapraSeed analysis result.
 *
 * Returns null only when both website and overview sections are absent —
 * meaning there is genuinely nothing to hand off yet.
 */
export function buildHandoffPayload(
  idea: string,
  state: AnalysisState,
  inputs?: ReportInputs,
  images?: ForgeImageRef[]
): SiteBuilderInputV1 | null {
  const forgeSpecV1 = buildForgeSpecV1(idea, state, inputs, images);

  const website = state.website.status === "done"
    ? (state.website.data as WebsiteData | undefined)
    : undefined;
  const overview = state.overview.status === "done"
    ? (state.overview.data as OverviewData | undefined)
    : undefined;
  const pricing = state.pricing.status === "done"
    ? (state.pricing.data as PricingData | undefined)
    : undefined;

  if (!website && !overview) return null;

  // ── Extract fields with fallbacks ──────────────────────────────────────────

  const brandName =
    website?.brandName ||
    overview?.tagline?.split(/[,—–]/, 1)[0].trim() ||
    idea.split(" ").slice(0, 4).join(" ");

  const heroHeadline =
    website?.heroHeadline ||
    overview?.valueProp ||
    "";

  const subheadline =
    website?.subheadline ||
    overview?.description?.split(".")[0] ||
    "";

  const ctaText = website?.ctaText || "Get Started";

  const features: SiteBuilderInputV1["features"] = [];
  if (website?.featureTitle1) features.push({ title: website.featureTitle1, description: website.featureDesc1 });
  if (website?.featureTitle2) features.push({ title: website.featureTitle2, description: website.featureDesc2 });
  if (website?.featureTitle3) features.push({ title: website.featureTitle3, description: website.featureDesc3 });

  const socialProof = website?.socialProof || "";

  const businessDescription = overview?.description || truncate(idea, 300);
  const targetAudience =
    overview?.targetAudience ||
    inputs?.targetAudience ||
    "";

  const tone = inputs?.tone || "professional";

  const pricingModel =
    pricing?.model ||
    overview?.businessModel ||
    inputs?.pricingPreference ||
    "";

  // ── Derive suggested pages ─────────────────────────────────────────────────

  const suggestedPages = ["Home", "About"];
  if (pricing?.tiers?.length) suggestedPages.push("Pricing");
  if (state.competitors.status === "done") suggestedPages.push("Why Us");
  suggestedPages.push("Contact");

  // ── Readiness scoring ──────────────────────────────────────────────────────

  const missingFields: string[] = [];
  if (!website?.brandName)     missingFields.push("brandName");
  if (!heroHeadline)           missingFields.push("heroHeadline");
  if (!website?.ctaText)       missingFields.push("ctaText");
  if (features.length === 0)   missingFields.push("features");

  const readiness: BuilderReadiness =
    missingFields.length === 0 ? "ready" :
    missingFields.length <= 2  ? "partial" :
    "missing-data";

  // ── ForgeSpecV0 stub ───────────────────────────────────────────────────────
  // The current builder only accepts appName + template + description.
  // Rich content (headline, features, CTA) requires a template upgrade.

  const descParts = [
    businessDescription,
    targetAudience && `Target audience: ${targetAudience}`,
    heroHeadline && `Headline: "${heroHeadline}"`,
  ].filter(Boolean) as string[];

  const description = truncate(descParts.join(". "), 400);

  return {
    schemaVersion: "1",
    brandName,
    heroHeadline,
    subheadline,
    ctaText,
    features,
    socialProof,
    businessDescription,
    targetAudience,
    pricingModel,
    suggestedPages,
    tone,
    generatedFrom: "capra-seed",
    sourceIdea: idea,
    readiness,
    missingFields,
    forgeSpec: {
      appName: slugify(brandName),
      template: "hello-next",
      description,
    },
    ...(images?.length ? { images } : {}),
    ...(forgeSpecV1 ? { forgeSpecV1 } : {}),
  };
}
