import { mysqlTable, char, varchar, text, datetime, json, index } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const notifications = mysqlTable("notifications", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  readAt: datetime("read_at"),
  metadata: json("metadata"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  idxNotificationsUserReadTime: index("idx_notifs_user_read_time").on(t.userId, t.readAt, t.createdAt),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: char("id", { length: 36 }).primaryKey(),
  actorUserId: char("actor_user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  metadata: json("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  idxAuditLogsActorTime: index("idx_audit_logs_actor_time").on(t.actorUserId, t.createdAt),
}));
