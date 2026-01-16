import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getFunnelEvents, createFunnelEvent } from "@/lib/db/funnel-event-queries";
import type { FunnelEventSearchParams, CreateFunnelEventRequest } from "@/types";

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
    const params: FunnelEventSearchParams = {
      customerId: searchParams.get("customerId")
        ? parseInt(searchParams.get("customerId")!, 10)
        : undefined,
      customerEmail: searchParams.get("customerEmail") || undefined,
      funnelType: (searchParams.get("funnelType") as "sales" | "service-delivery") || undefined,
      fromStage: searchParams.get("fromStage") || undefined,
      toStage: searchParams.get("toStage") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
    };

    const result = await getFunnelEvents(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching funnel events:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnel events" },
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
    const body: CreateFunnelEventRequest = await request.json();

    if (!body.customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!body.funnelType) {
      return NextResponse.json(
        { error: "Funnel type is required" },
        { status: 400 }
      );
    }

    if (!body.toStage) {
      return NextResponse.json(
        { error: "To stage is required" },
        { status: 400 }
      );
    }

    const event = await createFunnelEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating funnel event:", error);
    return NextResponse.json(
      { error: "Failed to create funnel event" },
      { status: 500 }
    );
  }
}

