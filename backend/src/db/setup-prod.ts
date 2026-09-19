import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";
import crypto from "crypto";
import { users, roles, userRoles } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../services/password.service";

async function setupProd() {
  console.log("Menyiapkan master data (Roles & Admin) untuk Production...");
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: process.env.NODE_ENV === "production" 
        ? process.env.DB_REJECT_UNAUTHORIZED !== "false" 
        : false 
    },
  });
  
  const db = drizzle(connection);

  try {
    // 1. Setup Roles
    const requiredRoles = ["SUPER_ADMIN", "AHLI_PERTAMA", "PETUGAS"];
    for (const roleName of requiredRoles) {
      const existing = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
      if (existing.length === 0) {
        await db.insert(roles).values({
          id: crypto.randomUUID(),
          name: roleName
        });
        console.log(`✅ Role '${roleName}' berhasil ditambahkan.`);
      }
    }

    // 2. Setup Super Admin Perdana
    const adminRole = await db.select().from(roles).where(eq(roles.name, "SUPER_ADMIN")).limit(1);
    if (adminRole.length === 0) throw new Error("Role SUPER_ADMIN gagal dibuat!");

    const adminUsers = await db.select().from(userRoles).where(eq(userRoles.roleId, adminRole[0].id)).limit(1);
    
    if (adminUsers.length === 0) {
      console.log("⚠️ Tidak ditemukan satupun akun Super Admin. Membangkitkan akun perdana...");
      
      const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(6).toString("hex");
      const userId = crypto.randomUUID();
      
      await db.insert(users).values({
        id: userId,
        username: "admin_kominfo",
        name: "Administrator Utama",
        email: "admin@kominfo.go.id",
        passwordHash: hashPassword(rawPassword),
        active: true,
      });
      
      await db.insert(userRoles).values({
        userId: userId,
        roleId: adminRole[0].id,
      });

      console.log("\n=========================================================");
      console.log("🎉 AKUN SUPER ADMIN PERDANA BERHASIL DIBUAT!");
      console.log(`   Username : admin_kominfo`);
      console.log(`   Password : ${rawPassword}`);
      console.log("=========================================================");
      console.log(" 🚨 PERINGATAN: Simpan password ini sekarang juga!");
      console.log("    Skrip ini tidak akan menampilkan password ini lagi.");
      console.log("    Harap ubah password setelah berhasil login.");
      console.log("=========================================================\n");
    } else {
      console.log("ℹ️ Akun Super Admin sudah terdeteksi di database. Melewati pembuatan akun baru.");
    }

    console.log("🚀 Proses Setup Database Production Selesai!");
  } catch (error) {
    console.error("❌ Gagal melakukan setup database:", error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

setupProd();
