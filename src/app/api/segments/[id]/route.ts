import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import {
  getSegmentWithCount,
  updateSegment,
  deleteSegment,
} from "@/lib/db/segment-queries";
import type { UpdateSegmentRequest } from "@/types";

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
    const segmentId = parseInt(id, 10);

    if (isNaN(segmentId)) {
      return NextResponse.json(
        { error: "Invalid segment ID" },
        { status: 400 }
      );
    }

    const segment = await getSegmentWithCount(segmentId);

    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Error fetching segment:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const segmentId = parseInt(id, 10);

    if (isNaN(segmentId)) {
      return NextResponse.json(
        { error: "Invalid segment ID" },
        { status: 400 }
      );
    }

    const body: UpdateSegmentRequest = await request.json();
    const segment = await updateSegment(segmentId, body);

    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const segmentId = parseInt(id, 10);

    if (isNaN(segmentId)) {
      return NextResponse.json(
        { error: "Invalid segment ID" },
        { status: 400 }
      );
    }

    const deleted = await deleteSegment(segmentId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Segment deleted" });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}

