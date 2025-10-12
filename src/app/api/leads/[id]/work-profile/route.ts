import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { upsertWorkProfile, getLeadById } from "@/lib/db/queries";
import { z } from "zod";

const workProfileSchema = z.object({
  workingAt: z.string().optional(),
  industry: z.string().optional(),
  workDesignation: z.string().optional(),
  yearsOfExperience: z.number().optional().nullable(),
  notes: z.string().optional(),
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
    const lead = await getLeadById(leadId, session.user.id, session.user.role);
    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = workProfileSchema.parse(body);

    const result = await upsertWorkProfile({
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

    console.error("Error upserting work profile:", error);
    return NextResponse.json(
      { error: "Failed to save work profile" },
      { status: 500 }
    );
  }
}

