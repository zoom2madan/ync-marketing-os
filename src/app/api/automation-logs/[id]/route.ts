import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getAutomationLogById } from "@/lib/db/automation-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;
    const logId = parseInt(id, 10);

    if (isNaN(logId)) {
      return NextResponse.json(
        { error: "Invalid log ID" },
        { status: 400 }
      );
    }

    const log = await getAutomationLogById(logId);

    if (!log) {
      return NextResponse.json(
        { error: "Automation log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching automation log:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation log" },
      { status: 500 }
    );
  }
}

