import sql from "./connection";
import type {
  MessageTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateSearchParams,
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

// ==================== TEMPLATE QUERIES ====================

export async function getTemplates(
  params: TemplateSearchParams
): Promise<PaginatedResponse<MessageTemplate>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (name ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`;
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.type) {
    whereClause += ` AND type = $${paramIndex}`;
    values.push(params.type);
    paramIndex++;
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM message_templates ${whereClause}`;
  const countResult = await sql.unsafe(countQuery, values);
  const total = parseInt(countResult[0].total, 10);

  // Get paginated data
  const dataQuery = `
    SELECT * FROM message_templates 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await sql.unsafe(dataQuery, [...values, limit, offset]);

  return {
    data: toCamelCase<MessageTemplate[]>(dataResult),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTemplateById(id: number): Promise<MessageTemplate | null> {
  const result = await sql`
    SELECT * FROM message_templates WHERE id = ${id}
  `;
  return result.length > 0 ? toCamelCase<MessageTemplate>(result[0]) : null;
}

export async function createTemplate(
  data: CreateTemplateRequest
): Promise<MessageTemplate> {
  const result = await sql`
    INSERT INTO message_templates (name, type, templating_type, subject, message, from_email, reply_to)
    VALUES (
      ${data.name}, 
      ${data.type}, 
      ${data.templatingType || "mjml"}, 
      ${data.subject || null}, 
      ${data.message},
      ${data.fromEmail || null},
      ${data.replyTo || null}
    )
    RETURNING *
  `;
  return toCamelCase<MessageTemplate>(result[0]);
}

export async function updateTemplate(
  id: number,
  data: UpdateTemplateRequest
): Promise<MessageTemplate | null> {
  const template = await getTemplateById(id);
  if (!template) return null;

  const result = await sql`
    UPDATE message_templates SET
      name = ${data.name ?? template.name},
      type = ${data.type ?? template.type},
      templating_type = ${data.templatingType ?? template.templatingType},
      subject = ${data.subject ?? template.subject},
      message = ${data.message ?? template.message},
      from_email = ${data.fromEmail ?? template.fromEmail},
      reply_to = ${data.replyTo ?? template.replyTo}
    WHERE id = ${id}
    RETURNING *
  `;
  return toCamelCase<MessageTemplate>(result[0]);
}

export async function deleteTemplate(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM message_templates WHERE id = ${id} RETURNING id
  `;
  return result.length > 0;
}

// ==================== ALL TEMPLATES (for dropdowns) ====================

export async function getAllTemplates(): Promise<
  Pick<MessageTemplate, "id" | "name" | "type">[]
> {
  const result = await sql`
    SELECT id, name, type FROM message_templates ORDER BY name
  `;
  return toCamelCase(result);
}

export async function getEmailTemplates(): Promise<
  Pick<MessageTemplate, "id" | "name">[]
> {
  const result = await sql`
    SELECT id, name FROM message_templates WHERE type = 'email' ORDER BY name
  `;
  return toCamelCase(result);
}

