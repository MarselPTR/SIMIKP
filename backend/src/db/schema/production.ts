import { mysqlTable, char, varchar, datetime, int, boolean, bigint, unique } from "drizzle-orm/mysql-core";
import { assignments } from "./activities";
import { users } from "./users";

export const productionItems = mysqlTable("production_items", {
  id: char("id", { length: 36 }).primaryKey(),
  assignmentId: char("assignment_id", { length: 36 }).notNull().unique().references(() => assignments.id),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  productionDate: datetime("production_date"),
});

export const productionVersions = mysqlTable("production_versions", {
  id: char("id", { length: 36 }).primaryKey(),
  productionItemId: char("production_item_id", { length: 36 }).notNull().references(() => productionItems.id),
  versionNumber: int("version_number").notNull(),
  workLink: varchar("work_link", { length: 500 }),
  isCurrent: boolean("is_current").default(false),
  createdAt: datetime("created_at").default(new Date()),
}, (t) => ({
  unqItemVersion: unique().on(t.productionItemId, t.versionNumber),
}));

export const productionFiles = mysqlTable("production_files", {
  id: char("id", { length: 36 }).primaryKey(),
  productionVersionId: char("production_version_id", { length: 36 }).notNull().references(() => productionVersions.id),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  storedFilename: varchar("stored_filename", { length: 255 }).notNull().unique(),
  storagePath: varchar("storage_path", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileExtension: varchar("file_extension", { length: 10 }).notNull(),
  fileSize: bigint("file_size", { mode: 'number' }).notNull(),
  uploadedBy: char("uploaded_by", { length: 36 }).notNull().references(() => users.id),
  uploadedAt: datetime("uploaded_at").default(new Date()),
});
