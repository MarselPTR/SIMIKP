import 'dotenv/config';
import { db } from './src/db/index.js';
import { users, roles, userRoles } from './src/db/schema/index.js';
import { eq, or } from 'drizzle-orm';

async function test() {
  try {
    let foundUsers = await db.select({
      id: users.id,
      username: users.username,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(or(
      eq(users.username, 'admin'),
      eq(users.email, 'admin')
    ))
    .limit(1);
    console.log(foundUsers);
  } catch (err) {
    console.error('DB ERROR:', err.message);
  }
  process.exit();
}
test();
