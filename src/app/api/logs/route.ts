import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type PromptLogLine = {
  timestamp: string;
  requestUrl: string;
  step: "analysis" | "recommendations";
  structuredInput?: unknown;
  rawOutput?: string;
};

export type LogRunListItem = {
  id: string;
  url: string;
  timestamp: string;
  hasRecommendations: boolean;
};

const LOGS_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOGS_DIR, "audit.log.json");

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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

function toRuns(entries: PromptLogLine[]): LogRunListItem[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const usedRecommendationIndexes = new Set<number>();
  const runs: LogRunListItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (e.step !== "analysis") continue;

    const analysisTime = new Date(e.timestamp).getTime();
    const windowMs = 10 * 60 * 1000;

    let hasRecommendations = false;

    for (let j = 0; j < sorted.length; j++) {
      if (usedRecommendationIndexes.has(j)) continue;
      const r = sorted[j];
      if (r.step !== "recommendations") continue;
      if (r.requestUrl !== e.requestUrl) continue;

      const recTime = new Date(r.timestamp).getTime();
      if (recTime < analysisTime) continue;
      if (recTime - analysisTime > windowMs) continue;

      hasRecommendations = true;
      usedRecommendationIndexes.add(j);
      break;
    }

    const id = base64UrlEncode(`${e.timestamp}|${e.requestUrl}`);
    runs.push({
      id,
      url: e.requestUrl,
      timestamp: e.timestamp,
      hasRecommendations,
    });
  }

  return runs;
}

export async function GET(): Promise<NextResponse> {
  try {
    const entries = safeReadLogLines();
    const runs = toRuns(entries);
    return NextResponse.json({ success: true, data: runs });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to read logs",
      },
      { status: 500 },
    );
  }
}
