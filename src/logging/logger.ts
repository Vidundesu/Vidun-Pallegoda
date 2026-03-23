import type { PromptLogEntry } from "@/core/contracts";
import { getSupabaseServerClient } from "@/db/supabaseServer";

/**
 * logPromptExchange — Persists a structured log entry to Supabase.
 *
 * Fully async and awaitable — safe for serverless runtimes where the
 * execution context may be torn down immediately after the response is sent.
 *
 * If persistence fails, the error is logged via console.error and swallowed
 * so that logging never crashes the request.
 */
export async function logPromptExchange(entry: PromptLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("audit_logs").insert({ payload: entry });
    if (error) {
      console.error("[logger] Failed to persist log entry to Supabase:", error.message);
    }
  } catch (err) {
    console.error("[logger] Unexpected error persisting log entry:", err);
  }
}
