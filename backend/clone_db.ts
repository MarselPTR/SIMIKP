import mysql from "mysql2/promise";
import "dotenv/config";

async function cloneDb() {
  let conn;
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    const cleanUrl = rawUrl.split("?")[0];
    
    conn = await mysql.createConnection({
      uri: cleanUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log("Koneksi berhasil. Mulai clone dari defaultdb ke simikp_staging...");
    
    // Pastikan simikp_staging ada
    await conn.query("CREATE DATABASE IF NOT EXISTS simikp_staging");
    
    // Ambil daftar tabel dari defaultdb
    const [tables]: any = await conn.query("SHOW TABLES FROM defaultdb");
    const tableNames = tables.map((t: any) => Object.values(t)[0]);
    
    // Disable foreign key checks selama proses
    await conn.query("SET FOREIGN_KEY_CHECKS=0;");
    
    for (const tableName of tableNames) {
      console.log(`Cloning table: ${tableName}...`);
      
      // Drop jika sudah ada di staging
      await conn.query(`DROP TABLE IF EXISTS simikp_staging.\`${tableName}\``);
      
      // Copy schema
      await conn.query(`CREATE TABLE simikp_staging.\`${tableName}\` LIKE defaultdb.\`${tableName}\``);
      
      // Copy data
      await conn.query(`INSERT INTO simikp_staging.\`${tableName}\` SELECT * FROM defaultdb.\`${tableName}\``);
    }
    
    // Re-enable foreign key checks
    await conn.query("SET FOREIGN_KEY_CHECKS=1;");
    
    console.log("Clone selesai!");
    
  } catch (err) {
    console.error("Gagal melakukan clone:", err);
  } finally {
    if (conn) await conn.end();
  }
}

cloneDb();
