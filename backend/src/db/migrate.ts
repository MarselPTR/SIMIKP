import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "path";
import "dotenv/config";

async function runMigrate() {
  console.log("Connecting to Aiven MySQL database...");
  
  // Create a single connection explicitly for migrations
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: process.env.NODE_ENV === "production" 
        ? process.env.DB_REJECT_UNAUTHORIZED !== "false" 
        : false 
    },
  });

  const db = drizzle(connection);

  console.log("Applying migrations from folder...");
  const migrationsFolder = path.join(__dirname, "migrations");
  
  // Disable FK checks to allow dropping tables with dependencies in old migrations
  await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
  
  await migrate(db, { migrationsFolder });
  
  // Re-enable FK checks
  await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
  
  console.log("Migrations applied successfully! 🎉");
  await connection.end();
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
