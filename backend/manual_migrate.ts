import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running manual migrations...");
  try {
    await db.execute(sql`ALTER TABLE \`activities\` MODIFY COLUMN \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`assignments\` MODIFY COLUMN \`assigned_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`assignments\` MODIFY COLUMN \`revision_date\` datetime`);
    await db.execute(sql`ALTER TABLE \`audit_logs\` MODIFY COLUMN \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`notifications\` MODIFY COLUMN \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`password_reset_tokens\` MODIFY COLUMN \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`production_files\` MODIFY COLUMN \`uploaded_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`production_versions\` MODIFY COLUMN \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`reviews\` MODIFY COLUMN \`reviewed_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`users\` MODIFY COLUMN \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP`);
    await db.execute(sql`ALTER TABLE \`users\` MODIFY COLUMN \`birth_date\` date`);
    
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
