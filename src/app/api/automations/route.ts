import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getAutomations, createAutomation } from "@/lib/db/automation-queries";
import type { AutomationSearchParams, CreateAutomationRequest } from "@/types";

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

    const params: AutomationSearchParams = {
      search: searchParams.get("search") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      segmentId: searchParams.get("segmentId")
        ? parseInt(searchParams.get("segmentId")!, 10)
        : undefined,
      templateId: searchParams.get("templateId")
        ? parseInt(searchParams.get("templateId")!, 10)
        : undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
    };

    const result = await getAutomations(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body: CreateAutomationRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.customerSegmentId) {
      return NextResponse.json(
        { error: "Customer segment is required" },
        { status: 400 }
      );
    }

    if (!body.messageTemplateId) {
      return NextResponse.json(
        { error: "Message template is required" },
        { status: 400 }
      );
    }

    if (!body.cron) {
      return NextResponse.json(
        { error: "CRON expression is required" },
        { status: 400 }
      );
    }

    const automation = await createAutomation(body);
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}

