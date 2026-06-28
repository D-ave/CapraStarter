// ─── CapraSeed Mock / Fallback Data ──────────────────────────────────────────
// Returned whenever the Anthropic API is unavailable (missing key, network
// error, quota exceeded, etc.).  Data is deliberately generic so it renders
// without crashing regardless of what idea was submitted.
// Remove this file or bypass getMockForSection() once a live key is confirmed.

import type {
  SectionId,
  OverviewData,
  WebsiteData,
  MarketData,
  RevenueData,
  Competitor,
  PricingData,
  SwotData,
  RegionsData,
  CostsData,
  EquipmentData,
  LegalData,
  ActionItem,
} from "@/types/capra-seed";

const overview: OverviewData = {
  tagline: "Smart solutions built on a simple foundation",
  description:
    "A lean business that transforms overlooked raw materials into desirable, handcrafted products. By sourcing inputs at near-zero cost and selling finished goods at a premium, the model achieves strong margins from day one.",
  targetAudience: "Eco-conscious consumers, interior designers, and small hospitality venues seeking unique, sustainable furnishings",
  valueProp: "Premium handcrafted goods at competitive prices — sustainability baked in, not bolted on",
  businessModel: "Direct-to-consumer sales (online + local market stalls) supplemented by B2B orders from cafés, coworking spaces, and boutique hotels",
};

const website: WebsiteData = {
  brandName: "ReclaimCo",
  heroHeadline: "Beautiful furniture. Zero waste.",
  subheadline: "Handcrafted tables, benches, and beds from reclaimed materials — made locally, built to last.",
  ctaText: "Shop the Collection",
  featureTitle1: "Sustainably Sourced",
  featureDesc1: "Every piece starts life as discarded industrial material, rescued before the landfill.",
  featureTitle2: "Handcrafted Quality",
  featureDesc2: "Skilled artisans finish each item with care — no two pieces are exactly alike.",
  featureTitle3: "Made Locally",
  featureDesc3: "Produced and shipped within France, cutting carbon footprint and delivery time.",
  socialProof: "Join 1,200+ customers who've furnished their homes sustainably",
};

const market: MarketData = {
  marketSize: "€8.4B",
  cagr: "7.2%",
  trend1: "Rising consumer demand for sustainable and upcycled home goods, particularly among 25–45 year-olds",
  trend2: "Growth of online marketplaces (Etsy, ManoMano) lowering barriers to entry for artisan furniture sellers",
  trend3: "Hospitality sector increasingly specifying reclaimed-material furniture for aesthetic and ESG storytelling",
  opportunity: "Under-served mid-market gap between mass-produced flat-pack and expensive bespoke sustainable furniture",
  challenge: "Consumer perception of reclaimed wood as low-quality must be overcome through consistent finish standards and strong brand storytelling",
};

const revenue: RevenueData = {
  year1Revenue: "€42K",
  year2Revenue: "€118K",
  year3Revenue: "€260K",
  breakEvenMonths: 7,
  avgRevenuePerUser: "€380",
  keyAssumption: "Average selling price of €320 per unit with 60 units sold in month 1, scaling to 200+ units/month by end of year 2",
};

const competitors: Competitor[] = [
  {
    name: "Palletable (FR)",
    description: "French Etsy-style pallet furniture micro-brand with an Instagram-first sales approach",
    differentiator: "More polished finish quality, local showroom, and B2B fulfilment capability",
    type: "Direct",
  },
  {
    name: "IKEA",
    description: "Global flat-pack furniture giant with a growing sustainability range (RÅVAROR recycled line)",
    differentiator: "Handcrafted uniqueness, local provenance, and a sustainability story IKEA cannot authentically claim",
    type: "Indirect",
  },
  {
    name: "1001 Palettes",
    description: "FR online community and marketplace for DIY pallet furniture kits and plans",
    differentiator: "Finished, ready-to-use pieces for customers who want the look without the DIY effort",
    type: "Indirect",
  },
  {
    name: "Ressource Mobilier",
    description: "Emerging Île-de-France upcycled industrial materials furniture workshop",
    differentiator: "Established brand and distribution network in Normandy / Hauts-de-France",
    type: "Emerging",
  },
];

const pricing: PricingData = {
  model: "Value-Based Direct Sales",
  tiers: [
    {
      name: "Essentials",
      price: "€89–€149",
      period: "per piece",
      features: [
        "Small accent items (stools, shelves, side tables)",
        "Standard pallet pine finish",
        "1 colour / stain option",
        "Local pickup or standard shipping",
      ],
    },
    {
      name: "Signature",
      price: "€220–€420",
      period: "per piece",
      features: [
        "Core furniture (coffee tables, benches, beds)",
        "Sanded, sealed premium finish",
        "Choice of 4 stain options",
        "White-glove local delivery included",
        "Personalisation engraving available",
      ],
    },
    {
      name: "Bespoke B2B",
      price: "Custom",
      period: "per project",
      features: [
        "Custom dimensions and quantities (10+ units)",
        "Brand logo burning / signage",
        "Dedicated account manager",
        "Net-30 invoicing",
        "On-site installation available",
      ],
    },
  ],
  rationale: "Value-based pricing captures the sustainability premium while the B2B tier opens high-margin bulk contracts with hospitality clients",
};

const swot: SwotData = {
  strengths: [
    "Near-zero raw material cost creates exceptional margin headroom",
    "Authentic sustainability story resonates with current consumer values",
    "Low capital requirement to start — no factory or heavy machinery needed",
    "Each piece is unique, making direct price comparison difficult",
  ],
  weaknesses: [
    "Inconsistent pallet/drum supply chain may create production bottlenecks",
    "Manual production limits scalability without hiring",
    "No current market research or cost data — pricing may be misaligned",
    "Legal obligations around wood treatment standards (ISPM-15) not yet assessed",
  ],
  opportunities: [
    "French government eco-incentives and \"made local\" branding resonate strongly post-2020",
    "Interior design trend toward industrial/rustic aesthetics still growing",
    "Corporate ESG mandates pushing office and hospitality buyers toward sustainable suppliers",
    "Potential to offer workshops/DIY kits as a second revenue stream",
  ],
  threats: [
    "Copycats can enter with similar model and undercut on price",
    "EU timber regulation changes could impose treatment/certification costs",
    "Seasonal demand peaks may cause cash flow pressure in slower months",
    "Rising wood finishing material costs (varnish, oils) could compress margins",
  ],
};

const regions: RegionsData = {
  regions: [
    {
      name: "France",
      reason: "Home market with established artisan furniture culture, strong consumer demand for locally-made sustainable goods, and access to ADEME eco-design grants. The Occitanie and PACA regions have active upcycling communities. Starting locally reduces logistics cost and builds brand credibility before international expansion.",
      marketFit: "high",
      easeOfEntry: "high",
      riskLevel: "low",
    },
    {
      name: "Germany",
      reason: "Europe's largest furniture market with the highest per-capita spending on sustainable home goods. German consumers actively seek certified eco-products, though CE marking and product liability requirements add complexity. Strong B2B demand from co-working and hospitality sectors in Berlin and Munich.",
      marketFit: "high",
      easeOfEntry: "medium",
      riskLevel: "medium",
    },
    {
      name: "United Kingdom",
      reason: "Mature market for reclaimed and upcycled furniture, particularly in London and major cities. Post-Brexit import/export administration adds friction for physical goods. Strong influencer and interior design culture accelerates brand discovery on Instagram and Pinterest.",
      marketFit: "medium",
      easeOfEntry: "medium",
      riskLevel: "medium",
    },
  ],
};

const costs: CostsData = {
  estimatedRange: "€1,500–€6,000",
  currency: "EUR",
  summary: "Low upfront cost business — raw materials are near-free; the main investments are tools, finishing supplies, and initial marketing",
  categories: [
    {
      name: "Tools & Equipment",
      estimatedCost: "€400–€1,200",
      notes: "Sander, jigsaw, drill, clamps, workbench. Buy secondhand to reduce cost; many can be rented initially.",
    },
    {
      name: "Finishing Materials",
      estimatedCost: "€150–€400",
      notes: "Wood stain, varnish, oil, sandpaper, brushes. Budget per-unit thereafter at roughly €8–€20 per piece.",
    },
    {
      name: "Workspace",
      estimatedCost: "€0–€2,400/yr",
      notes: "Garage or outdoor space at home = €0. Small rented workshop in FR typically €150–€300/month. Start at home if possible.",
    },
    {
      name: "Licences & Insurance",
      estimatedCost: "€200–€600",
      notes: "Auto-entrepreneur registration is free. Public liability insurance ~€150–€300/yr. Professional indemnity optional at this stage.",
    },
    {
      name: "Marketing & Photography",
      estimatedCost: "€100–€500",
      notes: "Smartphone photography is sufficient initially. Budget €100 for props/backdrop and €0–€300 for initial social ads.",
    },
    {
      name: "Transport & Logistics",
      estimatedCost: "€100–€400",
      notes: "Van hire or delivery service for large pieces. Consider folding delivery cost into product pricing above €150.",
    },
    {
      name: "Website & Software",
      estimatedCost: "€0–€300",
      notes: "Etsy/ManoMano = free to list. A simple Shopify store costs ~€30/month. Free Google Business profile for local discovery.",
    },
  ],
};

const equipment: EquipmentData = {
  required: [
    "Orbital sander (electric) — for smoothing rough pallet surfaces",
    "Jigsaw or circular saw — for cutting pallets and drums to size",
    "Power drill with bits — for assembly and pilot holes",
    "Measuring tape, square, and marking tools",
    "Workbench or trestle table — stable work surface",
    "Safety PPE: dust mask (FFP2), safety glasses, gloves, ear defenders",
    "Wood finishing supplies: sandpaper (80/120/240 grit), stain or oil, brushes",
  ],
  optional: [
    "Router — for decorative edge profiles",
    "Belt sander — faster material removal on rough pieces",
    "Pocket hole jig (e.g. Kreg) — for cleaner hidden joinery",
    "Label printer — for branding and care instructions on finished pieces",
    "Van or trailer — useful once order volume justifies owned transport",
  ],
  workspaceNeeds: [
    "Minimum 20–30m² covered workspace with good ventilation (sanding creates fine dust)",
    "Power supply: standard 230V sufficient; no 3-phase required for hand tools",
    "Dry storage for incoming pallets and drums (wet wood is harder to work and finish)",
    "Outdoor or well-ventilated area for spray finishing and staining",
    "Lock-up security for tools and finished stock",
  ],
  safetyNotes: [
    "Pallets may carry heat-treatment (HT) or chemical treatment (MB — methyl bromide) markings. Only use HT-stamped pallets; MB pallets are hazardous and must not be used",
    "Sanding and cutting produces combustible fine wood dust — always wear FFP2 mask and ensure ventilation",
    "Cable drums may have residual lubricant or cable grease — clean thoroughly before indoor use or finishing",
    "Stack finished pieces securely to prevent tip-over during storage and transport",
  ],
};

const legal: LegalData = {
  summary: "Launching a handcrafted furniture business in France requires straightforward registration as a micro-entrepreneur, but product safety compliance and wood treatment standards (especially for pallets) are important obligations to address early. The information below is general guidance only.",
  registrations: [
    "Register as auto-entrepreneur (micro-entreprise) via autoentrepreneur.urssaf.fr — free and takes under 30 minutes",
    "Choose a NAF/APE activity code: typically 3109Z (manufacture of other furniture) or 4759B (retail of furniture)",
    "Register with the Chambre des Métiers et de l'Artisanat (CMA) if annual turnover exceeds artisan thresholds or if you employ staff",
    "Open a dedicated business bank account (legally required once turnover exceeds €10,000)",
    "Register a trademark for your brand name via INPI if you plan to scale (optional but advisable early)",
  ],
  permits: [
    "No specific manufacturing permit required for small-scale artisan furniture in France, but check local zoning if operating from a residential address",
    "CE marking is not currently mandatory for bespoke/artisan furniture, but applies if you produce standardised product lines in volume",
    "If operating a workshop in a commercial premises, obtain an Établissement Recevant du Public (ERP) permit if customers visit",
    "Vehicle/transport permit if using a van over 3.5t gross weight for deliveries",
  ],
  compliance: [
    "ISPM-15 standard: only use heat-treated (HT-stamped) pallets as raw material — chemically treated (MB) pallets are hazardous and banned",
    "EU General Product Safety Regulation (GPSR 2023): products sold to consumers must be safe. Provide basic care/safety instructions with each piece",
    "REACH regulation: ensure finishing products (stains, varnishes, sealants) are REACH-compliant — check supplier safety data sheets",
    "Labelling: include material information, care instructions, and business contact details on or with each product sold online (EU distance selling rules)",
    "RGPD (GDPR): if collecting customer emails or running a website, publish a privacy policy and obtain consent",
  ],
  insurance: [
    "Responsabilité Civile Professionnelle (RC Pro) — covers damage caused to third parties during your work; ~€150–€300/yr",
    "Multirisque artisan — covers workspace, tools, and stock against fire, theft, and water damage",
    "Product liability insurance — covers claims if a finished product causes injury or property damage after sale",
    "Transport/goods in transit — covers stock during delivery (often bundled with multirisque)",
  ],
  taxNotes: [
    "Micro-entreprise regime: pay flat-rate social charges on revenue (approx. 12.3% for artisan craft activities). No VAT collection below the franchise threshold (~€91,900 for goods in 2024)",
    "Above the VAT threshold, register for TVA (20% standard rate on furniture) and issue compliant invoices",
    "Keep all receipts for materials and tools — deductible under the réel simplifié regime if you outgrow micro-entreprise",
  ],
  disclaimer: "This is general guidance only and does not constitute legal, tax, or financial advice. Regulations change frequently and vary by department and business structure. Always consult a qualified accountant (expert-comptable) and/or lawyer (avocat) before making decisions about your business structure, compliance obligations, or insurance.",
};

const action: ActionItem[] = [
  { step: "Audit local pallet and cable-drum suppliers — map reliable free/cheap sources within 50 km", phase: "Week 1-2" },
  { step: "Research ISPM-15 heat-treatment requirements and French consumer product safety obligations for wooden furniture", phase: "Week 1-2" },
  { step: "Build 3 hero prototype pieces (coffee table, bench, bed frame) to photograph and validate quality", phase: "Week 1-2" },
  { step: "Open an Etsy France shop and a simple Instagram account with prototype photos and origin story", phase: "Week 3-4" },
  { step: "Price 5 SKUs based on material + labour cost + 60% margin; list all on Etsy and Le Bon Coin", phase: "Week 3-4" },
  { step: "Approach 10 local cafés, coworking spaces, and boutique hotels with a B2B sample and price sheet", phase: "Week 3-4" },
  { step: "Attend one local brocante or design market to validate pricing, gather feedback, and make first sales", phase: "Month 2" },
  { step: "Register as auto-entrepreneur (micro-entreprise) if not yet done; open a dedicated business bank account", phase: "Month 2" },
  { step: "Collect 10 customer reviews and repurpose into social proof on all channels", phase: "Month 3" },
  { step: "Review unit economics — refine pricing, identify top 3 best-selling SKUs, and plan Q2 production schedule", phase: "Month 3" },
];

const MOCK_DATA: Record<SectionId, unknown> = {
  overview,
  website,
  market,
  revenue,
  competitors,
  pricing,
  swot,
  regions,
  costs,
  equipment,
  legal,
  action,
};

export function getMockForSection(section: SectionId): unknown {
  return MOCK_DATA[section];
}
