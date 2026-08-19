import { db } from "./index";
import { roles, users, userRoles } from "./schema";
import crypto from "crypto";

async function runSeed() {
  console.log("Seeding database...");

  try {
    // 1. Create Roles
    console.log("Inserting roles...");
    const roleSuperAdminId = crypto.randomUUID();
    const rolePetugasId = crypto.randomUUID();
    
    await db.insert(roles).values([
      { id: roleSuperAdminId, name: "SUPER_ADMIN" },
      { id: rolePetugasId, name: "PETUGAS" },
      { id: crypto.randomUUID(), name: "KOORDINATOR" },
      { id: crypto.randomUUID(), name: "PIMPINAN" },
    ]);

    // 2. Create Super Admin User
    console.log("Inserting super admin...");
    const adminUserId = crypto.randomUUID();
    await db.insert(users).values({
      id: adminUserId,
      username: "admin",
      passwordHash: "TODO_HASHED_PASSWORD", // Will be handled by Auth module
      name: "Super Administrator",
    });

    // 3. Attach Role to User
    await db.insert(userRoles).values({
      userId: adminUserId,
      roleId: roleSuperAdminId,
    });

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

runSeed();
