import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getTemplates, createTemplate, getAllTemplates } from "@/lib/db/template-queries";
import type { TemplateSearchParams, CreateTemplateRequest, MessageType } from "@/types";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Check if requesting all templates (for dropdowns)
    if (searchParams.get("all") === "true") {
      const templates = await getAllTemplates();
      return NextResponse.json(templates);
    }

    const params: TemplateSearchParams = {
      search: searchParams.get("search") || undefined,
      type: (searchParams.get("type") as MessageType) || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
    };

    const result = await getTemplates(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
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
    const body: CreateTemplateRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    if (!body.message) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (body.type === "email" && !body.subject) {
      return NextResponse.json(
        { error: "Subject is required for email templates" },
        { status: 400 }
      );
    }

    const template = await createTemplate(body);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

