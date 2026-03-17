import { NextRequest, NextResponse } from "next/server";

import type { AuditResult } from "@/core/types";

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;

    // Re-use our own API (keeps logic in one place)
    const origin = req.nextUrl.origin;
    const detailRes = await fetch(`${origin}/api/logs/${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!detailRes.ok) {
      const text = await detailRes.text();
      return new NextResponse(text, { status: detailRes.status });
    }

    const json = (await detailRes.json()) as {
      success: true;
      data: { id: string; url: string; timestamp: string; result: AuditResult };
    };

    const { url, timestamp, result } = json.data;
    const safeUrlSlug = url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(0, 80);

    const filename = `audit-${timestamp}-${safeUrlSlug}.json`;
    const payload = Buffer.from(
      JSON.stringify({ id, url, timestamp, result }, null, 2),
      "utf8",
    );

    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to download log run",
      },
      { status: 500 },
    );
  }
}
