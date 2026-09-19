import mysql from "mysql2/promise";
import "dotenv/config";

async function createEmpty() {
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    const cleanUrl = rawUrl.split("?")[0];
    
    // Connect to sys or defaultdb first to execute CREATE DATABASE
    // since we can't connect to simikp_empty before it exists
    const sysUrl = cleanUrl.replace("simikp_empty", "defaultdb");
    
    const conn = await mysql.createConnection({
      uri: sysUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await conn.query("DROP DATABASE IF EXISTS simikp_empty");
    await conn.query("CREATE DATABASE simikp_empty");
    console.log("Database simikp_empty berhasil dibuat.");
    
    await conn.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

createEmpty();
