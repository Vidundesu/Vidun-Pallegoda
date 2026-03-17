/**
 * fetchPage — Scraper layer entry point.
 * Fetches raw HTML from a URL. Works with standard Node fetch (Next.js 13+).
 * NEVER passes output to AI directly — returns raw HTML string only.
 */

const FETCH_TIMEOUT_MS = 10_000;

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export async function fetchPage(url: string): Promise<string> {
  // Validate URL format before network call
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new FetchError(`Invalid URL: "${url}". Must include http:// or https://`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new FetchError(
      `Unsupported protocol "${parsedUrl.protocol}". Only http and https are allowed.`,
    );
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://github.com/seoaudit)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new FetchError(
        `HTTP ${response.status} ${response.statusText} for URL: ${url}`,
        response.status,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new FetchError(
        `Expected HTML content but received: ${contentType}`,
      );
    }

    return await response.text();
  } catch (err) {
    if (err instanceof FetchError) throw err;

    if (err instanceof Error && err.name === "AbortError") {
      throw new FetchError(
        `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s for URL: ${url}`,
      );
    }

    throw new FetchError(
      `Failed to fetch "${url}": ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}
