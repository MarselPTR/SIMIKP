import 'dotenv/config';
import { db } from './src/db/index';
import { assignments, productions } from './src/db/schema/index';
import { eq, isNotNull } from 'drizzle-orm';

async function test() {
  const list = await db.select().from(assignments).limit(3);
  const prods = await db.select().from(productions).limit(3);
  console.log('Assignments:', list.length);
  console.log('Productions:', prods.length, prods.map(p => p.fileUrl));
  process.exit();
}
test();
