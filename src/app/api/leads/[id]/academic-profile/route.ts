import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { upsertAcademicProfile, getLeadById } from "@/lib/db/queries";
import { z } from "zod";

const academicProfileSchema = z.object({
  studyGrade: z.string().optional(),
  school: z.string().optional(),
  schoolBoard: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  studyStream: z.string().optional(),
  gpa: z.string().optional(),
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
    const validatedData = academicProfileSchema.parse(body);

    const result = await upsertAcademicProfile({
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

    console.error("Error upserting academic profile:", error);
    return NextResponse.json(
      { error: "Failed to save academic profile" },
      { status: 500 }
    );
  }
}

