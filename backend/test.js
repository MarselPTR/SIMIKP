const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL.split('?')[0] });
  
  try {
    const [res] = await pool.query("SELECT id, user_id, status FROM assignments LIMIT 5");
    console.log("Assignments:", res);
    
    const [files] = await pool.query('SELECT original_filename, stored_filename, storage_path FROM production_files');
    console.log("Production Files count:", files.length);
    console.log("Production Files sample:", files.slice(0, 3));
  } catch (err) {
    console.error("DB Error:", err);
  }
  
  process.exit(0);
}
run().catch(console.error);
