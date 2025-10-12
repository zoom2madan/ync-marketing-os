import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead, createLeadAcquisition, upsertLeadProcess } from "@/lib/db/queries";

// Validation schema for lead submission
const leadSubmissionSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().optional(),
  request: z.string().optional(),
  acquisition: z
    .object({
      platform: z.string().optional(),
      campaign: z.string().optional(),
      adSet: z.string().optional(),
      ad: z.string().optional(),
      landingPageUrl: z.string().url().optional().or(z.literal("")),
      ipv4: z.string().optional(),
      ipv6: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = leadSubmissionSchema.parse(body);

    // Create lead
    const lead = await createLead({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email || undefined,
      mobile: validatedData.mobile,
      request: validatedData.request,
    });

    // Create lead acquisition record if provided
    if (validatedData.acquisition) {
      await createLeadAcquisition({
        leadId: lead.id,
        platform: validatedData.acquisition.platform || null,
        campaign: validatedData.acquisition.campaign || null,
        adSet: validatedData.acquisition.adSet || null,
        ad: validatedData.acquisition.ad || null,
        landingPageUrl: validatedData.acquisition.landingPageUrl || null,
        ipv4: validatedData.acquisition.ipv4 || null,
        ipv6: validatedData.acquisition.ipv6 || null,
      });
    }

    // Create initial lead process with "New" stage
    await upsertLeadProcess({
      leadId: lead.id,
      stage: "New",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead submitted successfully",
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
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Lead submission error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit lead",
      },
      { status: 500 }
    );
  }
}

