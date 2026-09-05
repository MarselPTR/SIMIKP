import { mysqlTable, char, varchar, text, datetime, json, boolean } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const notifications = mysqlTable("notifications", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  readAt: datetime("read_at"),
  metadata: json("metadata"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: char("id", { length: 36 }).primaryKey(),
  actorUserId: char("actor_user_id", { length: 36 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  metadata: json("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: datetime("created_at").default(new Date()),
});
