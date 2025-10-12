import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getLeadsForExport } from "@/lib/db/queries";
import { Parser } from "json2csv";
import { z } from "zod";

const exportSchema = z.object({
  leadIds: z.array(z.number()).min(1, "At least one lead must be selected"),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;

  try {
    const body = await request.json();
    const validatedData = exportSchema.parse(body);

    const leads = await getLeadsForExport(
      validatedData.leadIds,
      session.user.id,
      session.user.role
    );

    if (leads.length === 0) {
      return NextResponse.json({ error: "No leads found" }, { status: 404 });
    }

    // Flatten the data for CSV export
    const flattenedLeads = leads.map((lead) => ({
      ID: lead.id,
      "First Name": lead.firstName,
      "Last Name": lead.lastName,
      Email: lead.email || "",
      Mobile: lead.mobile || "",
      Request: lead.request || "",
      Stage: (lead as any).stage || "New",
      Platform: (lead as any).platform || "",
      Campaign: (lead as any).campaign || "",
      "Ad Set": (lead as any).adSet || "",
      Ad: (lead as any).ad || "",
      "Landing Page": (lead as any).landingPageUrl || "",
      Country: (lead as any).country || "",
      University: (lead as any).university || "",
      Level: (lead as any).level || "",
      Stream: (lead as any).stream || "",
      Subject: (lead as any).subject || "",
      "Target Intake": (lead as any).targetIntake || "",
      "Current Pursuit": (lead as any).currentPursuit || "",
      "Assigned To": (lead as any).assignedFirstName
        ? `${(lead as any).assignedFirstName} ${(lead as any).assignedLastName}`
        : "",
      "Created At": new Date(lead.createdAt).toISOString(),
      "Process Notes": (lead as any).processNotes || "",
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(flattenedLeads);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error exporting leads:", error);
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 }
    );
  }
}

