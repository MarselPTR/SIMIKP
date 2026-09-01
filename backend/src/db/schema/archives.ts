import { mysqlTable, char, varchar, text, boolean } from "drizzle-orm/mysql-core";
import { productionFiles } from "./production";

export const archiveAssets = mysqlTable("archive_assets", {
  id: char("id", { length: 36 }).primaryKey(),
  productionFileId: char("production_file_id", { length: 36 }).notNull().unique().references(() => productionFiles.id),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
});
