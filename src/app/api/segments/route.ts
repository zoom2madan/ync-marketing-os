import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getSegments, createSegment, getAllSegments } from "@/lib/db/segment-queries";
import type { SegmentSearchParams, CreateSegmentRequest, SegmentType } from "@/types";

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
    
    // Check if requesting all segments (for dropdowns)
    if (searchParams.get("all") === "true") {
      const segments = await getAllSegments();
      return NextResponse.json(segments);
    }

    const params: SegmentSearchParams = {
      search: searchParams.get("search") || undefined,
      type: (searchParams.get("type") as SegmentType) || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
    };

    const result = await getSegments(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
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
    const body: CreateSegmentRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    // Validate based on type
    if (body.type === "sql" && !body.selectionSql) {
      return NextResponse.json(
        { error: "Selection SQL is required for SQL type segments" },
        { status: 400 }
      );
    }

    if (body.type === "function" && !body.handlerFunction) {
      return NextResponse.json(
        { error: "Handler function is required for function type segments" },
        { status: 400 }
      );
    }

    const segment = await createSegment(body);
    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}

