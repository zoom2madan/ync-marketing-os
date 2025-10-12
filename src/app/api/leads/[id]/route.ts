import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getLeadById, updateLead } from "@/lib/db/queries";
import { z } from "zod";

const updateLeadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().optional(),
  request: z.string().optional(),
  assignedTo: z.number().optional().nullable(),
});

export async function GET(
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
    const lead = await getLeadById(
      leadId,
      session.user.id,
      session.user.role
    );

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const validatedData = updateLeadSchema.parse(body);

    // For agents, verify they own the lead
    if (session.user.role === "agent") {
      const existingLead = await getLeadById(
        leadId,
        session.user.id,
        session.user.role
      );
      if (!existingLead) {
        return NextResponse.json(
          { error: "Lead not found or not assigned to you" },
          { status: 404 }
        );
      }
    }

    const updatedLead = await updateLead(leadId, validatedData);

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

