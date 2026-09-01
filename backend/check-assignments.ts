import { db } from "./src/db/index";
import { assignments, activities } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const data = await db
    .select({
      id: assignments.id,
      title: activities.title,
      activityDate: activities.activityDate,
      startTime: assignments.startTime,
      endTime: assignments.endTime,
      userId: assignments.userId
    })
    .from(assignments)
    .innerJoin(activities, eq(assignments.activityId, activities.id));
    
  console.dir(data, { depth: null });
  process.exit(0);
}
run();
