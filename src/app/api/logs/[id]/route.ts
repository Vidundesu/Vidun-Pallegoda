import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/db/supabaseServer";

import type { AuditResult } from "@/core/types";

type PromptLogPayload = {
  timestamp: string;
  requestUrl: string;
  step: "analysis" | "recommendations";
  structuredInput?: unknown;
  rawOutput?: string;
};

function isPromptLogPayload(p: PromptLogPayload | null): p is PromptLogPayload {
  return p !== null;
}

function parseJsonFromRawOutput<T>(raw?: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,created_at,payload")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Log entry not found" },
        { status: 404 },
      );
    }

    const analysisPayload = (data as any).payload as PromptLogPayload | null;
    if (!analysisPayload) {
      return NextResponse.json(
        { success: false, error: "Log entry exists but has no result" },
        { status: 422 },
      );
    }

    if (analysisPayload.step !== "analysis") {
      return NextResponse.json(
        { success: false, error: "Log entry is not an analysis step" },
        { status: 422 },
      );
    }

    const url = analysisPayload.requestUrl;
    const timestamp = analysisPayload.timestamp ?? String((data as any).created_at);
    const analysisTime = new Date(timestamp).getTime();
    const windowMs = 10 * 60 * 1000;

    // Find matching recommendations payload
    const { data: recRows, error: recError } = await supabase
      .from("audit_logs")
      .select("id,created_at,payload")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (recError) {
      return NextResponse.json(
        { success: false, error: recError.message },
        { status: 500 },
      );
    }

    const recPayload = (recRows ?? [])
      .map((r) => (r as any).payload as PromptLogPayload | null)
      .filter(isPromptLogPayload)
      .filter((p) => p.step === "recommendations" && p.requestUrl === url)
      .filter((p) => {
        const t = new Date(p.timestamp).getTime();
        return Number.isFinite(t) && t >= analysisTime && t - analysisTime <= windowMs;
      })
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )[0];

    // Reconstruct AuditResult from the logged inputs/outputs
    const metrics = analysisPayload.structuredInput as any;
    const analysis = parseJsonFromRawOutput<any>(analysisPayload.rawOutput);
    const recommendations =
      parseJsonFromRawOutput<any[]>(recPayload?.rawOutput) ?? [];

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
        id: String((data as any).id),
        url,
        timestamp: String((data as any).created_at),
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
