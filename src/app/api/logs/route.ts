import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/db/supabaseServer";

type AuditLogPayload = {
  timestamp?: string;
  requestUrl?: string;
  step?: "analysis" | "recommendations";
};

export type LogRunListItem = {
  id: string;
  url: string;
  timestamp: string;
  hasRecommendations: boolean;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,created_at,payload")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const rows = (data ?? []).map((row) => {
      const payload = (row as any).payload as AuditLogPayload | null;
      return {
        id: String((row as any).id),
        createdAt: String((row as any).created_at),
        payload,
      };
    });

    const runs: LogRunListItem[] = [];
    const windowMs = 10 * 60 * 1000;

    for (const row of rows) {
      if (!row.payload || row.payload.step !== "analysis") continue;

      const timestamp = row.payload.timestamp ?? row.createdAt;
      const url = row.payload.requestUrl ?? "";
      if (!url) continue;

      const analysisTime = new Date(timestamp).getTime();
      const hasRecommendations = rows.some((r) => {
        if (!r.payload || r.payload.step !== "recommendations") return false;
        if ((r.payload.requestUrl ?? "") !== url) return false;
        const t = new Date(r.payload.timestamp ?? r.createdAt).getTime();
        return t >= analysisTime && t - analysisTime <= windowMs;
      });

      runs.push({
        id: row.id,
        url,
        timestamp,
        hasRecommendations,
      });
    }

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
