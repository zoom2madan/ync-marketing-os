import sql from "./connection";
import type {
  FunnelEvent,
  FunnelEventWithCustomer,
  CreateFunnelEventRequest,
  CreateFunnelEventByEmailRequest,
  FunnelEventSearchParams,
  PaginatedResponse,
} from "@/types";
import { getCustomerByEmail } from "./customer-queries";

// Helper function to convert snake_case to camelCase
function toCamelCase<T>(obj: unknown): T {
  if (!obj) return obj as T;
  if (obj instanceof Date) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as T;
  }
  if (typeof obj === "object" && obj !== null) {
    const camelObj: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      camelObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    }
    return camelObj as T;
  }
  return obj as T;
}

// ==================== FUNNEL EVENT QUERIES ====================

export async function getFunnelEvents(
  params: FunnelEventSearchParams
): Promise<PaginatedResponse<FunnelEventWithCustomer>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.customerId) {
    whereClause += ` AND fe.customer_id = $${paramIndex}`;
    values.push(params.customerId);
    paramIndex++;
  }

  if (params.customerEmail) {
    whereClause += ` AND c.email ILIKE $${paramIndex}`;
    values.push(`%${params.customerEmail}%`);
    paramIndex++;
  }

  if (params.funnelType) {
    whereClause += ` AND fe.funnel_type = $${paramIndex}`;
    values.push(params.funnelType);
    paramIndex++;
  }

  if (params.fromStage) {
    whereClause += ` AND fe.from_stage = $${paramIndex}`;
    values.push(params.fromStage);
    paramIndex++;
  }

  if (params.toStage) {
    whereClause += ` AND fe.to_stage = $${paramIndex}`;
    values.push(params.toStage);
    paramIndex++;
  }

  if (params.dateFrom) {
    whereClause += ` AND fe.created_at >= $${paramIndex}`;
    values.push(params.dateFrom);
    paramIndex++;
  }

  if (params.dateTo) {
    whereClause += ` AND fe.created_at <= $${paramIndex}`;
    values.push(params.dateTo);
    paramIndex++;
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM funnel_events fe
    JOIN customers c ON fe.customer_id = c.id
    ${whereClause}
  `;
  const countResult = await sql.unsafe(countQuery, values);
  const total = parseInt(countResult[0].total, 10);

  // Get paginated data with customer info
  const dataQuery = `
    SELECT 
      fe.id,
      fe.customer_id,
      fe.funnel_type,
      fe.from_stage,
      fe.to_stage,
      fe.created_at,
      fe.source_updated_at,
      c.email as customer_email,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name
    FROM funnel_events fe
    JOIN customers c ON fe.customer_id = c.id
    ${whereClause}
    ORDER BY fe.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await sql.unsafe(dataQuery, [...values, limit, offset]);

  return {
    data: toCamelCase<FunnelEventWithCustomer[]>(dataResult),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getFunnelEventById(
  id: number
): Promise<FunnelEventWithCustomer | null> {
  const result = await sql`
    SELECT 
      fe.id,
      fe.customer_id,
      fe.funnel_type,
      fe.from_stage,
      fe.to_stage,
      fe.created_at,
      fe.source_updated_at,
      c.email as customer_email,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name
    FROM funnel_events fe
    JOIN customers c ON fe.customer_id = c.id
    WHERE fe.id = ${id}
  `;
  return result.length > 0 ? toCamelCase<FunnelEventWithCustomer>(result[0]) : null;
}

export async function createFunnelEvent(
  data: CreateFunnelEventRequest
): Promise<FunnelEvent> {
  const result = await sql`
    INSERT INTO funnel_events (customer_id, funnel_type, from_stage, to_stage, source_updated_at)
    VALUES (${data.customerId}, ${data.funnelType}, ${data.fromStage || null}, ${data.toStage}, ${data.sourceUpdatedAt || null})
    RETURNING *
  `;
  return toCamelCase<FunnelEvent>(result[0]);
}

export async function createFunnelEventByEmail(
  data: CreateFunnelEventByEmailRequest
): Promise<FunnelEvent | null> {
  const customer = await getCustomerByEmail(data.customerEmail);
  if (!customer) {
    return null;
  }

  return createFunnelEvent({
    customerId: customer.id,
    funnelType: data.funnelType,
    fromStage: data.fromStage,
    toStage: data.toStage,
    sourceUpdatedAt: data.sourceUpdatedAt,
  });
}

export async function getCustomerFunnelEvents(
  customerId: number
): Promise<FunnelEvent[]> {
  const result = await sql`
    SELECT * FROM funnel_events 
    WHERE customer_id = ${customerId}
    ORDER BY created_at DESC
  `;
  return toCamelCase<FunnelEvent[]>(result);
}

// ==================== BULK OPERATIONS ====================

export async function bulkCreateFunnelEvents(
  events: (CreateFunnelEventRequest | CreateFunnelEventByEmailRequest)[]
): Promise<{ created: number; errors: string[] }> {
  let created = 0;
  const errors: string[] = [];

  for (const eventData of events) {
    try {
      if ("customerEmail" in eventData) {
        const event = await createFunnelEventByEmail(eventData);
        if (event) {
          created++;
        } else {
          errors.push(`Customer not found for email: ${eventData.customerEmail}`);
        }
      } else {
        await createFunnelEvent(eventData);
        created++;
      }
    } catch (error) {
      const identifier =
        "customerEmail" in eventData
          ? eventData.customerEmail
          : `ID: ${eventData.customerId}`;
      errors.push(
        `Failed to create event for ${identifier}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { created, errors };
}

// ==================== ANALYTICS ====================

export async function getDistinctStages(
  funnelType?: string
): Promise<{ fromStages: string[]; toStages: string[] }> {
  let fromQuery = sql`SELECT DISTINCT from_stage FROM funnel_events WHERE from_stage IS NOT NULL`;
  let toQuery = sql`SELECT DISTINCT to_stage FROM funnel_events`;

  if (funnelType) {
    fromQuery = sql`SELECT DISTINCT from_stage FROM funnel_events WHERE from_stage IS NOT NULL AND funnel_type = ${funnelType}`;
    toQuery = sql`SELECT DISTINCT to_stage FROM funnel_events WHERE funnel_type = ${funnelType}`;
  }

  const [fromResult, toResult] = await Promise.all([fromQuery, toQuery]);

  return {
    fromStages: fromResult.map((r) => r.from_stage as string).sort(),
    toStages: toResult.map((r) => r.to_stage as string).sort(),
  };
}

