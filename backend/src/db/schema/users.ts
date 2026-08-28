import { mysqlTable, char, varchar, boolean, datetime, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  staffType: varchar("staff_type", { length: 50 }),
  email: varchar("email", { length: 255 }),
  nik: varchar("nik", { length: 20 }),
  gender: varchar("gender", { length: 15 }),
  birthPlace: varchar("birth_place", { length: 100 }),
  birthDate: datetime("birth_date"),
  religion: varchar("religion", { length: 50 }),
  education: varchar("education", { length: 100 }),
  pasFotoUrl: varchar("pas_foto_url", { length: 500 }),
  scanKtpUrl: varchar("scan_ktp_url", { length: 500 }),
  active: boolean("active").default(true),
  createdAt: datetime("created_at").default(new Date()),
});

export const roles = mysqlTable("roles", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const userRoles = mysqlTable("user_roles", {
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id),
  roleId: char("role_id", { length: 36 }).notNull().references(() => roles.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));
