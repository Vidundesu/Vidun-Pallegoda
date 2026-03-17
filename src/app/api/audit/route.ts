import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuditRequestSchema } from "@/validation/schemas";
import { fetchPage, FetchError } from "@/scraper/fetchPage";
import { extractMetrics } from "@/scraper/extractMetrics";
import { extractContent } from "@/scraper/extractContent";
import { metricsToTOON } from "@/ai/toTOON";
import { analyzePage } from "@/ai/analyzePage";
import { generateRecommendations } from "@/ai/generateRecommendations";
import type { AuditSuccessResponse, AuditErrorResponse } from "@/core/contracts";

/**
 * POST /api/audit
 *
 * Pipeline (strictly layered — AI never sees raw HTML):
 *   1. Validate request body
 *   2. fetchPage        → raw HTML
 *   3. extractMetrics   → PageMetrics  (deterministic, no AI)
 *   4. extractContent   → PageContent  (deterministic, no AI)
 *   5. metricsToTOON    → TOON string  (AI input boundary)
 *   6. analyzePage      → PageAnalysis (AI step 1)
 *   7. generateRecs     → Recommendation[] (AI step 2)
 *   8. Return { metrics, analysis, recommendations }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Parse & Validate Request ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const error: AuditErrorResponse = {
      success: false,
      error: "Invalid JSON body",
    };
    return NextResponse.json(error, { status: 400 });
  }

  const parsed = AuditRequestSchema.safeParse(body);
  if (!parsed.success) {
    const error: AuditErrorResponse = {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      details: parsed.error.issues,
    };
    return NextResponse.json(error, { status: 400 });
  }

  const { url } = parsed.data;

  // ── 2. Fetch Page ────────────────────────────────────────────────────────────
  let html: string;
  try {
    html = await fetchPage(url);
  } catch (err) {
    if (err instanceof FetchError) {
      const error: AuditErrorResponse = {
        success: false,
        error: err.message,
        details: { statusCode: err.statusCode },
      };
      return NextResponse.json(error, { status: 422 });
    }
    const error: AuditErrorResponse = {
      success: false,
      error: "Failed to fetch the target URL",
    };
    return NextResponse.json(error, { status: 422 });
  }

  // ── 3 & 4. Extract Metrics & Content (deterministic, no AI) ─────────────────
  const metrics = extractMetrics(html, url);
  const content = extractContent(html);

  // ── 5. Convert to TOON (AI input boundary) ──────────────────────────────────
  const toon = metricsToTOON(metrics, content);

  // ── 6 & 7. AI Pipeline ───────────────────────────────────────────────────────
  try {
    const analysis = await analyzePage(toon, metrics, url);
    const recommendations = await generateRecommendations(analysis, metrics, url);

    const response: AuditSuccessResponse = {
      success: true,
      data: { metrics, analysis, recommendations },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[POST /api/audit] AI pipeline error:", err);

    const error: AuditErrorResponse = {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "AI analysis failed. Please try again.",
    };
    return NextResponse.json(error, { status: 500 });
  }
}

// Block non-POST methods cleanly
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}
