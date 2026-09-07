import { mysqlTable, char, boolean, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const notificationPreferences = mysqlTable("notification_preferences", {
  userId: char("user_id", { length: 36 }).primaryKey().references(() => users.id),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  browserEnabled: boolean("browser_enabled").notNull().default(true),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});