import mysql from "mysql2/promise";
import "dotenv/config";

async function check() {
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    const cleanUrl = rawUrl.split("?")[0];
    
    const conn = await mysql.createConnection({
      uri: cleanUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await conn.query("CREATE DATABASE IF NOT EXISTS simikp_staging");
    console.log("Database simikp_staging berhasil dibuat atau sudah ada.");
    
    const [dbs] = await conn.query("SHOW DATABASES");
    console.log("Databases:", dbs);
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
