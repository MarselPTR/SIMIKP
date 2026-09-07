import "dotenv/config";
import { db } from "./src/db";
import { passwordResetTokens } from "./src/db/schema";

async function main() {
  await db.delete(passwordResetTokens);
  process.exit(0);
}
main();
