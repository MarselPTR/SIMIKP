import { db } from "./src/db";
import { users, userRoles, assignments } from "./src/db/schema";
import { inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function run() {
  const dummyUsernames = ["citra", "budi", "andi"];
  
  try {
    const dummyUsers = await db.select({ id: users.id }).from(users).where(inArray(users.username, dummyUsernames));
    const ids = dummyUsers.map(u => u.id);
    
    if (ids.length > 0) {
      console.log(`Menemukan ${ids.length} dummy users. Menghapus data yang terkait...`);
      
      // Hapus dari assignments
      await db.delete(assignments).where(inArray(assignments.userId, ids));
      console.log("- Data penugasan (assignments) dummy terhapus.");
      
      // Hapus dari user_roles
      await db.delete(userRoles).where(inArray(userRoles.userId, ids));
      console.log("- Data role dummy terhapus.");
      
      // Hapus dari users
      await db.delete(users).where(inArray(users.id, ids));
      console.log("- Akun pengguna dummy terhapus.");
      
      console.log("Pembersihan data dummy dari database selesai.");
    } else {
      console.log("Tidak ada data dummy yang ditemukan di database.");
    }
  } catch (err) {
    console.error("Error saat menghapus data:", err);
  }
  
  process.exit(0);
}

run();
