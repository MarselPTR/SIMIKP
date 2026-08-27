import { db } from "./index";
import { sql } from "drizzle-orm";
import {
  roles, users, userRoles, opds, contentTypes, strategicIssues,
  activities, activityStrategicIssues, assignments, activityRequiredContents
} from "./schema";
import { productionItems, productionVersions } from "./schema/production";
import crypto from "crypto";

async function runSeed() {
  console.log("Seeding SIMIKP database with comprehensive test & presentation data...");

  try {
    console.log("Cleaning up existing data...");
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    
    await db.delete(productionVersions);
    await db.delete(productionItems);
    await db.delete(assignments);
    await db.delete(activityRequiredContents);
    await db.delete(activityStrategicIssues);
    await db.delete(activities);
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(roles);
    await db.delete(opds);
    await db.delete(contentTypes);
    await db.delete(strategicIssues);
    
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

    // 1. Roles
    console.log("Inserting roles...");
    const roleAdminId = crypto.randomUUID();
    const rolePetugasId = crypto.randomUUID();
    await db.insert(roles).values([
      { id: roleAdminId, name: "SUPER_ADMIN" },
      { id: rolePetugasId, name: "PETUGAS" },
    ]);

    // 2. Users
    console.log("Inserting users (Admin & Petugas)...");
    const adminId = crypto.randomUUID();
    const userAndiId = crypto.randomUUID();
    const userBudiId = crypto.randomUUID();
    const userCitraId = crypto.randomUUID();

    await db.insert(users).values([
      {
        id: adminId,
        username: "admin",
        passwordHash: "$2a$10$xyz",
        name: "Admin Diskominfo",
        staffType: null,
      },
      {
        id: userAndiId,
        username: "andi",
        passwordHash: "$2a$10$xyz",
        name: "Andi Prahum",
        staffType: "PRAHUM",
      },
      {
        id: userBudiId,
        username: "budi",
        passwordHash: "$2a$10$xyz",
        name: "Budi Fotografer",
        staffType: "FOTO_VIDEO",
      },
      {
        id: userCitraId,
        username: "citra",
        passwordHash: "$2a$10$xyz",
        name: "Citra Desainer",
        staffType: "DESAINER_EDITOR",
      }
    ]);

    await db.insert(userRoles).values([
      { userId: adminId, roleId: roleAdminId },
      { userId: userAndiId, roleId: rolePetugasId },
      { userId: userBudiId, roleId: rolePetugasId },
      { userId: userCitraId, roleId: rolePetugasId },
    ]);

    // 3. OPDs
    console.log("Inserting OPDs...");
    const opdKominfoId = crypto.randomUUID();
    const opdPendidikanId = crypto.randomUUID();
    const opdKesehatanId = crypto.randomUUID();

    await db.insert(opds).values([
      { id: opdKominfoId, name: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo" },
      { id: opdPendidikanId, name: "Dinas Pendidikan", singkatan: "Dispendik" },
      { id: opdKesehatanId, name: "Dinas Kesehatan", singkatan: "Dinkes" },
    ]);

    // 4. Strategic Issues
    console.log("Inserting strategic issues...");
    const issueSosialId = crypto.randomUUID();
    const issueEkonomiId = crypto.randomUUID();
    const issueLingkunganId = crypto.randomUUID();

    await db.insert(strategicIssues).values([
      { id: issueSosialId, name: "SOSIAL" },
      { id: issueEkonomiId, name: "EKONOMI" },
      { id: issueLingkunganId, name: "LINGKUNGAN" },
    ]);

    // 5. Content Types
    console.log("Inserting content types...");
    const ctInfografis = crypto.randomUUID();
    const ctAudio = crypto.randomUUID();
    const ctVideo = crypto.randomUUID();
    const ctFoto = crypto.randomUUID();
    const ctBumper = crypto.randomUUID();
    const ctNaskah = crypto.randomUUID();

    await db.insert(contentTypes).values([
      { id: ctInfografis, name: "Infografis" },
      { id: ctAudio, name: "AUDIO" },
      { id: ctVideo, name: "VIDEO" },
      { id: ctFoto, name: "FOTO" },
      { id: ctBumper, name: "BUMPER" },
      { id: ctNaskah, name: "NASKAH BERITA" },
    ]);

    // 6. Seed Activities
    console.log("Inserting activities & assignments...");

    const sampleActivities = [
      // Current active month activities
      {
        code: "ACT-2026-0801",
        title: "Pembukaan Bulan Kemerdekaan RI ke-81 Kota Batu",
        strakom: "STR/0801/2026",
        date: new Date("2026-08-01"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis, ctFoto, ctNaskah],
      },
      {
        code: "ACT-2026-0805",
        title: "Rapat Koordinasi Penanganan Inflasi & Pertumbuhan Ekonomi",
        strakom: "STR/0805/2026",
        date: new Date("2026-08-05"),
        issueId: issueEkonomiId,
        contentTypes: [ctInfografis, ctVideo, ctNaskah],
      },
      {
        code: "ACT-2026-0810",
        title: "Festival Wisata & Kuliner Nusantara Kota Batu 2026",
        strakom: "STR/0810/2026",
        date: new Date("2026-08-10"),
        issueId: issueEkonomiId,
        contentTypes: [ctFoto, ctVideo, ctBumper, ctNaskah],
      },
      {
        code: "ACT-2026-0817",
        title: "Upacara Detik-Detik Proklamasi HUT ke-81 RI di Balai Kota Among Tani",
        strakom: "STR/0817/2026",
        date: new Date("2026-08-17"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis, ctFoto, ctVideo, ctBumper, ctNaskah],
      },
      {
        code: "ACT-2026-0820",
        title: "Pameran Inovasi Pengelolaan Sampah & Lingkungan Hidup",
        strakom: "STR/0820/2026",
        date: new Date("2026-08-20"),
        issueId: issueLingkunganId,
        contentTypes: [ctInfografis, ctAudio, ctVideo, ctFoto],
      },
      {
        code: "ACT-2026-0824",
        title: "Evaluasi Pelaksanaan Sistem Pemerintahan Berbasis Elektronik (SPBE)",
        strakom: "STR/0824/2026",
        date: new Date("2026-08-24"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis, ctNaskah],
      },
    ];

    const seededAssignments = [];

    for (const act of sampleActivities) {
      const actId = crypto.randomUUID();
      await db.insert(activities).values({
        id: actId,
        activityCode: act.code,
        title: act.title,
        strakomNumber: act.strakom,
        activityDate: act.date,
        opdId: opdKominfoId,
        priority: "Tinggi",
        status: "active",
        description: `Kegiatan liputan dan publikasi ${act.title}`,
        createdBy: adminId,
      });

      await db.insert(activityStrategicIssues).values({
        activityId: actId,
        issueId: act.issueId,
      });

      for (const ctId of act.contentTypes) {
        await db.insert(activityRequiredContents).values({
          activityId: actId,
          contentTypeId: ctId,
        });

        // Determine user based on content type
        let targetUser = userAndiId;
        if (ctId === ctFoto || ctId === ctVideo) targetUser = userBudiId;
        if (ctId === ctInfografis || ctId === ctBumper) targetUser = userCitraId;

        const asgnId = crypto.randomUUID();
        await db.insert(assignments).values({
          id: asgnId,
          activityId: actId,
          userId: targetUser,
          contentTypeId: ctId,
          startTime: "08:00:00",
          endTime: "12:00:00",
          status: "ASSIGNED",
          instruction: `Liput dan dokumentasikan ${act.title}`,
          createdBy: adminId,
        });

        seededAssignments.push({ id: asgnId, title: act.title });
      }
    }

    // 7. Seed sample productions for Bank Konten demo
    if (seededAssignments.length > 0) {
      console.log("Seeding sample completed productions for Bank Konten...");
      const prod1 = crypto.randomUUID();
      await db.insert(productionItems).values({
        id: prod1,
        assignmentId: seededAssignments[0].id,
        title: `Hasil Produksi: ${seededAssignments[0].title}`,
        status: "COMPLETED",
        productionDate: new Date(),
      });

      await db.insert(productionVersions).values({
        id: crypto.randomUUID(),
        productionItemId: prod1,
        versionNumber: 1,
        workLink: "https://drive.google.com/sample-work",
        isCurrent: true,
      });
    }

    console.log("Seeding completed successfully! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

runSeed();
