import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { assignLeads } from "@/lib/db/queries";
import { z } from "zod";

const bulkAssignSchema = z.object({
  leadIds: z.array(z.number()).min(1, "At least one lead must be selected"),
  assignedTo: z.number(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;

  // Only admins can assign leads
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can assign leads" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = bulkAssignSchema.parse(body);

    const updatedCount = await assignLeads(
      validatedData.leadIds,
      validatedData.assignedTo
    );

    return NextResponse.json({
      success: true,
      message: `${updatedCount} lead(s) assigned successfully`,
      count: updatedCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error assigning leads:", error);
    return NextResponse.json(
      { error: "Failed to assign leads" },
      { status: 500 }
    );
  }
}

