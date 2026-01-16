#!/usr/bin/env npx tsx
/**
 * Script to fetch active automation data from the database.
 * Outputs JSON to stdout for consumption by shell scripts.
 *
 * Usage: npx tsx scripts/get_automation_data.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local or .env (quiet mode to avoid polluting stdout)
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

import postgres from "postgres";

interface AutomationData {
  id: number;
  name: string;
  cron: string;
  isActive: boolean;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    const automations = await sql`
      SELECT id, name, cron, is_active
      FROM automations
      WHERE is_active = true
      ORDER BY id
    `;

    const result: AutomationData[] = automations.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      cron: row.cron as string,
      isActive: row.is_active as boolean,
    }));

    // Output JSON to stdout
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error fetching automations:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();

