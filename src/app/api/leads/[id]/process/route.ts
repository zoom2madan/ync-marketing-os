import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { upsertLeadProcess, getLeadById } from "@/lib/db/queries";
import { z } from "zod";
import type { LeadStage } from "@/types";

const leadProcessSchema = z.object({
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
    const validatedData = leadProcessSchema.parse(body);

    const result = await upsertLeadProcess({
      leadId,
      stage: validatedData.stage as LeadStage,
      notes: validatedData.notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error upserting lead process:", error);
    return NextResponse.json(
      { error: "Failed to save lead process" },
      { status: 500 }
    );
  }
}

