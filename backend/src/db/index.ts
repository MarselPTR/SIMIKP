import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/simikp";
const isCloudDb = dbUrl.includes("aivencloud") || dbUrl.includes("ssl=") || process.env.DB_SSL === "true";

const poolConnection = mysql.createPool(
  isCloudDb
    ? {
        uri: dbUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        uri: dbUrl,
      }
);

export const db = drizzle(poolConnection, { schema, mode: 'default' });
