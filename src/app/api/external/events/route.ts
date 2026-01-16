import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth/api-key";
import {
  createFunnelEvent,
  createFunnelEventByEmail,
  bulkCreateFunnelEvents,
} from "@/lib/db/funnel-event-queries";
import type { CreateFunnelEventRequest, CreateFunnelEventByEmailRequest } from "@/types";

/**
 * External API for publishing funnel events
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

    // Check if it's a bulk request (array) or single event
    if (Array.isArray(body)) {
      // Bulk create
      const events = body as (CreateFunnelEventRequest | CreateFunnelEventByEmailRequest)[];

      if (events.length === 0) {
        return NextResponse.json(
          { error: "Empty array provided" },
          { status: 400 }
        );
      }

      const result = await bulkCreateFunnelEvents(events);

      return NextResponse.json({
        message: "Bulk operation completed",
        created: result.created,
        total: events.length,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } else {
      // Single event - check if using email or customerId
      if ("customerEmail" in body) {
        const eventData = body as CreateFunnelEventByEmailRequest;

        if (!eventData.customerEmail) {
          return NextResponse.json(
            { error: "Customer email is required" },
            { status: 400 }
          );
        }

        if (!eventData.funnelType) {
          return NextResponse.json(
            { error: "Funnel type is required" },
            { status: 400 }
          );
        }

        if (!eventData.toStage) {
          return NextResponse.json(
            { error: "To stage is required" },
            { status: 400 }
          );
        }

        const event = await createFunnelEventByEmail(eventData);

        if (!event) {
          return NextResponse.json(
            { error: "Customer not found with the provided email" },
            { status: 404 }
          );
        }

        return NextResponse.json(event, { status: 201 });
      } else {
        const eventData = body as CreateFunnelEventRequest;

        if (!eventData.customerId) {
          return NextResponse.json(
            { error: "Customer ID or email is required" },
            { status: 400 }
          );
        }

        if (!eventData.funnelType) {
          return NextResponse.json(
            { error: "Funnel type is required" },
            { status: 400 }
          );
        }

        if (!eventData.toStage) {
          return NextResponse.json(
            { error: "To stage is required" },
            { status: 400 }
          );
        }

        const event = await createFunnelEvent(eventData);

        return NextResponse.json(event, { status: 201 });
      }
    }
  } catch (error) {
    console.error("Error creating funnel event (external API):", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

