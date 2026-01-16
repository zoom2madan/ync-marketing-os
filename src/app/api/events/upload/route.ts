import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { bulkCreateFunnelEvents } from "@/lib/db/funnel-event-queries";
import type { CreateFunnelEventByEmailRequest, FunnelType } from "@/types";

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or invalid" },
        { status: 400 }
      );
    }

    // Transform CSV rows to event requests
    const events: CreateFunnelEventByEmailRequest[] = rows
      .filter((row) => row.email || row.customer_email)
      .map((row) => ({
        customerEmail: row.email || row.customer_email,
        funnelType: (row.funnel_type || row.funneltype || "sales") as FunnelType,
        fromStage: row.from_stage || row.fromstage || undefined,
        toStage: row.to_stage || row.tostage || "",
        sourceUpdatedAt: row.source_updated_at || row.sourceupdatedat || undefined,
      }))
      .filter((event) => event.toStage);

    if (events.length === 0) {
      return NextResponse.json(
        { error: "No valid events found (email and to_stage are required)" },
        { status: 400 }
      );
    }

    const result = await bulkCreateFunnelEvents(events);

    return NextResponse.json({
      message: "Upload completed",
      created: result.created,
      total: events.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Error uploading funnel events:", error);
    return NextResponse.json(
      { error: "Failed to process CSV upload" },
      { status: 500 }
    );
  }
}

