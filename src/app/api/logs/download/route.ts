import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOGS_DIR, "audit.log.json");

export async function GET(): Promise<NextResponse> {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json(
        { success: false, error: "Log file not found" },
        { status: 404 },
      );
    }

    const content = fs.readFileSync(LOG_FILE);

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": 'attachment; filename="audit.log.json"',
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
