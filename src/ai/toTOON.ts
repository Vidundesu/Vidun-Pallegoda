import type { PageMetrics, PageContent } from "@/core/types";

/**
 * metricsToTOON — Converts structured metrics + content into TOON notation.
 * This is the ONLY AI input boundary. Raw HTML must never cross this layer.
 *
 * TOON (Typed Object Notation) provides a deterministic, structured
 * representation that prevents AI from pattern-matching raw markup.
 */
export function metricsToTOON(
  metrics: PageMetrics,
  content: PageContent,
): string {
  const lines: string[] = [];

  lines.push("## PAGE_METRICS");
  lines.push(`word_count: ${metrics.wordCount}`);
  lines.push(`heading_h1: ${metrics.headings.h1}`);
  lines.push(`heading_h2: ${metrics.headings.h2}`);
  lines.push(`heading_h3: ${metrics.headings.h3}`);
  lines.push(`cta_count: ${metrics.ctaCount}`);
  lines.push(`internal_links: ${metrics.links.internal}`);
  lines.push(`external_links: ${metrics.links.external}`);
  lines.push(`image_count: ${metrics.imageCount}`);
  lines.push(`images_missing_alt_pct: ${metrics.imagesMissingAltPercent}%`);
  lines.push(`meta_title: ${metrics.metaTitle ?? "(none)"}`);
  lines.push(`meta_description: ${metrics.metaDescription ?? "(none)"}`);

  lines.push("");
  lines.push("## PAGE_CONTENT");
  lines.push(`title: ${content.title ?? "(none)"}`);

  if (content.headings.length > 0) {
    lines.push("headings:");
    content.headings.forEach((h, i) => {
      lines.push(`  [${i + 1}] ${h}`);
    });
  } else {
    lines.push("headings: (none found)");
  }

  lines.push("body_text_excerpt:");
  // Indent body text for clear visual separation
  const indented = content.bodyText
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  lines.push(indented);

  return lines.join("\n");
}
