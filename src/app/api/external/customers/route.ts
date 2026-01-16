import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth/api-key";
import {
  createCustomerWithAttributes,
  bulkCreateCustomers,
  getCustomerByEmail,
  getCustomerWithAttributes,
} from "@/lib/db/customer-queries";
import type { CreateCustomerRequest } from "@/types";

/**
 * External API for publishing customer data
 * Requires X-API-Key header for authentication
 */

export async function POST(request: NextRequest) {
  const authResult = await requireApiKey(request);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();

    // Check if it's a bulk request (array) or single customer
    if (Array.isArray(body)) {
      // Bulk create
      const customers: CreateCustomerRequest[] = body;

      if (customers.length === 0) {
        return NextResponse.json(
          { error: "Empty array provided" },
          { status: 400 }
        );
      }

      // Validate all customers have email
      const invalidCustomers = customers.filter((c) => !c.email);
      if (invalidCustomers.length > 0) {
        return NextResponse.json(
          { error: "All customers must have an email address" },
          { status: 400 }
        );
      }

      const result = await bulkCreateCustomers(customers);

      return NextResponse.json({
        message: "Bulk operation completed",
        created: result.created,
        updated: result.updated,
        total: customers.length,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } else {
      // Single customer
      const customerData: CreateCustomerRequest = body;

      if (!customerData.email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      const customer = await createCustomerWithAttributes(customerData);

      return NextResponse.json(customer, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating customer (external API):", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireApiKey(request);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const customer = await getCustomerByEmail(email);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const customerWithAttributes = await getCustomerWithAttributes(customer.id);

    return NextResponse.json(customerWithAttributes);
  } catch (error) {
    console.error("Error fetching customer (external API):", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

