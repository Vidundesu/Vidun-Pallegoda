// ─── Factual Metrics (extracted deterministically, no AI) ─────────────────────

export interface HeadingCounts {
  h1: number;
  h2: number;
  h3: number;
}

export interface LinkCounts {
  internal: number;
  external: number;
}

export interface PageMetrics {
  wordCount: number;
  headings: HeadingCounts;
  ctaCount: number;
  links: LinkCounts;
  imageCount: number;
  imagesMissingAltPercent: number;
  metaTitle: string | null;
  metaDescription: string | null;
}

// ─── Cleaned Content (for AI consumption only, no raw HTML) ───────────────────

export interface PageContent {
  title: string | null;
  headings: string[];
  bodyText: string; // truncated to token budget (~3000 chars)
}

// ─── AI Analysis Output (step 1) ──────────────────────────────────────────────

export interface PageAnalysis {
  seoStructure: string;
  messagingClarity: string;
  ctaUsage: string;
  contentDepth: string;
  uxConcerns: string;
}

// ─── AI Recommendation Output (step 2) ────────────────────────────────────────

export type RecommendationPriority = "high" | "medium" | "low";

export interface Recommendation {
  priority: RecommendationPriority;
  recommendation: string;
  reasoning: string;
  metricReference: string;
}

// ─── Top-Level Audit Result ────────────────────────────────────────────────────

export interface AuditResult {
  metrics: PageMetrics;
  analysis: PageAnalysis;
  recommendations: Recommendation[];
}

// ─── API Request ───────────────────────────────────────────────────────────────

export interface AuditRequest {
  url: string;
}
