import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";
import * as schema from "./schema";

const rawUrl = process.env.DATABASE_URL || "";

// Strip the ?ssl=... query param — mysql2 does not parse it from URI correctly.
// We enforce SSL via pool options instead.
const cleanUrl = rawUrl.split("?")[0];

const isCloud =
  rawUrl.includes("aivencloud") ||
  rawUrl.includes("ssl=") ||
  process.env.DB_SSL === "true";

const poolConnection = mysql.createPool(
  isCloud
    ? {
        uri: cleanUrl,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      }
    : {
        uri: cleanUrl,
        waitForConnections: true,
        connectionLimit: 5,
      }
);

// Verify connection on startup
poolConnection
  .getConnection()
  .then((conn) => {
    console.log("[DB] Connected to database successfully.");
    conn.release();
  })
  .catch((err) => {
    console.error("[DB] Failed to connect to database:", err.message);
  });

export const db = drizzle(poolConnection, { schema, mode: "default" });
