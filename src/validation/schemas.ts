import { z } from "zod";

// ─── Request Validation ────────────────────────────────────────────────────────

export const AuditRequestSchema = z.object({
  url: z
    .string()
    .min(1, "url is required")
    .url("url must be a valid URL (include http:// or https://)"),
});

// ─── Metrics Schema ────────────────────────────────────────────────────────────

export const HeadingCountsSchema = z.object({
  h1: z.number().int().min(0),
  h2: z.number().int().min(0),
  h3: z.number().int().min(0),
});

export const LinkCountsSchema = z.object({
  internal: z.number().int().min(0),
  external: z.number().int().min(0),
});

export const PageMetricsSchema = z.object({
  wordCount: z.number().int().min(0),
  headings: HeadingCountsSchema,
  ctaCount: z.number().int().min(0),
  links: LinkCountsSchema,
  imageCount: z.number().int().min(0),
  imagesMissingAltPercent: z.number().min(0).max(100),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
});

// ─── AI Analysis Schema (step 1 output) ───────────────────────────────────────

export const PageAnalysisSchema = z.object({
  seoStructure: z
    .string()
    .min(20, "seoStructure must be a substantive analysis"),
  messagingClarity: z
    .string()
    .min(20, "messagingClarity must be a substantive analysis"),
  ctaUsage: z.string().min(20, "ctaUsage must be a substantive analysis"),
  contentDepth: z
    .string()
    .min(20, "contentDepth must be a substantive analysis"),
  uxConcerns: z.string().min(20, "uxConcerns must be a substantive analysis"),
});

// ─── AI Recommendations Schema (step 2 output) ────────────────────────────────

export const RecommendationSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  recommendation: z.string().min(10, "recommendation must be actionable"),
  reasoning: z.string().min(10, "reasoning must explain the recommendation"),
  metricReference: z
    .string()
    .min(5, "metricReference must cite a specific metric"),
});

export const RecommendationsSchema = z
  .array(RecommendationSchema)
  .min(3, "Must provide at least 3 recommendations")
  .max(5, "Must provide at most 5 recommendations");
