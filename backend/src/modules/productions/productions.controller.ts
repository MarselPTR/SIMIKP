import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { assignments, activities, contentTypes, users, archiveAssets } from "../../db/schema";
import { productionItems, productionVersions, productionFiles } from "../../db/schema/production";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { logAudit } from "../system/audit.service";
import { createNotification } from "../system/notifications.service";

const updateStatusSchema = z.object({
  status: z.string(),
});

const submitWorkSchema = z.object({
  workLink: z.string().url(),
});

const createProductionSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  contentTypeId: z.string(),
  title: z.string(),
});

export class ProductionsController {
  
  static async createProduction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createProductionSchema.parse(request.body);
      
      const newAssignmentId = crypto.randomUUID();
      const newProductionId = crypto.randomUUID();
      const newVersionId = crypto.randomUUID();

      // Create Assignment -> Production Item -> Production Version
      await db.transaction(async (tx) => {
        await tx.insert(assignments).values({
          id: newAssignmentId,
          activityId: body.activityId, // Assuming UI sends correct UUID
          userId: body.userId,
          contentTypeId: body.contentTypeId,
          status: "LIPUTAN", // Starting status
          createdBy: "system",
        });

        await tx.insert(productionItems).values({
          id: newProductionId,
          assignmentId: newAssignmentId,
          title: body.title,
          status: "LIPUTAN",
        });

        await tx.insert(productionVersions).values({
          id: newVersionId,
          productionItemId: newProductionId,
          versionNumber: 1,
          isCurrent: true,
        });
      });

      await logAudit(request, "CREATE_PRODUCTION", "production_items", newProductionId);

      return reply.status(201).send({ success: true, message: "Produksi berhasil dibuat" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal membuat produksi" });
    }
  }

  static async uploadBankKonten(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const { filename, size, type } = body;

      if (!filename) {
        return reply.status(400).send({ success: false, error: "filename wajib diisi" });
      }

      // Cari productionVersionId yang valid — ambil versi pertama yang ada di DB
      const latestVersion = await db
        .select({ id: productionVersions.id })
        .from(productionVersions)
        .limit(1);

      if (!latestVersion.length) {
        return reply.status(422).send({
          success: false,
          error: "Belum ada data produksi. Silakan buat Penugasan terlebih dahulu sebelum mengunggah file.",
        });
      }

      // Ambil userId dari session auth, atau fallback ke user pertama yang valid dari DB
      const sessionUser = (request as any).user;
      let uploadedBy: string = sessionUser?.id ?? null;

      if (!uploadedBy) {
        // Fallback: pakai user pertama yang ada di DB (FK valid)
        const firstUser = await db.select({ id: users.id }).from(users).limit(1);
        if (!firstUser.length) {
          return reply.status(422).send({ success: false, error: "Tidak ada user di database." });
        }
        uploadedBy = firstUser[0].id;
      }

      const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : "bin";

      const newFileId = crypto.randomUUID();
      const newArchiveId = crypto.randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(productionFiles).values({
          id: newFileId,
          productionVersionId: latestVersion[0].id,
          originalFilename: filename,
          storedFilename: `bk_${Date.now()}_${filename.replace(/\s/g, "_")}`,
          storagePath: `/storage/bank-konten/${new Date().getFullYear()}`,
          mimeType: type || "application/octet-stream",
          fileExtension: ext || "bin",
          fileSize: size || 0,
          uploadedBy,
        });

        await tx.insert(archiveAssets).values({
          id: newArchiveId,
          productionFileId: newFileId,
          title: filename,
          description: `Aset arsip file ${filename}`,
          isPublic: false,
        });
      });

      await logAudit(request, "UPLOAD_BANK_KONTEN", "production_files", newFileId);

      return reply.status(201).send({
        success: true,
        message: `File "${filename}" berhasil dicatat ke database`,
        fileId: newFileId,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menyimpan metadata file ke database" });
    }
  }
  
  // 0. Get All (for Admin Dashboard)
  static async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db
        .select({
          id: assignments.id,
          kegiatan: activities.title,
          bidangPekerjaan: contentTypes.name,
          workLink: productionVersions.workLink,
          startDate: assignments.startTime,
          endDate: assignments.endTime,
          status: assignments.status,
        })
        .from(assignments)
        .leftJoin(activities, eq(assignments.activityId, activities.id))
        .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .leftJoin(productionItems, eq(productionItems.assignmentId, assignments.id))
        .leftJoin(productionVersions, and(
          eq(productionVersions.productionItemId, productionItems.id),
          eq(productionVersions.isCurrent, true)
        ))
        .orderBy(desc(assignments.assignedAt));

      return reply.send({ success: true, data });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data produksi" });
    }
  }

  // 0.5 Get Bank Konten (Group by Activity)
  static async getBankKonten(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get all completed production versions linked to activities
      const rawData = await db
        .select({
          activityId: activities.id,
          activityTitle: activities.title,
          activityDate: activities.activityDate,
          petugasName: users.name,
          contentType: contentTypes.name,
          workLink: productionVersions.workLink,
          prodItemId: productionItems.id,
        })
        .from(productionVersions)
        .innerJoin(productionItems, eq(productionVersions.productionItemId, productionItems.id))
        .innerJoin(assignments, eq(productionItems.assignmentId, assignments.id))
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .innerJoin(users, eq(assignments.userId, users.id))
        .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .where(eq(productionVersions.isCurrent, true));

      // Group by Activity (Folder logic)
      const folderMap = new Map();

      for (const row of rawData) {
        if (!folderMap.has(row.activityId)) {
          folderMap.set(row.activityId, {
            id: row.activityId,
            title: row.activityTitle,
            tanggal: row.activityDate ? new Date(row.activityDate).toLocaleDateString('id-ID') : "-",
            petugas: new Set(),
            files: []
          });
        }
        
        const folder = folderMap.get(row.activityId);
        folder.petugas.add(row.petugasName);
        
        folder.files.push({
          id: row.prodItemId,
          name: `[${row.contentType}] ${row.petugasName.split(' ')[0]}`,
          jenisKonten: row.contentType.toLowerCase().includes('video') ? 'video' : 'foto', // simplified
          workLink: row.workLink
        });
      }

      // Convert Set to String and Map to Array
      const formatted = Array.from(folderMap.values()).map(f => ({
        ...f,
        petugas: Array.from(f.petugas).join(", ")
      }));

      return reply.send({ success: true, data: formatted });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memuat Bank Konten" });
    }
  }

  // 1. Get My Tasks (for Petugas)
  static async getMyTasks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cookieSession = request.cookies["simikp_session"];
      if (!cookieSession) return reply.status(401).send({ error: "Unauthorized" });

      const session = JSON.parse(Buffer.from(cookieSession, "base64").toString("utf-8"));
      const userId = session.id;

      const userTasks = await db
        .select({
          id: assignments.id,
          kegiatan: activities.title,
          lokasi: activities.locationId, // Assuming location name is handled or we just return ID for now
          deadline: assignments.deadline,
          status: assignments.status,
          jenisPekerjaan: contentTypes.name,
          instruksi: assignments.instruction,
        })
        .from(assignments)
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .where(eq(assignments.userId, userId))
        .orderBy(desc(assignments.deadline));

      // Format for frontend
      const formatted = userTasks.map(t => ({
        id: t.id,
        kegiatan: t.kegiatan,
        lokasi: t.lokasi || "Lokasi Default", // Mock location string for MVP
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID") : "-",
        status: t.status,
        jenisPekerjaan: t.jenisPekerjaan,
        instruksi: t.instruksi || "Tidak ada instruksi khusus.",
      }));

      return reply.send({ success: true, data: formatted });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data penugasan saya" });
    }
  }

  // 2. Update Status (Anti-Birokrasi)
  static async updateStatus(request: FastifyRequest<{ Params: { assignmentId: string } }>, reply: FastifyReply) {
    try {
      const { assignmentId } = request.params;
      const { status } = updateStatusSchema.parse(request.body);

      await db.update(assignments)
        .set({ status })
        .where(eq(assignments.id, assignmentId));

      return reply.send({ success: true, message: `Status berhasil diubah menjadi ${status}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengubah status" });
    }
  }

  // 3. Submit Work (Google Drive Link)
  static async submitWork(request: FastifyRequest<{ Params: { assignmentId: string } }>, reply: FastifyReply) {
    try {
      const { assignmentId } = request.params;
      const { workLink } = submitWorkSchema.parse(request.body);

      // We need to fetch the assignment to get its title
      const assignmentData = await db
        .select({
          activityTitle: activities.title,
          contentType: contentTypes.name,
        })
        .from(assignments)
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .where(eq(assignments.id, assignmentId))
        .limit(1);

      if (assignmentData.length === 0) {
        return reply.status(404).send({ success: false, error: "Penugasan tidak ditemukan" });
      }

      await db.transaction(async (tx) => {
        // 1. Update assignment status to COMPLETED
        await tx.update(assignments)
          .set({ status: "COMPLETED" })
          .where(eq(assignments.id, assignmentId));

        // 2. Find or Create productionItem
        let existingItem = await tx
          .select({ id: productionItems.id })
          .from(productionItems)
          .where(eq(productionItems.assignmentId, assignmentId))
          .limit(1);

        let prodItemId = "";
        
        if (existingItem.length > 0) {
          prodItemId = existingItem[0].id;
        } else {
          prodItemId = crypto.randomUUID();
          await tx.insert(productionItems).values({
            id: prodItemId,
            assignmentId,
            title: `[${assignmentData[0].contentType}] ${assignmentData[0].activityTitle}`,
            status: "COMPLETED",
            productionDate: new Date(),
          });
        }

        // 3. Get next version number
        const versions = await tx
          .select({ versionNumber: productionVersions.versionNumber })
          .from(productionVersions)
          .where(eq(productionVersions.productionItemId, prodItemId))
          .orderBy(desc(productionVersions.versionNumber))
          .limit(1);
          
        const nextVersion = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

        // Reset isCurrent for older versions
        await tx.update(productionVersions)
          .set({ isCurrent: false })
          .where(eq(productionVersions.productionItemId, prodItemId));

        // Insert new version
        const newVersionId = crypto.randomUUID();
        await tx.insert(productionVersions).values({
          id: newVersionId,
          productionItemId: prodItemId,
          versionNumber: nextVersion,
          workLink,
          isCurrent: true,
          createdAt: new Date(),
        });
      });

      return reply.send({ success: true, message: "Pekerjaan berhasil dikirim!" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengirim pekerjaan" });
    }
  }
}
