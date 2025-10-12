import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getLeads } from "@/lib/db/queries";
import type { LeadFilters } from "@/types";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  // Build filters
  const filters: LeadFilters = {};
  
  if (searchParams.get("stage")) {
    filters.stage = searchParams.get("stage") as any;
  }
  if (searchParams.get("platform")) {
    filters.platform = searchParams.get("platform")!;
  }
  if (searchParams.get("assignedTo")) {
    filters.assignedTo = parseInt(searchParams.get("assignedTo")!);
  }
  if (searchParams.get("dateFrom")) {
    filters.dateFrom = searchParams.get("dateFrom")!;
  }
  if (searchParams.get("dateTo")) {
    filters.dateTo = searchParams.get("dateTo")!;
  }
  if (searchParams.get("search")) {
    filters.search = searchParams.get("search")!;
  }

  try {
    const result = await getLeads(
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
      session.user.id,
      session.user.role
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

