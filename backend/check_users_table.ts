import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`DESCRIBE users;`);
  console.log(result);
  process.exit(0);
}

run().catch(console.error);
