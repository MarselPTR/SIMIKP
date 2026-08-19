import { mysqlTable, varchar, text, mysqlEnum, int, timestamp } from 'drizzle-orm/mysql-core';

export const productions = mysqlTable('productions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']).default('DRAFT').notNull(),
  activityCode: varchar('activity_code', { length: 50 }).notNull(),
  createdById: varchar('created_by_id', { length: 36 }).notNull(),
  currentVersion: int('current_version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const productionVersions = mysqlTable('production_versions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productionId: varchar('production_id', { length: 36 }).notNull(),
  versionNumber: int('version_number').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  fileSize: int('file_size').notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  notes: text('notes'),
  uploadedById: varchar('uploaded_by_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productionReviews = mysqlTable('production_reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productionId: varchar('production_id', { length: 36 }).notNull(),
  versionId: varchar('version_id', { length: 36 }).notNull(),
  reviewerId: varchar('reviewer_id', { length: 36 }).notNull(),
  status: mysqlEnum('status', ['APPROVED', 'REJECTED']).notNull(),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});