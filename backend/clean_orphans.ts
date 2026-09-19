import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

async function cleanOrphans() {
  const archivePath = path.resolve(process.cwd(), "arsip_yatim_2026.json");
  const quarantineDir = path.resolve(process.cwd(), "storage/karantina");
  
  let conn;
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    const cleanUrl = rawUrl.split("?")[0];
    
    conn = await mysql.createConnection({
      uri: cleanUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log("Mencari data yatim...");
    
    // 1. Notifikasi milik user yang hilang
    const [orphanNotifs]: any = await conn.query(`
      SELECT * FROM notifications 
      WHERE user_id NOT IN (SELECT id FROM users)
    `);
    
    // 2. Review tanpa version atau tanpa user (reviewer)
    const [orphanReviews]: any = await conn.query(`
      SELECT * FROM reviews 
      WHERE production_version_id NOT IN (SELECT id FROM production_versions)
         OR reviewer_id NOT IN (SELECT id FROM users)
    `);
    
    // 3. Publikasi tanpa version atau tanpa user (publisher)
    const [orphanPublications]: any = await conn.query(`
      SELECT * FROM publications 
      WHERE production_version_id NOT IN (SELECT id FROM production_versions)
         OR recorded_by NOT IN (SELECT id FROM users)
    `);
    
    // 4. File tanpa version
    const [orphanFiles]: any = await conn.query(`
      SELECT * FROM production_files 
      WHERE production_version_id NOT IN (SELECT id FROM production_versions)
    `);
    
    // 5. File dengan uploader hilang (tapi punya version)
    const [orphanUploaders]: any = await conn.query(`
      SELECT * FROM production_files 
      WHERE uploaded_by NOT IN (SELECT id FROM users)
    `);
    
    // 6. Audit log tanpa user
    const [orphanLogs]: any = await conn.query(`
      SELECT * FROM audit_logs 
      WHERE actor_user_id IS NOT NULL 
        AND actor_user_id NOT IN (SELECT id FROM users)
    `);
    
    // Membuat arsip JSON
    const archiveData = {
      timestamp: new Date().toISOString(),
      orphanNotifications: orphanNotifs,
      orphanReviews: orphanReviews,
      orphanPublications: orphanPublications,
      orphanFiles: orphanFiles,
      orphanUploaders: orphanUploaders,
      orphanLogs: orphanLogs
    };
    
    await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));
    console.log(`Arsip yatim berhasil disimpan ke ${archivePath}`);
    
    // EKSEKUSI PEMBERSIHAN
    console.log("Memulai pembersihan data yatim...");
    
    // Karantina file fisik dari orphanFiles
    if (orphanFiles.length > 0) {
      await fs.mkdir(quarantineDir, { recursive: true });
      for (const file of orphanFiles) {
        const oldPath = path.resolve(process.cwd(), file.storage_path);
        const newPath = path.join(quarantineDir, file.stored_filename);
        try {
          await fs.rename(oldPath, newPath);
          console.log(`Memindahkan ${file.stored_filename} ke karantina.`);
        } catch (e: any) {
          console.log(`Gagal memindahkan file ${file.stored_filename} (mungkin file tidak ada): ${e.message}`);
        }
      }
      
      // Hapus metadata file yatim
      await conn.query(`
        DELETE FROM production_files 
        WHERE production_version_id NOT IN (SELECT id FROM production_versions)
      `);
      console.log(`Dihapus ${orphanFiles.length} file metadata tanpa version.`);
    }
    
    if (orphanNotifs.length > 0) {
      await conn.query(`DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users)`);
      console.log(`Dihapus ${orphanNotifs.length} notifikasi yatim.`);
    }
    
    if (orphanReviews.length > 0) {
      await conn.query(`
        DELETE FROM reviews 
        WHERE production_version_id NOT IN (SELECT id FROM production_versions)
           OR reviewer_id NOT IN (SELECT id FROM users)
      `);
      console.log(`Dihapus ${orphanReviews.length} review yatim.`);
    }
    
    if (orphanPublications.length > 0) {
      await conn.query(`
        DELETE FROM publications 
        WHERE production_version_id NOT IN (SELECT id FROM production_versions)
           OR recorded_by NOT IN (SELECT id FROM users)
      `);
      console.log(`Dihapus ${orphanPublications.length} publikasi yatim.`);
    }
    
    if (orphanUploaders.length > 0) {
      await conn.query(`
        UPDATE production_files 
        SET uploaded_by = NULL 
        WHERE uploaded_by NOT IN (SELECT id FROM users)
      `);
      console.log(`Diupdate ${orphanUploaders.length} file dengan uploader hilang menjadi NULL.`);
    }
    
    if (orphanLogs.length > 0) {
      await conn.query(`
        UPDATE audit_logs 
        SET actor_user_id = NULL 
        WHERE actor_user_id IS NOT NULL 
          AND actor_user_id NOT IN (SELECT id FROM users)
      `);
      console.log(`Diupdate ${orphanLogs.length} audit logs dengan user hilang menjadi NULL.`);
    }
    
    console.log("Proses perbaikan data yatim selesai!");
    
  } catch (err) {
    console.error("Gagal melakukan pembersihan:", err);
  } finally {
    if (conn) await conn.end();
  }
}

cleanOrphans();
