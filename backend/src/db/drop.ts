import mysql from "mysql2/promise";
import "dotenv/config";

async function dropAllTables() {
  console.log("Connecting to database to drop tables...");
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Fetching tables...");
  const [rows] = await connection.query("SHOW TABLES");
  const tables = (rows as any[]).map(row => Object.values(row)[0]);

  if (tables.length === 0) {
    console.log("No tables found.");
  } else {
    console.log(`Dropping ${tables.length} tables...`);
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("All tables dropped successfully.");
  }

  await connection.end();
  process.exit(0);
}

dropAllTables().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
