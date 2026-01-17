import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getAllAutomationLogs } from "@/lib/db/automation-queries";
import type { AutomationLogSearchParams, AutomationLogStatus } from "@/types";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: AutomationLogSearchParams = {
      automationId: searchParams.get("automationId")
        ? parseInt(searchParams.get("automationId")!, 10)
        : undefined,
      status: searchParams.get("status") as AutomationLogStatus | undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
    };

    const logs = await getAllAutomationLogs(params);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching automation logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation logs" },
      { status: 500 }
    );
  }
}

