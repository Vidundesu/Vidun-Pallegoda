import type { AuditResult } from "../types";

// ─── API Request Contract ──────────────────────────────────────────────────────

export interface AuditRequestBody {
  url: string;
}

// ─── API Response Contracts ────────────────────────────────────────────────────

export interface AuditSuccessResponse {
  success: true;
  data: AuditResult;
}

export interface AuditErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type AuditResponse = AuditSuccessResponse | AuditErrorResponse;

// ─── Prompt Log Entry (for logger) ────────────────────────────────────────────

export interface PromptLogEntry {
  timestamp: string;
  requestUrl: string;
  step: "analysis" | "recommendations";
  systemPrompt: string;
  userPrompt: string;
  structuredInput: unknown;
  rawOutput: string;
}
