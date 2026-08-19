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
    ssl: { rejectUnauthorized: false }, // Crucial for Aiven
  });

  const db = drizzle(connection);

  console.log("Applying migrations from folder...");
  const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");
  await migrate(db, { migrationsFolder });
  
  console.log("Migrations applied successfully! 🎉");
  await connection.end();
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
