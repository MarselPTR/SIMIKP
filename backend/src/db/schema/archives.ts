import { mysqlTable, char, varchar, text, boolean, primaryKey } from "drizzle-orm/mysql-core";
import { productionVersions } from "./production";
import { persons, keywords } from "./master";

export const archiveAssets = mysqlTable("archive_assets", {
  id: char("id", { length: 36 }).primaryKey(),
  productionFileId: char("production_file_id", { length: 36 }).notNull().unique().references(() => productionVersions.id),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
});

export const archivePersons = mysqlTable("archive_persons", {
  archiveAssetId: char("archive_asset_id", { length: 36 }).notNull().references(() => archiveAssets.id),
  personId: char("person_id", { length: 36 }).notNull().references(() => persons.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.archiveAssetId, t.personId] }),
}));

export const archiveKeywords = mysqlTable("archive_keywords", {
  archiveAssetId: char("archive_asset_id", { length: 36 }).notNull().references(() => archiveAssets.id),
  keywordId: char("keyword_id", { length: 36 }).notNull().references(() => keywords.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.archiveAssetId, t.keywordId] }),
}));
