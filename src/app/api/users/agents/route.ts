import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getAllAgents } from "@/lib/db/queries";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const agents = await getAllAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

