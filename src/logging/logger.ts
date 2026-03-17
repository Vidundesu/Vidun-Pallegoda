import fs from "fs";
import path from "path";
import type { PromptLogEntry } from "@/core/contracts";

// Logs directory at project root (outside src/)
const LOGS_DIR = path.join(process.cwd(), "logs");

// Single append-friendly log file
const LOG_FILE = path.join(LOGS_DIR, "audit.log.json");

/**
 * logPromptExchange — Appends a structured JSON entry to the audit log.
 *
 * Logs are newline-delimited JSON (NDJSON) — one JSON object per line,
 * making it easy to stream/parse with standard tools.
 *
 * Logged per AI call:
 * - requestUrl: the URL that was audited
 * - step: "analysis" | "recommendations"
 * - systemPrompt: the full system prompt sent to Claude
 * - userPrompt: the full user prompt (TOON data for step 1, metrics+analysis for step 2)
 * - structuredInput: the structured data object passed into the AI function
 * - rawOutput: the raw string returned by Claude before parsing
 */
export function logPromptExchange(entry: PromptLogEntry): void {
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, line, "utf-8");
  } catch (err) {
    // Logging must never crash the request — degrade gracefully
    console.error("[logger] Failed to write log entry:", err);
  }
}
