import { NextResponse } from "next/server";

/**
 * Validates the API key from the request headers.
 * Used for external API endpoints.
 */
export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get("X-API-Key");
  const expectedApiKey = process.env.EXTERNAL_API_KEY;

  if (!expectedApiKey) {
    console.error("EXTERNAL_API_KEY environment variable is not set");
    return false;
  }

  return apiKey === expectedApiKey;
}

/**
 * Middleware helper that returns an error response if API key is invalid.
 */
export async function requireApiKey(
  request: Request
): Promise<{ error: string; status: number } | { valid: true }> {
  if (!validateApiKey(request)) {
    return {
      error: "Invalid or missing API key",
      status: 401,
    };
  }
  return { valid: true };
}

/**
 * Returns a 401 Unauthorized response.
 */
export function unauthorizedApiKey() {
  return NextResponse.json(
    { error: "Invalid or missing API key" },
    { status: 401 }
  );
}

