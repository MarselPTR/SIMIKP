import { mysqlTable, char, varchar, datetime, text } from "drizzle-orm/mysql-core";
import { productionVersions } from "./production";
import { users } from "./users";

export const reviews = mysqlTable("reviews", {
  id: char("id", { length: 36 }).primaryKey(),
  productionVersionId: char("production_version_id", { length: 36 }).notNull().references(() => productionVersions.id),
  reviewerId: char("reviewer_id", { length: 36 }).notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).notNull(),
  comment: text("comment"),
  reviewedAt: datetime("reviewed_at").default(new Date()),
});

export const publications = mysqlTable("publications", {
  id: char("id", { length: 36 }).primaryKey(),
  productionVersionId: char("production_version_id", { length: 36 }).notNull().references(() => productionVersions.id),
  status: varchar("status", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 255 }).notNull(),
  url: varchar("url", { length: 255 }),
  notes: text("notes"),
  recordedBy: char("recorded_by", { length: 36 }).notNull().references(() => users.id),
  publicationDate: datetime("publication_date"),
});
