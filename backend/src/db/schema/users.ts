import { mysqlTable, char, varchar, boolean, datetime, date, text, primaryKey } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  staffType: varchar("staff_type", { length: 50 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 30 }),
  bio: text("bio"),
  gender: varchar("gender", { length: 15 }),
  birthPlace: varchar("birth_place", { length: 100 }),
  birthDate: date("birth_date"),
  pasFotoUrl: text("pas_foto_url"),
  active: boolean("active").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const roles = mysqlTable("roles", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const userRoles = mysqlTable("user_roles", {
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: char("role_id", { length: 36 }).notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expires_at").notNull(),
  usedAt: datetime("used_at"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});
