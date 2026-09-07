const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

async function run() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL.split('?')[0] });
  const db = drizzle(pool);
  
  const [res] = await pool.query('SELECT * FROM assignments WHERE status IN ("COMPLETED", "SIAP_TAYANG", "MENULIS", "DESAIN", "LIPUTAN") ORDER BY created_at DESC LIMIT 5');
  console.log("Assignments:", res);
  
  const [files] = await pool.query('SELECT * FROM production_files');
  console.log("Production Files:", files);
  
  process.exit(0);
}
run().catch(console.error);
