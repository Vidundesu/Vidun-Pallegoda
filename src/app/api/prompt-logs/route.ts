import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/db/supabaseServer";

type PromptLogRow = {
  id: string;
  created_at: string;
  payload: {
    timestamp?: string;
    requestUrl?: string;
    step?: "analysis" | "recommendations";
    systemPrompt?: string;
    userPrompt?: string;
    structuredInput?: unknown;
    rawOutput?: string;
  } | null;
};

export type PromptLogListItem = {
  id: string;
  timestamp: string;
  url: string;
  step: "analysis" | "recommendations" | "unknown";
  systemPrompt: string;
  userPrompt: string;
  structuredInput: unknown;
  rawOutput: string;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,created_at,payload")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as unknown as PromptLogRow[];
    const items: PromptLogListItem[] = rows.map((row) => {
      const p = row.payload;
      return {
        id: String(row.id),
        timestamp: String(p?.timestamp ?? row.created_at),
        url: String(p?.requestUrl ?? ""),
        step: p?.step ?? "unknown",
        systemPrompt: String(p?.systemPrompt ?? ""),
        userPrompt: String(p?.userPrompt ?? ""),
        structuredInput: p?.structuredInput ?? null,
        rawOutput: String(p?.rawOutput ?? ""),
      };
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load prompt logs",
      },
      { status: 500 },
    );
  }
}
