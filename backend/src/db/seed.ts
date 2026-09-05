import { db } from "./index";
import { roles, users, userRoles, opds, contentTypes, activities, assignments, activityRequiredContents } from "./schema";
import { productionItems, productionVersions } from "./schema/production";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { hashPassword } from "../services/password.service";

async function runSeed() {
  console.log("Menyemai database dengan data presentasi Kominfo...");

  try {
    // Clean up existing data
    console.log("Membersihkan data lama...");
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    
    await db.delete(productionVersions);
    await db.delete(productionItems);
    await db.delete(assignments);
    await db.delete(activityRequiredContents);
    try { await db.execute(sql`DELETE FROM activity_strategic_issues;`); } catch(e) {}
    try { await db.execute(sql`DELETE FROM activity_keywords;`); } catch(e) {}
    try { await db.execute(sql`DELETE FROM production_reviews;`); } catch(e) {}
    try { await db.execute(sql`DELETE FROM productions;`); } catch(e) {}
    
    await db.delete(activities);
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(roles);
    await db.delete(opds);
    await db.delete(contentTypes);

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

    // 1. Create Roles
    console.log("Memasukkan role...");
    const roleAhliId = crypto.randomUUID();
    const roleAdminId = crypto.randomUUID();
    const rolePetugasId = crypto.randomUUID();
    
    await db.insert(roles).values([
      { id: roleAhliId, name: "AHLI_PERTAMA" },
      { id: roleAdminId, name: "SUPER_ADMIN" },
      { id: rolePetugasId, name: "PETUGAS" },
    ]);

    // 2. Create Users
    console.log("Memasukkan user (Ahli Pertama, Admin & Petugas)...");
    const ahliId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const userAndiId = crypto.randomUUID();
    const userBudiId = crypto.randomUUID();
    const userCitraId = crypto.randomUUID();
    
    await db.insert(users).values([
      {
        id: ahliId,
        username: "ahli",
        passwordHash: hashPassword("admin123"),
        name: "Bambang S., S.Kom (Ahli Pertama)",
        staffType: "AHLI_PERTAMA",
        email: "ahli@kominfo.batukota.go.id",
      },
      {
        id: adminId,
        username: "admin",
        passwordHash: hashPassword("admin123"),
        name: "Admin Diskominfo",
        staffType: null,
      },
      {
        id: userAndiId,
        username: "andi",
        passwordHash: hashPassword("admin123"),
        name: "Andi Prahum",
        staffType: "PRAHUM",
      },
      {
        id: userBudiId,
        username: "budi",
        passwordHash: hashPassword("admin123"),
        name: "Budi Fotografer & Videografer",
        staffType: "FOTO_VIDEO",
      },
      {
        id: userCitraId,
        username: "citra",
        passwordHash: hashPassword("admin123"),
        name: "Citra Desainer",
        staffType: "DESAINER_EDITOR",
      }
    ]);

    // 3. Attach Roles
    await db.insert(userRoles).values([
      { userId: ahliId, roleId: roleAhliId },
      { userId: adminId, roleId: roleAdminId },
      { userId: userAndiId, roleId: rolePetugasId },
      { userId: userBudiId, roleId: rolePetugasId },
      { userId: userCitraId, roleId: rolePetugasId },
    ]);

    // 4. Create OPDs
    console.log("Memasukkan OPD...");
    const opdKominfoId = crypto.randomUUID();
    const opdPendidikanId = crypto.randomUUID();
    const opdKesehatanId = crypto.randomUUID();

    await db.insert(opds).values([
      { id: opdKominfoId, name: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo" },
      { id: opdPendidikanId, name: "Dinas Pendidikan", singkatan: "Dispendik" },
      { id: opdKesehatanId, name: "Dinas Kesehatan", singkatan: "Dinkes" },
    ]);

    // 5. Create Content Types
    console.log("Memasukkan Master Tipe Konten...");
    const ctFoto = crypto.randomUUID();
    const ctVideo = crypto.randomUUID();
    const ctNaskah = crypto.randomUUID();
    const ctInfografis = crypto.randomUUID();

    await db.insert(contentTypes).values([
      { id: ctFoto, name: "Foto", roleCode: "FOTO_VIDEO" },
      { id: ctVideo, name: "Video", roleCode: "FOTO_VIDEO" },
      { id: ctNaskah, name: "Naskah Berita", roleCode: "PRAHUM" },
      { id: ctInfografis, name: "Infografis", roleCode: "DESAINER_EDITOR" },
    ]);

    // 6. Create Kegiatan (Activities)
    console.log("Memasukkan Kegiatan...");
    const act1Id = crypto.randomUUID();
    const act2Id = crypto.randomUUID();
    const act3Id = crypto.randomUUID();
    
    // Future Date for ASSIGNED / IN_PROGRESS
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Past Date for COMPLETED
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    await db.insert(activities).values([
      {
        id: act1Id,
        activityCode: "ACT-001",
        title: "Sosialisasi SPBE Tingkat Kota 2026",
        activityDate: nextWeek,
        activityTime: "08:00",
        opdId: opdKominfoId,
        priority: "Tinggi",
        status: "active",
        description: "Sosialisasi SPBE untuk seluruh Kepala OPD dan Camat se-Kota Batu.",
        createdBy: adminId,
      },
      {
        id: act2Id,
        activityCode: "ACT-002",
        title: "Kunjungan Kerja Kemenkes RI ke Posyandu",
        activityDate: nextWeek,
        activityTime: "10:00",
        opdId: opdKesehatanId,
        priority: "Tinggi",
        status: "active",
        description: "Kunker Menteri Kesehatan meninjau fasilitas Posyandu unggulan.",
        createdBy: adminId,
      },
      {
        id: act3Id,
        activityCode: "ACT-003",
        title: "Peluncuran Portal Berita Daerah",
        activityDate: lastWeek,
        activityTime: "09:00",
        opdId: opdKominfoId,
        priority: "Sedang",
        status: "done",
        description: "Peluncuran portal berita resmi untuk publikasi pemerintah.",
        createdBy: adminId,
      }
    ]);

    // 7. Insert Required Contents
    await db.insert(activityRequiredContents).values([
      { activityId: act1Id, contentTypeId: ctFoto },
      { activityId: act1Id, contentTypeId: ctNaskah },
      { activityId: act2Id, contentTypeId: ctVideo },
      { activityId: act2Id, contentTypeId: ctNaskah },
      { activityId: act3Id, contentTypeId: ctFoto },
      { activityId: act3Id, contentTypeId: ctInfografis },
    ]);

    // 8. Assignments (Penugasan)
    console.log("Memasukkan Penugasan Logis...");
    
    const assignAct3_Foto = crypto.randomUUID();
    const assignAct3_Info = crypto.randomUUID();

    await db.insert(assignments).values([
      // ACT 1: Sosialisasi SPBE (Assigned to Andi & Budi)
      {
        id: crypto.randomUUID(),
        activityId: act1Id,
        userId: userAndiId, // Andi (Prahum) -> Naskah
        contentTypeId: ctNaskah,
        startTime: "08:00:00",
        endTime: "12:00:00",
        status: "ASSIGNED",
        instruction: "Liput pembukaan oleh Wali Kota dan wawancara Kepala Diskominfo.",
        createdBy: adminId,
      },
      {
        id: crypto.randomUUID(),
        activityId: act1Id,
        userId: userBudiId, // Budi (Foto) -> Foto
        contentTypeId: ctFoto,
        startTime: "08:00:00",
        endTime: "12:00:00",
        status: "ASSIGNED",
        instruction: "Ambil dokumentasi seluruh peserta dan angle wide angle saat paparan.",
        createdBy: adminId,
      },
      // ACT 2: Kunker Kemenkes (In Progress by Andi & Budi)
      {
        id: crypto.randomUUID(),
        activityId: act2Id,
        userId: userAndiId, // Andi (Prahum) -> Naskah
        contentTypeId: ctNaskah,
        startTime: "10:00:00",
        endTime: "13:00:00",
        status: "IN_PROGRESS",
        instruction: "Fokus pada statement Menteri terkait angka stunting.",
        createdBy: adminId,
      },
      {
        id: crypto.randomUUID(),
        activityId: act2Id,
        userId: userBudiId, // Budi (Video) -> Video
        contentTypeId: ctVideo,
        startTime: "10:00:00",
        endTime: "13:00:00",
        status: "ASSIGNED",
        instruction: "Buat video highlight (b-roll) kunker durasi 1 menit.",
        createdBy: adminId,
      },
      // ACT 3: Peluncuran Portal (COMPLETED by Budi & Citra)
      {
        id: assignAct3_Foto,
        activityId: act3Id,
        userId: userBudiId, // Budi -> Foto
        contentTypeId: ctFoto,
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "COMPLETED",
        instruction: "Dokumentasi pemotongan pita.",
        createdBy: adminId,
      },
      {
        id: assignAct3_Info,
        activityId: act3Id,
        userId: userCitraId, // Citra -> Infografis
        contentTypeId: ctInfografis,
        startTime: "13:00:00",
        endTime: "16:00:00",
        status: "COMPLETED",
        instruction: "Buat infografis cara akses portal berita untuk diposting di IG.",
        createdBy: adminId,
      }
    ]);

    // 9. Productions (Hasil Kerja Tersubmit untuk ACT 3)
    console.log("Memasukkan Data Produksi Selesai (Bank Konten)...");
    const prodItem1 = crypto.randomUUID();
    const prodItem2 = crypto.randomUUID();

    await db.insert(productionItems).values([
      {
        id: prodItem1,
        assignmentId: assignAct3_Foto,
        title: "[Foto] Peluncuran Portal Berita Daerah",
        status: "COMPLETED",
        productionDate: lastWeek,
      },
      {
        id: prodItem2,
        assignmentId: assignAct3_Info,
        title: "[Infografis] Peluncuran Portal Berita Daerah",
        status: "COMPLETED",
        productionDate: lastWeek,
      }
    ]);

    await db.insert(productionVersions).values([
      {
        id: crypto.randomUUID(),
        productionItemId: prodItem1,
        versionNumber: 1,
        workLink: "https://drive.google.com/drive/folders/contoh-foto-peluncuran-portal",
        isCurrent: true,
      },
      {
        id: crypto.randomUUID(),
        productionItemId: prodItem2,
        versionNumber: 1,
        workLink: "https://drive.google.com/drive/folders/contoh-infografis-portal",
        isCurrent: true,
      }
    ]);

    // 10. Reviews & Publications
    console.log("Memasukkan Data Review & Publikasi...");
    const { reviews } = await import("./schema/publications.js");
    const { publications } = await import("./schema/publications.js");
    
    const version1Id = crypto.randomUUID();
    const version2Id = crypto.randomUUID();
    const version3Id = crypto.randomUUID();

    // Pastikan kita membuat production version fiktif khusus untuk direview/publikasi
    await db.insert(productionVersions).values([
      { id: version1Id, productionItemId: prodItem1, versionNumber: 2, workLink: "https://docs.google.com/doc1", isCurrent: false },
      { id: version2Id, productionItemId: prodItem2, versionNumber: 2, workLink: "https://docs.google.com/doc2", isCurrent: false },
      { id: version3Id, productionItemId: prodItem1, versionNumber: 3, workLink: "https://docs.google.com/doc3", isCurrent: false }
    ]);

    await db.insert(reviews).values([
      { id: crypto.randomUUID(), productionVersionId: version1Id, reviewerId: adminId, status: "approved", comment: "Bagus, hanya perbaiki meta deskripsi.", reviewedAt: new Date("2026-08-28") },
      { id: crypto.randomUUID(), productionVersionId: version2Id, reviewerId: adminId, status: "revision", comment: "Perbaiki heading dan CTA.", reviewedAt: new Date("2026-08-27") },
      { id: crypto.randomUUID(), productionVersionId: version3Id, reviewerId: adminId, status: "pending", comment: "", reviewedAt: new Date("2026-08-29") },
    ]);

    await db.insert(publications).values([
      { id: crypto.randomUUID(), productionVersionId: version1Id, status: "published", channel: "Website", url: "https://batu.go.id/1", notes: "Views: 1250", recordedBy: adminId, publicationDate: new Date("2026-08-25") },
      { id: crypto.randomUUID(), productionVersionId: version2Id, status: "scheduled", channel: "Instagram", url: "", notes: "Views: 0", recordedBy: adminId, publicationDate: new Date("2026-09-05") },
      { id: crypto.randomUUID(), productionVersionId: version3Id, status: "draft", channel: "YouTube", url: "", notes: "Views: 0", recordedBy: adminId, publicationDate: null },
    ]);

    console.log("Data presentasi berhasil disemai dengan bersih dan logis! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

runSeed();
