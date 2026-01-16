import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { bulkCreateCustomers } from "@/lib/db/customer-queries";
import type { CreateCustomerRequest, FieldType } from "@/types";

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

function inferFieldType(value: string): FieldType {
  if (value === "true" || value === "false") return "boolean";
  if (!isNaN(Number(value)) && value !== "") return "numeric";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "timestamp";
  if (value.startsWith("[") && value.endsWith("]")) return "array";
  return "string";
}

function parseFieldValue(value: string, fieldType: FieldType): unknown {
  switch (fieldType) {
    case "boolean":
      return value === "true";
    case "numeric":
      return Number(value);
    case "array":
      try {
        return JSON.parse(value);
      } catch {
        return value.split(";").map((v) => v.trim());
      }
    default:
      return value;
  }
}

// Standard customer fields
const CUSTOMER_FIELDS = [
  "email",
  "first_name",
  "firstname",
  "last_name",
  "lastname",
  "lms_lead_id",
  "lmsleadid",
  "mobile",
  "phone",
  "source_created_at",
  "sourcecreatedat",
  "source_updated_at",
  "sourceupdatedat",
];

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

    // Transform CSV rows to customer requests
    const customers: CreateCustomerRequest[] = rows.map((row) => {
      const customer: CreateCustomerRequest = {
        email: row.email || "",
        firstName: row.first_name || row.firstname || undefined,
        lastName: row.last_name || row.lastname || undefined,
        lmsLeadId: row.lms_lead_id || row.lmsleadid || undefined,
        mobile: row.mobile || row.phone || undefined,
        sourceCreatedAt: row.source_created_at || row.sourcecreatedat || undefined,
        sourceUpdatedAt: row.source_updated_at || row.sourceupdatedat || undefined,
        attributes: [],
      };

      // Convert non-standard fields to attributes
      for (const [key, value] of Object.entries(row)) {
        if (value && !CUSTOMER_FIELDS.includes(key.toLowerCase())) {
          const fieldType = inferFieldType(value);
          customer.attributes!.push({
            fieldType,
            fieldName: key,
            fieldValue: parseFieldValue(value, fieldType),
          });
        }
      }

      return customer;
    });

    // Filter out rows without email
    const validCustomers = customers.filter((c) => c.email);

    if (validCustomers.length === 0) {
      return NextResponse.json(
        { error: "No valid customers found (email is required)" },
        { status: 400 }
      );
    }

    const result = await bulkCreateCustomers(validCustomers);

    return NextResponse.json({
      message: "Upload completed",
      created: result.created,
      updated: result.updated,
      total: validCustomers.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Error uploading customers:", error);
    return NextResponse.json(
      { error: "Failed to process CSV upload" },
      { status: 500 }
    );
  }
}

