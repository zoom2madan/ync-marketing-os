import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { updateLeadStage } from "@/lib/db/queries";
import { z } from "zod";
import type { LeadStage } from "@/types";

const bulkStatusSchema = z.object({
  leadIds: z.array(z.number()).min(1, "At least one lead must be selected"),
  stage: z.enum([
    "New",
    "Not Contactable",
    "Contacted",
    "Marketing Qualified",
    "Sales Qualified",
    "Prospecting",
    "Proposal Sent",
    "Negotiating",
    "Converted",
    "Lost",
    "Nurturing",
  ]),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const validatedData = bulkStatusSchema.parse(body);

    const updatedCount = await updateLeadStage(
      validatedData.leadIds,
      validatedData.stage as LeadStage
    );

    return NextResponse.json({
      success: true,
      message: `${updatedCount} lead(s) updated successfully`,
      count: updatedCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating lead status:", error);
    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    );
  }
}

