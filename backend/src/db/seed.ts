import { db } from "./index";
import {
  roles, users, userRoles, opds, contentTypes, strategicIssues,
  activities, activityStrategicIssues, assignments, activityRequiredContents
} from "./schema";
import crypto from "crypto";

async function runSeed() {
  console.log("Seeding SIMIKP database with comprehensive report data for 2025 and 2026...");

  try {
    // 1. Clean up existing tables
    console.log("Cleaning up existing data...");
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

    // 2. Roles
    console.log("Inserting roles...");
    const roleAdminId = crypto.randomUUID();
    const rolePetugasId = crypto.randomUUID();
    await db.insert(roles).values([
      { id: roleAdminId, name: "SUPER_ADMIN" },
      { id: rolePetugasId, name: "PETUGAS" },
    ]);

    // 3. Users
    console.log("Inserting users...");
    const adminId = crypto.randomUUID();
    const userAndiId = crypto.randomUUID();
    const userBudiId = crypto.randomUUID();
    const userCitraId = crypto.randomUUID();

    await db.insert(users).values([
      { id: adminId, username: "admin", passwordHash: "$2a$10$xyz", name: "Super Administrator", staffType: null },
      { id: userAndiId, username: "andi", passwordHash: "$2a$10$xyz", name: "Andi Prahum", staffType: "PRAHUM" },
      { id: userBudiId, username: "budi", passwordHash: "$2a$10$xyz", name: "Budi Fotografer", staffType: "FOTO_VIDEO" },
      { id: userCitraId, username: "citra", passwordHash: "$2a$10$xyz", name: "Citra Desainer", staffType: "DESAINER_EDITOR" },
    ]);

    await db.insert(userRoles).values([
      { userId: adminId, roleId: roleAdminId },
      { userId: userAndiId, roleId: rolePetugasId },
      { userId: userBudiId, roleId: rolePetugasId },
      { userId: userCitraId, roleId: rolePetugasId },
    ]);

    // 4. OPDs
    console.log("Inserting OPDs...");
    const opdKominfoId = crypto.randomUUID();
    const opdPendidikanId = crypto.randomUUID();
    const opdKesehatanId = crypto.randomUUID();

    await db.insert(opds).values([
      { id: opdKominfoId, name: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo" },
      { id: opdPendidikanId, name: "Dinas Pendidikan", singkatan: "Dispendik" },
      { id: opdKesehatanId, name: "Dinas Kesehatan", singkatan: "Dinkes" },
    ]);

    // 5. Strategic Issues
    console.log("Inserting strategic issues...");
    const issueSosialId = crypto.randomUUID();
    const issueEkonomiId = crypto.randomUUID();
    const issueLingkunganId = crypto.randomUUID();

    await db.insert(strategicIssues).values([
      { id: issueSosialId, name: "SOSIAL" },
      { id: issueEkonomiId, name: "EKONOMI" },
      { id: issueLingkunganId, name: "LINGKUNGAN" },
    ]);

    // 6. Content Types
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

    // 7. Seed Activities (Agustus 2026, Januari 2026, Januari 2025)
    console.log("Inserting activities & assignments...");

    const sampleActivities = [
      // --- AGUSTUS 2026 (Current Active Month) ---
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

      // --- JANUARI 2026 ---
      {
        code: "ACT-2026-001",
        title: "Peringatan Tahun Baru 2026 Kota Batu",
        strakom: "STR/001/2026",
        date: new Date("2026-01-01"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis, ctFoto],
      },
      {
        code: "ACT-2026-002",
        title: "Peluncuran Program Digitalisasi UMKM 2026",
        strakom: "STR/002/2026",
        date: new Date("2026-01-10"),
        issueId: issueEkonomiId,
        contentTypes: [ctInfografis, ctVideo, ctNaskah],
      },
      {
        code: "ACT-2026-003",
        title: "Aksi Bersih Sungai & Konservasi Sumber Mata Air",
        strakom: "STR/003/2026",
        date: new Date("2026-01-15"),
        issueId: issueLingkunganId,
        contentTypes: [ctFoto, ctAudio, ctBumper],
      },

      // --- JANUARI 2025 ---
      {
        code: "ACT-2025-001",
        title: "Peringatan Tahun Baru 2025",
        strakom: "STR/001/2025",
        date: new Date("2025-01-01"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis],
      },
      {
        code: "ACT-2025-002",
        title: "Press Conference bersama Forkopimda Kota Batu, Evaluasi 2024",
        strakom: "STR/002/2025",
        date: new Date("2025-01-02"),
        issueId: issueSosialId,
        contentTypes: [ctNaskah, ctFoto],
      },
      {
        code: "ACT-2025-003",
        title: "Selamat Memperingati Hari Amal Bhakti ke-79",
        strakom: "STR/003/2025",
        date: new Date("2025-01-02"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis],
      },
      {
        code: "ACT-2025-004",
        title: "Apel Pagi Pertama 2025 Pemkot Batu",
        strakom: "STR/004/2025",
        date: new Date("2025-01-03"),
        issueId: issueSosialId,
        contentTypes: [ctNaskah, ctVideo],
      },
      {
        code: "ACT-2025-005",
        title: "Kota Batu Meraih SPBE Sangat Baik",
        strakom: "STR/005/2025",
        date: new Date("2025-01-03"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis],
      },
      {
        code: "ACT-2025-006",
        title: "9 Tahun Balai Kota Among Tani Kota Batu",
        strakom: "STR/006/2025",
        date: new Date("2025-01-04"),
        issueId: issueSosialId,
        contentTypes: [ctInfografis, ctBumper],
      },
      {
        code: "ACT-2025-007",
        title: "Pasar Murah & Pemberdayaan UMKM Kota Batu",
        strakom: "STR/007/2025",
        date: new Date("2025-01-08"),
        issueId: issueEkonomiId,
        contentTypes: [ctInfografis, ctFoto, ctNaskah],
      },
      {
        code: "ACT-2025-008",
        title: "Gerakan Penghijauan Hutan & Kebersihan Lingkungan",
        strakom: "STR/008/2025",
        date: new Date("2025-01-12"),
        issueId: issueLingkunganId,
        contentTypes: [ctFoto, ctVideo, ctBumper],
      },
    ];

    for (const act of sampleActivities) {
      const actId = crypto.randomUUID();
      await db.insert(activities).values({
        id: actId,
        activityCode: act.code,
        title: act.title,
        strakomNumber: act.strakom,
        activityDate: act.date,
        opdId: opdKominfoId,
        status: "PUBLISHED",
        createdBy: adminId,
      });

      // Insert issue relation
      await db.insert(activityStrategicIssues).values({
        activityId: actId,
        issueId: act.issueId,
      });

      // Insert assignments for each content type
      for (const ctId of act.contentTypes) {
        await db.insert(assignments).values({
          id: crypto.randomUUID(),
          activityId: actId,
          userId: userAndiId,
          contentTypeId: ctId,
          status: "COMPLETED",
          createdBy: adminId,
        });
      }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

runSeed();
