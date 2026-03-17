import * as cheerio from "cheerio";
import type { PageContent } from "@/core/types";

// Token budget — keep body text under this to avoid Claude context overflow
const MAX_BODY_TEXT_CHARS = 3_000;

// Elements to strip before text extraction (noise / boilerplate)
const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "iframe",
  "svg",
  '[aria-hidden="true"]',
  ".cookie-banner",
  ".popup",
  ".modal",
  "#cookie-consent",
];

/**
 * extractContent — Produces clean, AI-safe structured content from raw HTML.
 * Strips all script/style/nav/footer noise before extraction.
 * Output is passed to toTOON.ts; raw HTML is NEVER sent to AI.
 */
export function extractContent(html: string): PageContent {
  const $ = cheerio.load(html);

  // Strip noisy elements
  STRIP_SELECTORS.forEach((sel) => $(sel).remove());

  // ── Title ───────────────────────────────────────────────────────────────────
  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    null;

  // ── Headings (ordered) ──────────────────────────────────────────────────────
  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) headings.push(text);
  });

  // ── Main Body Text ──────────────────────────────────────────────────────────
  // Prefer <main> or <article>, fall back to <body>
  const contentRoot =
    $("main").length > 0
      ? $("main")
      : $("article").length > 0
        ? $("article")
        : $("body");

  const rawBodyText = contentRoot.text().replace(/\s+/g, " ").trim();

  // Truncate to token budget, breaking at a word boundary
  let bodyText = rawBodyText;
  if (rawBodyText.length > MAX_BODY_TEXT_CHARS) {
    const truncated = rawBodyText.substring(0, MAX_BODY_TEXT_CHARS);
    const lastSpace = truncated.lastIndexOf(" ");
    bodyText = truncated.substring(0, lastSpace > 0 ? lastSpace : MAX_BODY_TEXT_CHARS) + "…";
  }

  return { title, headings, bodyText };
}
