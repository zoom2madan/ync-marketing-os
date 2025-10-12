import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { createLead, upsertLeadProcess, updateLead } from "@/lib/db/queries";

const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().optional(),
  request: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;

  try {
    const body = await request.json();
    const validatedData = createLeadSchema.parse(body);

    // Create lead
    const lead = await createLead({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email || undefined,
      mobile: validatedData.mobile,
      request: validatedData.request,
    });

    // Auto-assign to creating user if they're an agent
    if (session.user.role === "agent") {
      await updateLead(lead.id, { assignedTo: session.user.id });
    }

    // Create initial lead process with "New" stage
    await upsertLeadProcess({
      leadId: lead.id,
      stage: "New",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        leadId: lead.id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Lead creation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create lead",
      },
      { status: 500 }
    );
  }
}

