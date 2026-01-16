import sql from "./connection";
import type {
  CustomerSegment,
  CustomerSegmentWithCount,
  CreateSegmentRequest,
  UpdateSegmentRequest,
  SegmentSearchParams,
  PaginatedResponse,
  Customer,
} from "@/types";

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

// ==================== SEGMENT QUERIES ====================

export async function getSegments(
  params: SegmentSearchParams
): Promise<PaginatedResponse<CustomerSegmentWithCount>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.type) {
    whereClause += ` AND type = $${paramIndex}`;
    values.push(params.type);
    paramIndex++;
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM customer_segments ${whereClause}`;
  const countResult = await sql.unsafe(countQuery, values);
  const total = parseInt(countResult[0].total, 10);

  // Get paginated data with customer count for manual segments
  const dataQuery = `
    SELECT 
      cs.*,
      COALESCE(
        (SELECT COUNT(*) FROM customer_segment_customer_list WHERE customer_segment_id = cs.id),
        0
      )::int as customer_count
    FROM customer_segments cs
    ${whereClause}
    ORDER BY cs.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await sql.unsafe(dataQuery, [...values, limit, offset]);

  return {
    data: toCamelCase<CustomerSegmentWithCount[]>(dataResult),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSegmentById(id: number): Promise<CustomerSegment | null> {
  const result = await sql`
    SELECT * FROM customer_segments WHERE id = ${id}
  `;
  return result.length > 0 ? toCamelCase<CustomerSegment>(result[0]) : null;
}

export async function getSegmentWithCount(
  id: number
): Promise<CustomerSegmentWithCount | null> {
  const result = await sql`
    SELECT 
      cs.*,
      COALESCE(
        (SELECT COUNT(*) FROM customer_segment_customer_list WHERE customer_segment_id = cs.id),
        0
      )::int as customer_count
    FROM customer_segments cs
    WHERE cs.id = ${id}
  `;
  return result.length > 0 ? toCamelCase<CustomerSegmentWithCount>(result[0]) : null;
}

export async function createSegment(data: CreateSegmentRequest): Promise<CustomerSegment> {
  const result = await sql`
    INSERT INTO customer_segments (name, description, type, selection_sql, handler_function)
    VALUES (
      ${data.name}, 
      ${data.description || null}, 
      ${data.type}, 
      ${data.selectionSql || null}, 
      ${data.handlerFunction || null}
    )
    RETURNING *
  `;
  return toCamelCase<CustomerSegment>(result[0]);
}

export async function updateSegment(
  id: number,
  data: UpdateSegmentRequest
): Promise<CustomerSegment | null> {
  const segment = await getSegmentById(id);
  if (!segment) return null;

  const result = await sql`
    UPDATE customer_segments SET
      name = ${data.name ?? segment.name},
      description = ${data.description ?? segment.description},
      type = ${data.type ?? segment.type},
      selection_sql = ${data.selectionSql ?? segment.selectionSql},
      handler_function = ${data.handlerFunction ?? segment.handlerFunction}
    WHERE id = ${id}
    RETURNING *
  `;
  return toCamelCase<CustomerSegment>(result[0]);
}

export async function deleteSegment(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM customer_segments WHERE id = ${id} RETURNING id
  `;
  return result.length > 0;
}

// ==================== SEGMENT CUSTOMER LIST QUERIES ====================

export async function getManualSegmentCustomerIds(segmentId: number): Promise<number[]> {
  const result = await sql`
    SELECT customer_id FROM customer_segment_customer_list 
    WHERE customer_segment_id = ${segmentId}
  `;
  return result.map((r) => r.customer_id as number);
}

export async function getManualSegmentCustomers(
  segmentId: number,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Customer>> {
  const offset = (page - 1) * limit;

  const countResult = await sql`
    SELECT COUNT(*) as total FROM customer_segment_customer_list 
    WHERE customer_segment_id = ${segmentId}
  `;
  const total = parseInt(countResult[0].total as string, 10);

  const result = await sql`
    SELECT c.* 
    FROM customers c
    JOIN customer_segment_customer_list csl ON c.id = csl.customer_id
    WHERE csl.customer_segment_id = ${segmentId}
    ORDER BY c.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    data: toCamelCase<Customer[]>(result),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function addCustomerToSegment(
  segmentId: number,
  customerId: number
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO customer_segment_customer_list (customer_segment_id, customer_id)
      VALUES (${segmentId}, ${customerId})
      ON CONFLICT (customer_segment_id, customer_id) DO NOTHING
    `;
    return true;
  } catch {
    return false;
  }
}

export async function removeCustomerFromSegment(
  segmentId: number,
  customerId: number
): Promise<boolean> {
  const result = await sql`
    DELETE FROM customer_segment_customer_list 
    WHERE customer_segment_id = ${segmentId} AND customer_id = ${customerId}
    RETURNING id
  `;
  return result.length > 0;
}

export async function bulkAddCustomersToSegment(
  segmentId: number,
  customerIds: number[]
): Promise<{ added: number; errors: string[] }> {
  let added = 0;
  const errors: string[] = [];

  for (const customerId of customerIds) {
    try {
      const success = await addCustomerToSegment(segmentId, customerId);
      if (success) added++;
    } catch (error) {
      errors.push(
        `Failed to add customer ${customerId}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { added, errors };
}

export async function clearSegmentCustomers(segmentId: number): Promise<number> {
  const result = await sql`
    DELETE FROM customer_segment_customer_list 
    WHERE customer_segment_id = ${segmentId}
    RETURNING id
  `;
  return result.length;
}

// ==================== SEGMENT RESOLUTION ====================

export async function executeSqlSegment(selectionSql: string): Promise<number[]> {
  try {
    // The SQL should return customer_id column
    const result = await sql.unsafe(selectionSql);
    return result.map((r) => {
      // Handle different possible column names
      const id = r.customer_id ?? r.id ?? r.customerId;
      return typeof id === "number" ? id : parseInt(id as string, 10);
    }).filter((id) => !isNaN(id));
  } catch (error) {
    console.error("Error executing segment SQL:", error);
    throw new Error(`Failed to execute segment SQL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function getCustomersInSegment(
  segment: CustomerSegment,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Customer>> {
  let customerIds: number[];

  switch (segment.type) {
    case "manual":
      return getManualSegmentCustomers(segment.id, page, limit);

    case "sql":
      if (!segment.selectionSql) {
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      customerIds = await executeSqlSegment(segment.selectionSql);
      break;

    case "function":
      // Function-based segments are handled by segment handlers
      // For now, return empty - handlers are registered separately
      const { executeSegmentHandler } = await import("@/lib/segments/handlers");
      if (segment.handlerFunction) {
        customerIds = await executeSegmentHandler(segment.handlerFunction);
      } else {
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      break;

    default:
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  if (customerIds.length === 0) {
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  const total = customerIds.length;
  const offset = (page - 1) * limit;
  const paginatedIds = customerIds.slice(offset, offset + limit);

  if (paginatedIds.length === 0) {
    return { data: [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  const result = await sql`
    SELECT * FROM customers 
    WHERE id = ANY(${paginatedIds})
    ORDER BY created_at DESC
  `;

  return {
    data: toCamelCase<Customer[]>(result),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAllCustomerIdsInSegment(segment: CustomerSegment): Promise<number[]> {
  switch (segment.type) {
    case "manual":
      return getManualSegmentCustomerIds(segment.id);

    case "sql":
      if (!segment.selectionSql) return [];
      return executeSqlSegment(segment.selectionSql);

    case "function":
      if (!segment.handlerFunction) return [];
      const { executeSegmentHandler } = await import("@/lib/segments/handlers");
      return executeSegmentHandler(segment.handlerFunction);

    default:
      return [];
  }
}

// ==================== ALL SEGMENTS (for dropdowns) ====================

export async function getAllSegments(): Promise<Pick<CustomerSegment, "id" | "name" | "type">[]> {
  const result = await sql`
    SELECT id, name, type FROM customer_segments ORDER BY name
  `;
  return toCamelCase(result);
}

