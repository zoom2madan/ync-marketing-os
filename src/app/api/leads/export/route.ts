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
    const flattenedLeads = leads.map((lead) => {
      const leadRecord = lead as unknown as Record<string, unknown>;
      return {
        ID: lead.id,
        "First Name": lead.firstName,
        "Last Name": lead.lastName,
        Email: lead.email || "",
        Mobile: lead.mobile || "",
        Request: lead.request || "",
        Stage: (leadRecord.stage as string) || "New",
        Platform: (leadRecord.platform as string) || "",
        Campaign: (leadRecord.campaign as string) || "",
        "Ad Set": (leadRecord.adSet as string) || "",
        Ad: (leadRecord.ad as string) || "",
        "Landing Page": (leadRecord.landingPageUrl as string) || "",
        Country: (leadRecord.country as string) || "",
        University: (leadRecord.university as string) || "",
        Level: (leadRecord.level as string) || "",
        Stream: (leadRecord.stream as string) || "",
        Subject: (leadRecord.subject as string) || "",
        "Target Intake": (leadRecord.targetIntake as string) || "",
        "Current Pursuit": (leadRecord.currentPursuit as string) || "",
        "Assigned To": leadRecord.assignedFirstName
          ? `${leadRecord.assignedFirstName as string} ${leadRecord.assignedLastName as string}`
          : "",
        "Created At": new Date(lead.createdAt).toISOString(),
        "Process Notes": (leadRecord.processNotes as string) || "",
      };
    });

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
        { error: "Validation error", details: error.issues },
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

