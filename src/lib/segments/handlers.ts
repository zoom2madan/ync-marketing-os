import sql from "@/lib/db/connection";
import type { SegmentHandler } from "@/types";

/**
 * Registry of segment handler functions.
 * Each handler should return an array of customer IDs.
 */
const segmentHandlers: Record<string, SegmentHandler> = {};

/**
 * Register a new segment handler function.
 */
export function registerSegmentHandler(name: string, handler: SegmentHandler): void {
  segmentHandlers[name] = handler;
}

/**
 * Execute a segment handler by name.
 */
export async function executeSegmentHandler(handlerName: string): Promise<number[]> {
  const handler = segmentHandlers[handlerName];
  if (!handler) {
    console.warn(`Segment handler not found: ${handlerName}`);
    return [];
  }

  try {
    return await handler();
  } catch (error) {
    console.error(`Error executing segment handler ${handlerName}:`, error);
    throw new Error(
      `Failed to execute segment handler: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get list of available segment handlers.
 */
export function getAvailableHandlers(): string[] {
  return Object.keys(segmentHandlers);
}

// ==================== BUILT-IN HANDLERS ====================

/**
 * Example: Get all customers who have completed the sales funnel
 */
registerSegmentHandler("sales_completed", async () => {
  const result = await sql`
    SELECT DISTINCT customer_id FROM funnel_events 
    WHERE funnel_type = 'sales' AND to_stage = 'completed'
  `;
  return result.map((r) => r.customer_id as number);
});

/**
 * Example: Get customers who signed up in the last 30 days
 */
registerSegmentHandler("recent_signups", async () => {
  const result = await sql`
    SELECT id FROM customers 
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;
  return result.map((r) => r.id as number);
});

/**
 * Example: Get customers with no funnel events
 */
registerSegmentHandler("no_activity", async () => {
  const result = await sql`
    SELECT c.id FROM customers c
    LEFT JOIN funnel_events fe ON c.id = fe.customer_id
    WHERE fe.id IS NULL
  `;
  return result.map((r) => r.id as number);
});

/**
 * Example: Get customers in the middle of sales funnel
 */
registerSegmentHandler("sales_in_progress", async () => {
  const result = await sql`
    SELECT DISTINCT fe.customer_id 
    FROM funnel_events fe
    WHERE fe.funnel_type = 'sales'
    AND fe.customer_id NOT IN (
      SELECT customer_id FROM funnel_events 
      WHERE funnel_type = 'sales' AND to_stage IN ('completed', 'lost', 'cancelled')
    )
  `;
  return result.map((r) => r.customer_id as number);
});

