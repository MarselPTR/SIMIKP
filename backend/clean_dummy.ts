import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Memulai pembersihan data dummy secara menyeluruh...");
  
  try {
    // Disable FK checks
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    
    console.log("- Menghapus data penugasan dan aktivitas (assignments, activities, productions, dsb)...");
    
    // Clear all transaction tables
    await db.execute(sql`TRUNCATE TABLE production_versions;`);
    await db.execute(sql`TRUNCATE TABLE production_items;`);
    await db.execute(sql`TRUNCATE TABLE assignments;`);
    await db.execute(sql`TRUNCATE TABLE activity_required_contents;`);
    await db.execute(sql`TRUNCATE TABLE activity_strategic_issues;`);
    await db.execute(sql`TRUNCATE TABLE activity_keywords;`);
    await db.execute(sql`TRUNCATE TABLE production_reviews;`);
    await db.execute(sql`TRUNCATE TABLE productions;`);
    await db.execute(sql`TRUNCATE TABLE activities;`);
    
    console.log("- Menghapus akun dummy dari tabel users dan user_roles...");
    // Delete specifically citra, budi, andi
    await db.execute(sql`DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username IN ('citra', 'budi', 'andi'));`);
    await db.execute(sql`DELETE FROM users WHERE username IN ('citra', 'budi', 'andi');`);
    
    // Re-enable FK checks
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
    
    console.log("Pembersihan selesai! Database kini hanya berisi data real dan master data.");
  } catch (err) {
    console.error("Gagal membersihkan data:", err);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
  }
  
  process.exit(0);
}

run();
