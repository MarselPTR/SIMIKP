import { db } from "./src/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const existingUser = await db.select().from(users).where(eq(users.username, "user@petugas.com")).limit(1);
    console.log("Success", existingUser);
  } catch (err: any) {
    console.error("ERROR:");
    console.error(err.message);
    console.error(err);
  }
  process.exit(0);
}

run();
