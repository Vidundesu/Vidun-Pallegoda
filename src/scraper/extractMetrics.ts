import * as cheerio from "cheerio";
import type { PageMetrics } from "@/core/types";
import { classifyLink } from "@/utils/linkClassifier";

// CTA keywords — links/buttons containing these words count as calls-to-action
const CTA_KEYWORDS = [
  "buy",
  "get",
  "start",
  "try",
  "sign up",
  "signup",
  "register",
  "subscribe",
  "download",
  "book",
  "order",
  "join",
  "learn more",
  "contact",
  "request",
  "free trial",
  "demo",
  "shop",
  "claim",
];

/**
 * extractMetrics — Deterministic metric extraction from raw HTML.
 * Uses Cheerio only. NO AI involved.
 */
export function extractMetrics(html: string, baseUrl: string): PageMetrics {
  const $ = cheerio.load(html);

  // ── Word Count ──────────────────────────────────────────────────────────────
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText
    ? bodyText.split(/\s+/).filter((w) => w.length > 0).length
    : 0;

  // ── Heading Counts ──────────────────────────────────────────────────────────
  const headings = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
  };

  // ── CTA Count ───────────────────────────────────────────────────────────────
  // Count all <button> elements + <a> tags whose text matches CTA keywords
  let ctaCount = $("button").length;
  $("a").each((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    const isCtaByText = CTA_KEYWORDS.some((kw) => text.includes(kw));
    const isCtaByRole =
      $(el).attr("role") === "button" ||
      $(el).attr("class")?.toLowerCase().includes("btn") ||
      $(el).attr("class")?.toLowerCase().includes("button") ||
      $(el).attr("class")?.toLowerCase().includes("cta");

    if (isCtaByText || isCtaByRole) {
      ctaCount++;
    }
  });

  // ── Link Classification ─────────────────────────────────────────────────────
  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const type = classifyLink(href, baseUrl);
    if (type === "internal") internalLinks++;
    else if (type === "external") externalLinks++;
  });

  // ── Image Metrics ───────────────────────────────────────────────────────────
  const allImages = $("img");
  const imageCount = allImages.length;
  let imagesMissingAlt = 0;
  allImages.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") {
      imagesMissingAlt++;
    }
  });
  const imagesMissingAltPercent =
    imageCount > 0
      ? Math.round((imagesMissingAlt / imageCount) * 100 * 10) / 10
      : 0;

  // ── Meta Tags ───────────────────────────────────────────────────────────────
  const metaTitle = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  return {
    wordCount,
    headings,
    ctaCount,
    links: {
      internal: internalLinks,
      external: externalLinks,
    },
    imageCount,
    imagesMissingAltPercent,
    metaTitle,
    metaDescription,
  };
}
