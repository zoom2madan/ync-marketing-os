import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getAvailableHandlers } from "@/lib/segments/handlers";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const handlers = getAvailableHandlers();
    return NextResponse.json(handlers);
  } catch (error) {
    console.error("Error fetching segment handlers:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment handlers" },
      { status: 500 }
    );
  }
}

