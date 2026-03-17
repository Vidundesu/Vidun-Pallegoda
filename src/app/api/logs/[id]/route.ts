import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import type { AuditResult, PageAnalysis, PageMetrics, Recommendation } from "@/core/types";

type PromptLogLine = {
  timestamp: string;
  requestUrl: string;
  step: "analysis" | "recommendations";
  structuredInput?: unknown;
  rawOutput?: string;
};

const LOGS_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOGS_DIR, "audit.log.json");

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function safeReadLogLines(): PromptLogLine[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  const text = fs.readFileSync(LOG_FILE, "utf8");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: PromptLogLine[] = [];
  for (const line of lines) {
    try {
      parsed.push(JSON.parse(line) as PromptLogLine);
    } catch {
      // Skip malformed lines
    }
  }
  return parsed;
}

function parseJsonFromRawOutput<T>(raw?: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseMetrics(structuredInput: unknown): PageMetrics | null {
  if (!structuredInput || typeof structuredInput !== "object") return null;
  const m = structuredInput as Partial<PageMetrics>;

  if (
    typeof m.wordCount !== "number" ||
    !m.headings ||
    typeof (m.headings as any).h1 !== "number" ||
    typeof (m.headings as any).h2 !== "number" ||
    typeof (m.headings as any).h3 !== "number" ||
    typeof m.ctaCount !== "number" ||
    !m.links ||
    typeof (m.links as any).internal !== "number" ||
    typeof (m.links as any).external !== "number" ||
    typeof m.imageCount !== "number" ||
    typeof m.imagesMissingAltPercent !== "number"
  ) {
    return null;
  }

  return {
    wordCount: m.wordCount,
    headings: m.headings as PageMetrics["headings"],
    ctaCount: m.ctaCount,
    links: m.links as PageMetrics["links"],
    imageCount: m.imageCount,
    imagesMissingAltPercent: m.imagesMissingAltPercent,
    metaTitle: typeof m.metaTitle === "string" || m.metaTitle === null ? m.metaTitle ?? null : null,
    metaDescription:
      typeof m.metaDescription === "string" || m.metaDescription === null
        ? m.metaDescription ?? null
        : null,
  };
}

function findRecommendationsFor(
  entries: PromptLogLine[],
  url: string,
  analysisTimestamp: string,
): Recommendation[] | null {
  const analysisTime = new Date(analysisTimestamp).getTime();
  const windowMs = 10 * 60 * 1000;

  const candidate = entries
    .filter((e) => e.step === "recommendations" && e.requestUrl === url)
    .filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= analysisTime && t - analysisTime <= windowMs;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

  if (!candidate) return null;

  const parsed = parseJsonFromRawOutput<Recommendation[]>(candidate.rawOutput);
  return parsed;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;
    const decoded = base64UrlDecode(id);
    const [timestamp, url] = decoded.split("|", 2);

    if (!timestamp || !url) {
      return NextResponse.json(
        { success: false, error: "Invalid log id" },
        { status: 400 },
      );
    }

    const entries = safeReadLogLines();

    const analysisEntry = entries.find(
      (e) => e.step === "analysis" && e.timestamp === timestamp && e.requestUrl === url,
    );

    if (!analysisEntry) {
      return NextResponse.json(
        { success: false, error: "Log entry not found" },
        { status: 404 },
      );
    }

    const metrics = parseMetrics(analysisEntry.structuredInput);
    const analysis = parseJsonFromRawOutput<PageAnalysis>(analysisEntry.rawOutput);
    const recommendations = findRecommendationsFor(entries, url, timestamp) ?? [];

    if (!metrics || !analysis) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Log entry exists but could not reconstruct audit result (missing structuredInput/rawOutput)",
        },
        { status: 422 },
      );
    }

    const result: AuditResult = { metrics, analysis, recommendations };

    return NextResponse.json({
      success: true,
      data: {
        id,
        url,
        timestamp,
        result,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load log",
      },
      { status: 500 },
    );
  }
}
