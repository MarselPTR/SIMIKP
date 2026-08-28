import { db } from "./src/db";
import { users } from "./src/db/schema";
import { isNotNull } from "drizzle-orm";

async function run() {
  const data = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(isNotNull(users.staffType));

  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

run().catch(console.error);
