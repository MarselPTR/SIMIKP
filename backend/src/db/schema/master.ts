import { mysqlTable, char, varchar, double } from "drizzle-orm/mysql-core";

export const contentTypes = mysqlTable("content_types", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const opds = mysqlTable("opds", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  singkatan: varchar("singkatan", { length: 50 }),
});

export const locations = mysqlTable("locations", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  kecamatan: varchar("kecamatan", { length: 100 }),
  desaKelurahan: varchar("desa_kelurahan", { length: 100 }),
  lat: double("lat"),
  lng: double("lng"),
});
