import { mysqlTable, char, varchar, date, datetime, text, int, primaryKey } from "drizzle-orm/mysql-core";
import { locations, strategicIssues, persons, keywords, contentTypes } from "./master";
import { users } from "./users";

export const activities = mysqlTable("activities", {
  id: char("id", { length: 36 }).primaryKey(),
  activityCode: varchar("activity_code", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  strakomNumber: varchar("strakom_number", { length: 100 }),
  activityDate: date("activity_date").notNull(),
  activityTime: varchar("activity_time", { length: 50 }),
  locationId: char("location_id", { length: 36 }).references(() => locations.id),
  description: text("description"),
  priority: varchar("priority", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull(),
  createdBy: char("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: datetime("created_at").default(new Date()),
});

export const activityStrategicIssues = mysqlTable("activity_strategic_issues", {
  activityId: char("activity_id", { length: 36 }).notNull().references(() => activities.id),
  issueId: char("issue_id", { length: 36 }).notNull().references(() => strategicIssues.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.activityId, t.issueId] }),
}));

export const activityPersons = mysqlTable("activity_persons", {
  activityId: char("activity_id", { length: 36 }).notNull().references(() => activities.id),
  personId: char("person_id", { length: 36 }).notNull().references(() => persons.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.activityId, t.personId] }),
}));

export const activityKeywords = mysqlTable("activity_keywords", {
  activityId: char("activity_id", { length: 36 }).notNull().references(() => activities.id),
  keywordId: char("keyword_id", { length: 36 }).notNull().references(() => keywords.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.activityId, t.keywordId] }),
}));

export const assignments = mysqlTable("assignments", {
  id: char("id", { length: 36 }).primaryKey(),
  activityId: char("activity_id", { length: 36 }).notNull().references(() => activities.id),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id),
  contentTypeId: char("content_type_id", { length: 36 }).notNull().references(() => contentTypes.id),
  assignedAt: datetime("assigned_at").default(new Date()),
  deadline: datetime("deadline"),
  status: varchar("status", { length: 50 }).notNull(),
  instruction: text("instruction"),
  createdBy: char("created_by", { length: 36 }).notNull().references(() => users.id),
});
