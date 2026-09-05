import { mysqlTable, char, varchar, date, datetime, time, text, primaryKey, index } from "drizzle-orm/mysql-core";
import { locations, contentTypes, opds } from "./master";
import { users } from "./users";

export const activities = mysqlTable("activities", {
  id: char("id", { length: 36 }).primaryKey(),
  activityCode: varchar("activity_code", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  activityDate: date("activity_date").notNull(),
  activityTime: varchar("activity_time", { length: 50 }),
  startTime: time("start_time"),
  endTime: time("end_time"),
  locationId: char("location_id", { length: 36 }).references(() => locations.id),
  opdId: char("opd_id", { length: 36 }).references(() => opds.id),
  description: text("description"),
  priority: varchar("priority", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull(),
  createdBy: char("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: datetime("created_at").default(new Date()),
}, (t) => ({
  idxActivityDate: index("idx_activity_date").on(t.activityDate),
  idxActivityStatus: index("idx_activity_status").on(t.status),
}));

export const activityRequiredContents = mysqlTable("activity_required_contents", {
  activityId: char("activity_id", { length: 36 }).notNull().references(() => activities.id),
  contentTypeId: char("content_type_id", { length: 36 }).notNull().references(() => contentTypes.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.activityId, t.contentTypeId] }),
}));

export const assignments = mysqlTable("assignments", {
  id: char("id", { length: 36 }).primaryKey(),
  activityId: char("activity_id", { length: 36 }).notNull().references(() => activities.id),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id),
  contentTypeId: char("content_type_id", { length: 36 }).notNull().references(() => contentTypes.id),
  assignedAt: datetime("assigned_at").default(new Date()),
  startTime: time("start_time"),
  endTime: time("end_time"),
  deadline: datetime("deadline"),
  status: varchar("status", { length: 50 }).notNull(),
  instruction: text("instruction"),
  // Untuk role Prahum ini menyimpan teks naskah beritanya langsung, bukan tautan berkas.
  workLink: text("work_link"),
  revisionNotes: text("revision_notes"),
  revisionAuthor: varchar("revision_author", { length: 255 }),
  revisionDate: varchar("revision_date", { length: 100 }),
  createdBy: char("created_by", { length: 36 }).notNull().references(() => users.id),
}, (t) => ({
  idxAssignmentStatus: index("idx_assignment_status").on(t.status),
}));
