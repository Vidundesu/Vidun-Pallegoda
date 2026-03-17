import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/db/supabaseServer";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,created_at,payload")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const normalized = (data ?? []).map((row) => {
      return {
        id: String((row as any).id),
        timestamp: String((row as any).created_at),
        payload: (row as any).payload ?? null,
      };
    });

    const payload = Buffer.from(JSON.stringify(normalized, null, 2), "utf8");

    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="audit-runs.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to download log file",
      },
      { status: 500 },
    );
  }
}
