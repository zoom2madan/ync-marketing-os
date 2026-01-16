import sql from "./connection";
import type {
  Automation,
  AutomationWithRelations,
  AutomationLog,
  AutomationLogWithDetails,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  AutomationSearchParams,
  AutomationLogStatus,
  PaginatedResponse,
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

// ==================== AUTOMATION QUERIES ====================

export async function getAutomations(
  params: AutomationSearchParams
): Promise<PaginatedResponse<AutomationWithRelations>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (a.name ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`;
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  if (typeof params.isActive === "boolean") {
    whereClause += ` AND a.is_active = $${paramIndex}`;
    values.push(params.isActive);
    paramIndex++;
  }

  if (params.segmentId) {
    whereClause += ` AND a.customer_segment_id = $${paramIndex}`;
    values.push(params.segmentId);
    paramIndex++;
  }

  if (params.templateId) {
    whereClause += ` AND a.message_template_id = $${paramIndex}`;
    values.push(params.templateId);
    paramIndex++;
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM automations a 
    ${whereClause}
  `;
  const countResult = await sql.unsafe(countQuery, values);
  const total = parseInt(countResult[0].total, 10);

  // Get paginated data with relations
  const dataQuery = `
    SELECT 
      a.*,
      cs.name as segment_name,
      mt.name as template_name,
      mt.type as template_type
    FROM automations a
    LEFT JOIN customer_segments cs ON a.customer_segment_id = cs.id
    LEFT JOIN message_templates mt ON a.message_template_id = mt.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await sql.unsafe(dataQuery, [...values, limit, offset]);

  return {
    data: toCamelCase<AutomationWithRelations[]>(dataResult),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAutomationById(id: number): Promise<Automation | null> {
  const result = await sql`
    SELECT * FROM automations WHERE id = ${id}
  `;
  return result.length > 0 ? toCamelCase<Automation>(result[0]) : null;
}

export async function getAutomationWithRelations(
  id: number
): Promise<AutomationWithRelations | null> {
  const result = await sql`
    SELECT 
      a.*,
      cs.name as segment_name,
      mt.name as template_name,
      mt.type as template_type
    FROM automations a
    LEFT JOIN customer_segments cs ON a.customer_segment_id = cs.id
    LEFT JOIN message_templates mt ON a.message_template_id = mt.id
    WHERE a.id = ${id}
  `;
  return result.length > 0 ? toCamelCase<AutomationWithRelations>(result[0]) : null;
}

export async function createAutomation(
  data: CreateAutomationRequest
): Promise<Automation> {
  const result = await sql`
    INSERT INTO automations (
      name, 
      description, 
      customer_segment_id, 
      message_template_id, 
      cron, 
      is_active
    )
    VALUES (
      ${data.name}, 
      ${data.description || null}, 
      ${data.customerSegmentId}, 
      ${data.messageTemplateId}, 
      ${data.cron}, 
      ${data.isActive ?? true}
    )
    RETURNING *
  `;
  return toCamelCase<Automation>(result[0]);
}

export async function updateAutomation(
  id: number,
  data: UpdateAutomationRequest
): Promise<Automation | null> {
  const automation = await getAutomationById(id);
  if (!automation) return null;

  const result = await sql`
    UPDATE automations SET
      name = ${data.name ?? automation.name},
      description = ${data.description ?? automation.description},
      customer_segment_id = ${data.customerSegmentId ?? automation.customerSegmentId},
      message_template_id = ${data.messageTemplateId ?? automation.messageTemplateId},
      cron = ${data.cron ?? automation.cron},
      is_active = ${data.isActive ?? automation.isActive}
    WHERE id = ${id}
    RETURNING *
  `;
  return toCamelCase<Automation>(result[0]);
}

export async function deleteAutomation(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM automations WHERE id = ${id} RETURNING id
  `;
  return result.length > 0;
}

export async function toggleAutomationActive(
  id: number,
  isActive: boolean
): Promise<Automation | null> {
  const result = await sql`
    UPDATE automations SET is_active = ${isActive}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.length > 0 ? toCamelCase<Automation>(result[0]) : null;
}

// ==================== AUTOMATION LOGS ====================

export async function getAutomationLogs(
  automationId: number,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<AutomationLog>> {
  const offset = (page - 1) * limit;

  const countResult = await sql`
    SELECT COUNT(*) as total FROM automation_logs WHERE automation_id = ${automationId}
  `;
  const total = parseInt(countResult[0].total as string, 10);

  const result = await sql`
    SELECT * FROM automation_logs 
    WHERE automation_id = ${automationId}
    ORDER BY started_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    data: toCamelCase<AutomationLog[]>(result),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createAutomationLog(
  automationId: number,
  status: AutomationLogStatus
): Promise<AutomationLog> {
  const result = await sql`
    INSERT INTO automation_logs (automation_id, status)
    VALUES (${automationId}, ${status})
    RETURNING *
  `;
  return toCamelCase<AutomationLog>(result[0]);
}

export async function updateAutomationLog(
  logId: number,
  status: AutomationLogStatus,
  customersProcessed: number,
  errorMessage?: string
): Promise<AutomationLog | null> {
  const result = await sql`
    UPDATE automation_logs SET
      status = ${status},
      customers_processed = ${customersProcessed},
      error_message = ${errorMessage || null},
      completed_at = CURRENT_TIMESTAMP
    WHERE id = ${logId}
    RETURNING *
  `;
  return result.length > 0 ? toCamelCase<AutomationLog>(result[0]) : null;
}

export async function getRecentLogs(
  limit: number = 10
): Promise<AutomationLogWithDetails[]> {
  const result = await sql`
    SELECT 
      al.*,
      a.name as automation_name
    FROM automation_logs al
    JOIN automations a ON al.automation_id = a.id
    ORDER BY al.started_at DESC
    LIMIT ${limit}
  `;
  return toCamelCase<AutomationLogWithDetails[]>(result);
}

// ==================== ACTIVE AUTOMATIONS (for scripts) ====================

export async function getActiveAutomations(): Promise<AutomationWithRelations[]> {
  const result = await sql`
    SELECT 
      a.*,
      cs.name as segment_name,
      mt.name as template_name,
      mt.type as template_type
    FROM automations a
    LEFT JOIN customer_segments cs ON a.customer_segment_id = cs.id
    LEFT JOIN message_templates mt ON a.message_template_id = mt.id
    WHERE a.is_active = true
    ORDER BY a.id
  `;
  return toCamelCase<AutomationWithRelations[]>(result);
}

export async function getAutomationForExecution(
  id: number
): Promise<{
  automation: Automation;
  segmentId: number;
  templateId: number;
  templateSubject: string | null;
  templateMessage: string;
} | null> {
  const result = await sql`
    SELECT 
      a.*,
      mt.subject as template_subject,
      mt.message as template_message
    FROM automations a
    JOIN message_templates mt ON a.message_template_id = mt.id
    WHERE a.id = ${id}
  `;

  if (result.length === 0) return null;

  const row = result[0];
  return {
    automation: toCamelCase<Automation>({
      id: row.id,
      name: row.name,
      description: row.description,
      customer_segment_id: row.customer_segment_id,
      message_template_id: row.message_template_id,
      cron: row.cron,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
    segmentId: row.customer_segment_id as number,
    templateId: row.message_template_id as number,
    templateSubject: row.template_subject as string | null,
    templateMessage: row.template_message as string,
  };
}

// ==================== AUTOMATION TRACKER ====================
// Tracks which customers have received emails from each automation

export interface AutomationTrackerEntry {
  id: number;
  automationId: number;
  customerId: number;
  messageSentAt: Date;
}

/**
 * Get customer IDs that have already received an email from a specific automation
 */
export async function getTrackedCustomerIds(
  automationId: number
): Promise<number[]> {
  const result = await sql`
    SELECT customer_id FROM automation_tracker
    WHERE automation_id = ${automationId}
  `;
  return result.map((r) => r.customer_id as number);
}

/**
 * Record that a customer has received an email from an automation
 */
export async function trackCustomerEmail(
  automationId: number,
  customerId: number
): Promise<AutomationTrackerEntry> {
  const result = await sql`
    INSERT INTO automation_tracker (automation_id, customer_id)
    VALUES (${automationId}, ${customerId})
    ON CONFLICT (automation_id, customer_id) DO NOTHING
    RETURNING *
  `;
  return toCamelCase<AutomationTrackerEntry>(result[0]);
}

/**
 * Check if a customer has already received an email from an automation
 */
export async function hasCustomerReceivedEmail(
  automationId: number,
  customerId: number
): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM automation_tracker
    WHERE automation_id = ${automationId} AND customer_id = ${customerId}
    LIMIT 1
  `;
  return result.length > 0;
}

/**
 * Get all tracker entries for an automation (useful for debugging/admin)
 */
export async function getAutomationTrackerEntries(
  automationId: number
): Promise<AutomationTrackerEntry[]> {
  const result = await sql`
    SELECT * FROM automation_tracker
    WHERE automation_id = ${automationId}
    ORDER BY message_sent_at DESC
  `;
  return toCamelCase<AutomationTrackerEntry[]>(result);
}

/**
 * Clear tracker entries for an automation (allows re-sending to all customers)
 */
export async function clearAutomationTracker(
  automationId: number
): Promise<number> {
  const result = await sql`
    DELETE FROM automation_tracker
    WHERE automation_id = ${automationId}
    RETURNING id
  `;
  return result.length;
}

