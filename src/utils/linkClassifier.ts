export type LinkType = "internal" | "external" | "other";

/**
 * Classify a link href relative to the page's base URL.
 * Pure function — no side effects.
 */
export function classifyLink(href: string, baseUrl: string): LinkType {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return "other";
  }

  try {
    const base = new URL(baseUrl);

    // Relative URLs are always internal
    if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
      return "internal";
    }

    const target = new URL(href, baseUrl);

    // Same hostname → internal
    if (target.hostname === base.hostname) {
      return "internal";
    }

    return "external";
  } catch {
    // If we can't parse it, treat as other
    return "other";
  }
}
