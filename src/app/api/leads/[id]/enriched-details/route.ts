import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { upsertLeadEnrichedDetails, getLeadById } from "@/lib/db/queries";
import { z } from "zod";

const enrichedDetailsSchema = z.object({
  country: z.string().optional(),
  university: z.string().optional(),
  level: z.string().optional(),
  stream: z.string().optional(),
  subject: z.string().optional(),
  targetIntake: z.string().optional(),
  currentPursuit: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;
  const { id } = await params;
  const leadId = parseInt(id);

  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
  }

  try {
    // Verify lead access
    const lead = await getLeadById(leadId, session.user.id, session.user.role);
    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = enrichedDetailsSchema.parse(body);

    const result = await upsertLeadEnrichedDetails({
      leadId,
      ...validatedData,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error upserting enriched details:", error);
    return NextResponse.json(
      { error: "Failed to save enriched details" },
      { status: 500 }
    );
  }
}

