import { db } from "./index";
import { roles, users, userRoles, opds, contentTypes, activities, assignments, activityRequiredContents } from "./schema";
import crypto from "crypto";
import { sql } from "drizzle-orm";

async function runSeed() {
  console.log("Seeding database with realistic data (GAP #10)...");

  try {
    // Clean up existing data
    console.log("Cleaning up existing data...");
    await db.delete(assignments);
    await db.delete(activityRequiredContents);
    await db.delete(activities);
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(roles);
    await db.delete(opds);
    await db.delete(contentTypes);

    // 1. Create Roles
    console.log("Inserting roles...");
    const roleAdminId = crypto.randomUUID();
    const rolePetugasId = crypto.randomUUID();
    
    await db.insert(roles).values([
      { id: roleAdminId, name: "SUPER_ADMIN" },
      { id: rolePetugasId, name: "PETUGAS" },
    ]);

    // 2. Create Users (Admin + 3 Petugas)
    console.log("Inserting users...");
    const adminId = crypto.randomUUID();
    const userAndiId = crypto.randomUUID();
    const userBudiId = crypto.randomUUID();
    const userCitraId = crypto.randomUUID();
    
    await db.insert(users).values([
      {
        id: adminId,
        username: "admin",
        passwordHash: "$2a$10$xyz", // Mock hash
        name: "Super Administrator",
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

    // 3. Attach Roles
    console.log("Attaching roles...");
    await db.insert(userRoles).values([
      { userId: adminId, roleId: roleAdminId },
      { userId: userAndiId, roleId: rolePetugasId },
      { userId: userBudiId, roleId: rolePetugasId },
      { userId: userCitraId, roleId: rolePetugasId },
    ]);

    // 4. Create OPDs
    console.log("Inserting OPDs...");
    const opdKominfoId = crypto.randomUUID();
    const opdPendidikanId = crypto.randomUUID();
    const opdKesehatanId = crypto.randomUUID();

    await db.insert(opds).values([
      { id: opdKominfoId, name: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo" },
      { id: opdPendidikanId, name: "Dinas Pendidikan", singkatan: "Dispendik" },
      { id: opdKesehatanId, name: "Dinas Kesehatan", singkatan: "Dinkes" },
    ]);

    // 5. Create Content Types
    console.log("Inserting content types...");
    const ctFoto = crypto.randomUUID();
    const ctVideo = crypto.randomUUID();
    const ctNaskah = crypto.randomUUID();
    const ctCaption = crypto.randomUUID();
    const ctReels = crypto.randomUUID();
    const ctFlyer = crypto.randomUUID();
    const ctAudio = crypto.randomUUID();
    const ctBumper = crypto.randomUUID();

    await db.insert(contentTypes).values([
      { id: ctFoto, name: "Foto" },
      { id: ctVideo, name: "Video" },
      { id: ctNaskah, name: "Naskah Berita" },
      { id: ctCaption, name: "Caption" },
      { id: ctReels, name: "Reels" },
      { id: ctFlyer, name: "Flyer/Infografis" },
      { id: ctAudio, name: "Audio" },
      { id: ctBumper, name: "Bumper" },
    ]);

    // 6. Create Dummy Activity & Assignments
    console.log("Inserting dummy activities and assignments...");
    const activityId = crypto.randomUUID();
    await db.insert(activities).values({
      id: activityId,
      activityCode: "ACT-001",
      title: "Upacara Hari Jadi Kota",
      activityDate: new Date("2026-10-17"),
      opdId: opdKominfoId,
      status: "DRAFT",
      createdBy: adminId,
    });

    // Required Contents for Activity
    await db.insert(activityRequiredContents).values([
      { activityId: activityId, contentTypeId: ctFoto },
      { activityId: activityId, contentTypeId: ctNaskah },
      { activityId: activityId, contentTypeId: ctReels },
    ]);

    // Assignments
    await db.insert(assignments).values([
      {
        id: crypto.randomUUID(),
        activityId: activityId,
        userId: userAndiId, // Prahum handles Naskah
        contentTypeId: ctNaskah,
        startTime: "07:00:00",
        endTime: "10:00:00",
        deadline: new Date("2026-10-17T12:00:00Z"),
        status: "ASSIGNED",
        createdBy: adminId,
      },
      {
        id: crypto.randomUUID(),
        activityId: activityId,
        userId: userBudiId, // Foto Video handles Foto & Reels
        contentTypeId: ctFoto,
        startTime: "07:00:00",
        endTime: "10:00:00",
        deadline: new Date("2026-10-17T15:00:00Z"),
        status: "ASSIGNED",
        createdBy: adminId,
      }
    ]);

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

runSeed();
