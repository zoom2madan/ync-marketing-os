import sql from "./connection";
import type {
  User
} from "@/types";

// Helper function to convert snake_case to camelCase
function toCamelCase<T>(obj: unknown): T {
  if (!obj) return obj as T;
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

// ==================== USER QUERIES ====================

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return result.length > 0 ? toCamelCase<User>(result[0]) : null;
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}): Promise<User> {
  const result = await sql`
    INSERT INTO users (first_name, last_name, email, role)
    VALUES (${data.firstName}, ${data.lastName}, ${data.email}, ${data.role})
    RETURNING *
  `;
  return toCamelCase<User>(result[0]);
}

export async function updateUser(
  id: number,
  data: Partial<User>
): Promise<User | null> {
  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (data.firstName) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.role) {
    updates.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (typeof data.isActive === "boolean") {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (updates.length === 0) return null;

  values.push(id);
  const result = await sql.unsafe(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.length > 0 ? toCamelCase<User>(result[0]) : null;
}

export async function getAllAgents(): Promise<
  Pick<User, "id" | "firstName" | "lastName" | "email">[]
> {
  const result = await sql`
    SELECT id, first_name, last_name, email 
    FROM users 
    WHERE role = 'agent' AND is_active = true
    ORDER BY first_name, last_name
  `;
  return toCamelCase(result);
}