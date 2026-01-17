#!/usr/bin/env npx tsx
/**
 * Script to execute a single automation.
 * Called by CRON jobs set up by refresh_automation.sh.
 *
 * Usage: npx tsx scripts/run-automation.ts <automation_id>
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import postgres from "postgres";

// Types
interface Customer {
  id: number;
  lms_lead_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  mobile: string | null;
  created_at: Date;
  updated_at: Date;
  source_created_at: Date | null;
  source_updated_at: Date | null;
}

interface CustomerAttribute {
  id: number;
  customer_id: number;
  field_type: string;
  field_name: string;
  field_value: unknown;
}

interface AutomationData {
  id: number;
  name: string;
  customerSegmentId: number;
  messageTemplateId: number;
  templateSubject: string | null;
  templateMessage: string;
  templateFromEmail: string | null;
  templateReplyTo: string | null;
  segmentType: string;
  selectionSql: string | null;
  handlerFunction: string | null;
}

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

// Helper function to convert snake_case to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Helper function to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Build a variables object that supports both snake_case and camelCase tokens.
 * For a variable like "first_name", both {{first_name}} and {{firstName}} will work.
 */
function buildVariables(
  customer: Customer,
  attributes: CustomerAttribute[]
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};

  // Add all customer fields (both snake_case original and camelCase versions)
  const customerFields: Record<string, unknown> = {
    id: customer.id,
    lms_lead_id: customer.lms_lead_id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    mobile: customer.mobile,
  };

  for (const [key, value] of Object.entries(customerFields)) {
    // Add original snake_case key
    variables[key] = value ?? "";
    // Add camelCase version
    const camelKey = snakeToCamel(key);
    if (camelKey !== key) {
      variables[camelKey] = value ?? "";
    }
  }

  // Add all customer attributes by their field_name
  for (const attr of attributes) {
    // Extract the actual value from JSONB field_value
    let value = attr.field_value;

    // Handle JSONB values - the value might be wrapped or stored directly
    if (value !== null && value !== undefined) {
      // If it's a string that looks like JSON, try to parse it
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }
    }

    const fieldName = attr.field_name;
    // Add the original field_name as token
    variables[fieldName] = value ?? "";
    
    // Also add camelCase version if field_name is in snake_case
    const camelFieldName = snakeToCamel(fieldName);
    if (camelFieldName !== fieldName) {
      variables[camelFieldName] = value ?? "";
    }
    
    // Also add snake_case version if field_name is in camelCase
    const snakeFieldName = camelToSnake(fieldName);
    if (snakeFieldName !== fieldName) {
      variables[snakeFieldName] = value ?? "";
    }
  }

  return variables;
}

// Variable replacement supporting nested properties like {{customer.firstName}}
function replaceVariables(
  content: string,
  variables: Record<string, unknown>
): string {
  return content.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, key) => {
    const keys = key.split(".");
    let value: unknown = variables;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Try alternative case versions
        const camelK = snakeToCamel(k);
        const snakeK = camelToSnake(k);
        
        if (value && typeof value === "object") {
          if (camelK !== k && camelK in value) {
            value = (value as Record<string, unknown>)[camelK];
          } else if (snakeK !== k && snakeK in value) {
            value = (value as Record<string, unknown>)[snakeK];
          } else {
            return match; // Keep original if variable not found
          }
        } else {
          return match;
        }
      }
    }

    // Format the value for display
    if (value === null || value === undefined) {
      return "";
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

// Simple MJML to HTML conversion (basic)
function convertToHtml(content: string): string {
  let html = content;

  // If it doesn't look like MJML, wrap in basic HTML
  if (!content.toLowerCase().includes("<mj-")) {
    return `
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        ${content.replace(/\n/g, "<br>")}
      </body>
      </html>
    `;
  }

  // Basic MJML tag replacements
  const replacements: [RegExp, string][] = [
    [/<mj-body[^>]*>/gi, '<body style="background-color: #f4f4f4; padding: 20px;">'],
    [/<\/mj-body>/gi, "</body>"],
    [/<mj-section[^>]*>/gi, '<table width="100%"><tr><td style="padding: 20px; background: #fff;">'],
    [/<\/mj-section>/gi, "</td></tr></table>"],
    [/<mj-column[^>]*>/gi, "<div>"],
    [/<\/mj-column>/gi, "</div>"],
    [/<mj-text[^>]*>/gi, '<p style="margin: 0; padding: 10px 0;">'],
    [/<\/mj-text>/gi, "</p>"],
    [/<mj-button[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" style="display:inline-block;padding:12px 24px;background:#333;color:#fff;text-decoration:none;border-radius:4px;">'],
    [/<\/mj-button>/gi, "</a>"],
    [/<mj-image[^>]*src="([^"]*)"[^>]*>/gi, '<img src="$1" style="max-width:100%;" />'],
    [/<mj-divider[^>]*>/gi, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />'],
    [/<\/mj-divider>/gi, ""],
  ];

  for (const [pattern, replacement] of replacements) {
    html = html.replace(pattern, replacement);
  }

  return `<html><head><meta charset="utf-8"></head>${html}</html>`;
}

// Send email via Resend API
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  fromEmail?: string | null,
  replyTo?: string | null
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = fromEmail || "noreply@notifications.yournextcampus.com";

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const emailPayload: Record<string, string> = { from, to, subject, html };
    
    // Add reply_to if provided
    if (replyTo) {
      emailPayload.reply_to = replyTo;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.message || "API error" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  const automationId = parseInt(process.argv[2], 10);

  if (isNaN(automationId)) {
    console.error("Usage: npx tsx scripts/run-automation.ts <automation_id>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    console.log(`[${new Date().toISOString()}] Starting automation ${automationId}`);

    // Fetch automation with template and segment info
    const automationResult = await sql`
      SELECT 
        a.id,
        a.name,
        a.customer_segment_id,
        a.message_template_id,
        mt.subject as template_subject,
        mt.message as template_message,
        mt.from_email as template_from_email,
        mt.reply_to as template_reply_to,
        cs.type as segment_type,
        cs.selection_sql,
        cs.handler_function
      FROM automations a
      JOIN message_templates mt ON a.message_template_id = mt.id
      JOIN customer_segments cs ON a.customer_segment_id = cs.id
      WHERE a.id = ${automationId} AND a.is_active = true
    `;

    if (automationResult.length === 0) {
      console.error(`Automation ${automationId} not found or inactive`);
      process.exit(1);
    }

    const automation = toCamelCase<AutomationData>(automationResult[0]);

    // Create log entry
    const logResult = await sql`
      INSERT INTO automation_logs (automation_id, status)
      VALUES (${automationId}, 'started')
      RETURNING id
    `;
    const logId = logResult[0].id as number;

    // Get customers in segment
    let customerIds: number[] = [];

    if (automation.segmentType === "manual") {
      const manualResult = await sql`
        SELECT customer_id FROM customer_segment_customer_list
        WHERE customer_segment_id = ${automation.customerSegmentId}
      `;
      customerIds = manualResult.map((r) => r.customer_id as number);
    } else if (automation.segmentType === "sql" && automation.selectionSql) {
      const sqlResult = await sql.unsafe(automation.selectionSql);
      customerIds = sqlResult.map((r) => {
        const id = r.customer_id ?? r.id;
        return typeof id === "number" ? id : parseInt(id as string, 10);
      });
    }
    // Note: Function-based segments would need the handlers to be loaded

    // Filter out customers who have already received an email from this automation
    if (customerIds.length > 0) {
      const alreadyEmailedResult = await sql`
        SELECT customer_id FROM automation_tracker
        WHERE automation_id = ${automationId}
        AND customer_id = ANY(${customerIds})
      `;
      const alreadyEmailedIds = new Set(
        alreadyEmailedResult.map((r) => r.customer_id as number)
      );
      
      const originalCount = customerIds.length;
      customerIds = customerIds.filter((id) => !alreadyEmailedIds.has(id));
      
      if (alreadyEmailedIds.size > 0) {
        console.log(`  Filtered out ${alreadyEmailedIds.size} customers who already received email from this automation`);
      }
    }

    if (customerIds.length === 0) {
      console.log("No new customers to email (all already received email or segment is empty), skipping");
      await sql`
        UPDATE automation_logs SET
          status = 'completed',
          customers_processed = 0,
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ${logId}
      `;
      process.exit(0);
    }

    // Fetch customer details (all columns)
    const customers = await sql`
      SELECT id, lms_lead_id, first_name, last_name, email, mobile, 
             created_at, updated_at, source_created_at, source_updated_at
      FROM customers
      WHERE id = ANY(${customerIds})
    `;

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each customer
    for (const row of customers) {
      const customer = row as Customer;

      // Fetch customer attributes
      const attributeRows = await sql`
        SELECT id, customer_id, field_type, field_name, field_value
        FROM customer_attributes
        WHERE customer_id = ${customer.id}
      `;
      const attributes = attributeRows as unknown as CustomerAttribute[];

      // Build variables object with both snake_case and camelCase support
      const variables = buildVariables(customer, attributes);

      // Render template
      const subject = replaceVariables(
        automation.templateSubject || "Message from Your Next Campus",
        variables
      );
      const content = replaceVariables(automation.templateMessage, variables);
      const html = convertToHtml(content);

      // Send email
      const result = await sendEmail(
        customer.email,
        subject,
        html,
        automation.templateFromEmail,
        automation.templateReplyTo
      );

      if (result.success) {
        // Log the successful send to automation_tracker to prevent duplicate emails
        try {
          const trackerResult = await sql`
            INSERT INTO automation_tracker (automation_id, customer_id)
            VALUES (${automationId}, ${customer.id})
            ON CONFLICT (automation_id, customer_id) DO NOTHING
            RETURNING id
          `;
          if (trackerResult.length > 0) {
            console.log(`  Tracked in automation_tracker with id: ${trackerResult[0].id}`);
          } else {
            console.log(`  Customer ${customer.id} already tracked for automation ${automationId} (no insert)`);
          }
        } catch (trackerError) {
          console.error(`  Failed to track email in automation_tracker:`, trackerError);
        }
        processed++;
        console.log(`  Sent to ${customer.email}`);
      } else {
        failed++;
        errors.push(`${customer.email}: ${result.error}`);
        console.error(`  Failed to send to ${customer.email}: ${result.error}`);
      }

      // Rate limiting - 100ms between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update log
    await sql`
      UPDATE automation_logs SET
        status = ${failed === customers.length ? "failed" : "completed"},
        customers_processed = ${processed},
        error_message = ${errors.length > 0 ? errors.slice(0, 10).join("; ") : null},
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ${logId}
    `;

    console.log(
      `[${new Date().toISOString()}] Completed: ${processed} sent, ${failed} failed`
    );
  } catch (error) {
    console.error("Automation failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();

