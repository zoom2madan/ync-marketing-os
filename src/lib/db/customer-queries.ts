import sql from "./connection";
import type {
  Customer,
  CustomerAttribute,
  CustomerWithAttributes,
  CreateCustomerRequest,
  CreateCustomerAttributeRequest,
  CustomerSearchParams,
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

// ==================== CUSTOMER QUERIES ====================

export async function getCustomers(
  params: CustomerSearchParams
): Promise<PaginatedResponse<Customer>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.search) {
    whereClause += ` AND (
      first_name ILIKE $${paramIndex} OR 
      last_name ILIKE $${paramIndex} OR 
      email ILIKE $${paramIndex} OR
      lms_lead_id ILIKE $${paramIndex}
    )`;
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.email) {
    whereClause += ` AND email ILIKE $${paramIndex}`;
    values.push(`%${params.email}%`);
    paramIndex++;
  }

  if (params.lmsLeadId) {
    whereClause += ` AND lms_lead_id = $${paramIndex}`;
    values.push(params.lmsLeadId);
    paramIndex++;
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
  const countResult = await sql.unsafe(countQuery, values);
  const total = parseInt(countResult[0].total, 10);

  // Get paginated data
  const dataQuery = `
    SELECT * FROM customers 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await sql.unsafe(dataQuery, [...values, limit, offset]);

  return {
    data: toCamelCase<Customer[]>(dataResult),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const result = await sql`
    SELECT * FROM customers WHERE id = ${id}
  `;
  return result.length > 0 ? toCamelCase<Customer>(result[0]) : null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const result = await sql`
    SELECT * FROM customers WHERE email = ${email}
  `;
  return result.length > 0 ? toCamelCase<Customer>(result[0]) : null;
}

export async function getCustomerByLmsLeadId(lmsLeadId: string): Promise<Customer | null> {
  const result = await sql`
    SELECT * FROM customers WHERE lms_lead_id = ${lmsLeadId}
  `;
  return result.length > 0 ? toCamelCase<Customer>(result[0]) : null;
}

export async function createCustomer(
  data: Omit<CreateCustomerRequest, "attributes">
): Promise<Customer> {
  const result = await sql`
    INSERT INTO customers (lms_lead_id, first_name, last_name, email, mobile, source_created_at, source_updated_at)
    VALUES (
      ${data.lmsLeadId || null}, 
      ${data.firstName || null}, 
      ${data.lastName || null}, 
      ${data.email}, 
      ${data.mobile || null},
      ${data.sourceCreatedAt || null},
      ${data.sourceUpdatedAt || null}
    )
    RETURNING *
  `;
  return toCamelCase<Customer>(result[0]);
}

export async function upsertCustomer(
  data: Omit<CreateCustomerRequest, "attributes">
): Promise<Customer> {
  const result = await sql`
    INSERT INTO customers (lms_lead_id, first_name, last_name, email, mobile, source_created_at, source_updated_at)
    VALUES (
      ${data.lmsLeadId || null}, 
      ${data.firstName || null}, 
      ${data.lastName || null}, 
      ${data.email}, 
      ${data.mobile || null},
      ${data.sourceCreatedAt || null},
      ${data.sourceUpdatedAt || null}
    )
    ON CONFLICT (email) DO UPDATE SET
      lms_lead_id = COALESCE(EXCLUDED.lms_lead_id, customers.lms_lead_id),
      first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
      last_name = COALESCE(EXCLUDED.last_name, customers.last_name),
      mobile = COALESCE(EXCLUDED.mobile, customers.mobile),
      source_created_at = COALESCE(EXCLUDED.source_created_at, customers.source_created_at),
      source_updated_at = COALESCE(EXCLUDED.source_updated_at, customers.source_updated_at),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return toCamelCase<Customer>(result[0]);
}

// ==================== CUSTOMER ATTRIBUTE QUERIES ====================

export async function getCustomerAttributes(
  customerId: number
): Promise<CustomerAttribute[]> {
  const result = await sql`
    SELECT * FROM customer_attributes 
    WHERE customer_id = ${customerId}
    ORDER BY field_name
  `;
  return toCamelCase<CustomerAttribute[]>(result);
}

export async function getCustomerWithAttributes(
  customerId: number
): Promise<CustomerWithAttributes | null> {
  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  const attributes = await getCustomerAttributes(customerId);
  return { ...customer, attributes };
}

export async function createCustomerAttribute(
  customerId: number,
  data: CreateCustomerAttributeRequest
): Promise<CustomerAttribute> {
  const result = await sql`
    INSERT INTO customer_attributes (customer_id, field_type, field_name, field_value, source_created_at, source_updated_at)
    VALUES (${customerId}, ${data.fieldType}, ${data.fieldName}, ${JSON.stringify(data.fieldValue)}, ${data.sourceCreatedAt || null}, ${data.sourceUpdatedAt || null})
    RETURNING *
  `;
  return toCamelCase<CustomerAttribute>(result[0]);
}

export async function upsertCustomerAttribute(
  customerId: number,
  data: CreateCustomerAttributeRequest
): Promise<CustomerAttribute> {
  const result = await sql`
    INSERT INTO customer_attributes (customer_id, field_type, field_name, field_value, source_created_at, source_updated_at)
    VALUES (${customerId}, ${data.fieldType}, ${data.fieldName}, ${JSON.stringify(data.fieldValue)}, ${data.sourceCreatedAt || null}, ${data.sourceUpdatedAt || null})
    ON CONFLICT (customer_id, field_name) DO UPDATE SET
      field_type = EXCLUDED.field_type,
      field_value = EXCLUDED.field_value,
      source_created_at = COALESCE(EXCLUDED.source_created_at, customer_attributes.source_created_at),
      source_updated_at = COALESCE(EXCLUDED.source_updated_at, customer_attributes.source_updated_at),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return toCamelCase<CustomerAttribute>(result[0]);
}

export async function deleteCustomerAttribute(
  customerId: number,
  fieldName: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM customer_attributes 
    WHERE customer_id = ${customerId} AND field_name = ${fieldName}
    RETURNING id
  `;
  return result.length > 0;
}

// ==================== BULK OPERATIONS ====================

export async function createCustomerWithAttributes(
  data: CreateCustomerRequest
): Promise<CustomerWithAttributes> {
  const customer = await upsertCustomer(data);

  const attributes: CustomerAttribute[] = [];
  if (data.attributes && data.attributes.length > 0) {
    for (const attr of data.attributes) {
      const attribute = await upsertCustomerAttribute(customer.id, attr);
      attributes.push(attribute);
    }
  }

  return { ...customer, attributes };
}

export async function bulkCreateCustomers(
  customers: CreateCustomerRequest[]
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const customerData of customers) {
    try {
      const existing = await getCustomerByEmail(customerData.email);
      await createCustomerWithAttributes(customerData);
      if (existing) {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      errors.push(
        `Failed to process customer ${customerData.email}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { created, updated, errors };
}

