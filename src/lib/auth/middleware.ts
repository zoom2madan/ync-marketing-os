import { auth } from "./config";
import { NextResponse } from "next/server";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }
  return { session };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.user) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }
  if (session.user.role !== "admin") {
    return {
      error: "Forbidden - Admin access required",
      status: 403,
    };
  }
  return { session };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json(
    { error: "Forbidden - Insufficient permissions" },
    { status: 403 }
  );
}

