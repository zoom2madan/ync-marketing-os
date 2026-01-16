import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import {
  getSegmentById,
  getCustomersInSegment,
  bulkAddCustomersToSegment,
  clearSegmentCustomers,
} from "@/lib/db/segment-queries";
import { getCustomerByEmail } from "@/lib/db/customer-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;
    const segmentId = parseInt(id, 10);

    if (isNaN(segmentId)) {
      return NextResponse.json(
        { error: "Invalid segment ID" },
        { status: 400 }
      );
    }

    const segment = await getSegmentById(segmentId);
    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const customers = await getCustomersInSegment(segment, page, limit);
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching segment customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment customers" },
      { status: 500 }
    );
  }
}

// For adding customers to manual segments via CSV upload
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;
    const segmentId = parseInt(id, 10);

    if (isNaN(segmentId)) {
      return NextResponse.json(
        { error: "Invalid segment ID" },
        { status: 400 }
      );
    }

    const segment = await getSegmentById(segmentId);
    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    if (segment.type !== "manual") {
      return NextResponse.json(
        { error: "Can only add customers to manual segments" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const replaceExisting = formData.get("replace") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file is empty or invalid" },
        { status: 400 }
      );
    }

    // Parse CSV - expect either customer_id or email column
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idIndex = headers.findIndex((h) => h === "customer_id" || h === "id");
    const emailIndex = headers.findIndex((h) => h === "email");

    if (idIndex === -1 && emailIndex === -1) {
      return NextResponse.json(
        { error: "CSV must have either customer_id or email column" },
        { status: 400 }
      );
    }

    // Collect customer IDs
    const customerIds: number[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      if (idIndex !== -1 && values[idIndex]) {
        const customerId = parseInt(values[idIndex], 10);
        if (!isNaN(customerId)) {
          customerIds.push(customerId);
        }
      } else if (emailIndex !== -1 && values[emailIndex]) {
        const customer = await getCustomerByEmail(values[emailIndex]);
        if (customer) {
          customerIds.push(customer.id);
        } else {
          errors.push(`Customer not found: ${values[emailIndex]}`);
        }
      }
    }

    if (customerIds.length === 0) {
      return NextResponse.json(
        { error: "No valid customer IDs found in CSV" },
        { status: 400 }
      );
    }

    // Clear existing if requested
    if (replaceExisting) {
      await clearSegmentCustomers(segmentId);
    }

    const result = await bulkAddCustomersToSegment(segmentId, customerIds);

    return NextResponse.json({
      message: "Upload completed",
      added: result.added,
      total: customerIds.length,
      errors: [...errors, ...result.errors].length > 0 
        ? [...errors, ...result.errors] 
        : undefined,
    });
  } catch (error) {
    console.error("Error uploading segment customers:", error);
    return NextResponse.json(
      { error: "Failed to process CSV upload" },
      { status: 500 }
    );
  }
}

