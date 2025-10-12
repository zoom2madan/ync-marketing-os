import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { upsertDemographicProfile, getLeadById } from "@/lib/db/queries";
import { z } from "zod";

const demographicProfileSchema = z.object({
  cityTier: z.string().optional(),
  familyIncomeRange: z.string().optional(),
  sourceOfIncome: z.string().optional(),
  willTakeEduLoan: z.boolean().optional().nullable(),
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
    const validatedData = demographicProfileSchema.parse(body);

    const result = await upsertDemographicProfile({
      leadId,
      cityTier: validatedData.cityTier || null,
      familyIncomeRange: validatedData.familyIncomeRange || null,
      sourceOfIncome: validatedData.sourceOfIncome || null,
      willTakeEduLoan: validatedData.willTakeEduLoan ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error upserting demographic profile:", error);
    return NextResponse.json(
      { error: "Failed to save demographic profile" },
      { status: 500 }
    );
  }
}

