import { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/multipart";
import path from "path";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { LocalPrivateStorage } from "../../services/StorageService";
import { db } from "../../db";
import { productions, productionVersions, productionReviews } from "../../db/schema/production";

const storage = new LocalPrivateStorage();

export class ProductionController {

  // 1. Upload Versi Baru
  static async uploadVersion(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await req.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: "File wajib diunggah" });
      }

      // Ambil field non-file dari body multipart
      const fields: Record<string, any> = {};
      for (const key in data.fields) {
        const field = data.fields[key] as any;
        fields[key] = field ? field.value : undefined;
      }

      const { productionId, title, description, activityCode, contentType, notes, userId } = fields;
      const ext = path.extname(data.filename);
      const now = new Date();

      const metadata = {
        originalFilename: data.filename,
        ext,
        activityCode: activityCode || "GENERAL",
        contentType: contentType || "DOCS",
        year: now.getFullYear().toString(),
        month: String(now.getMonth() + 1).padStart(2, "0"),
      };

      // Simpan stream file ke storage
      const storageResult = await storage.uploadFile(data.file, metadata);

      let targetProductionId = productionId;
      let nextVersion = 1;

      if (!targetProductionId) {
        targetProductionId = crypto.randomUUID();
        await db.insert(productions).values({
          id: targetProductionId,
          title: title || metadata.originalFilename,
          description: description || "",
          activityCode: metadata.activityCode,
          createdById: userId || "system-user",
          currentVersion: 1,
          status: "DRAFT",
        });
      } else {
        const existing = await db.select().from(productions).where(eq(productions.id, targetProductionId));
        if (existing.length > 0) {
          nextVersion = existing[0].currentVersion + 1;
          await db.update(productions)
            .set({ currentVersion: nextVersion, status: "IN_REVIEW", updatedAt: new Date() })
            .where(eq(productions.id, targetProductionId));
        }
      }

      const versionId = crypto.randomUUID();
      await db.insert(productionVersions).values({
        id: versionId,
        productionId: targetProductionId,
        versionNumber: nextVersion,
        filePath: storageResult.path,
        originalFilename: metadata.originalFilename,
        fileSize: storageResult.size,
        contentType: metadata.contentType,
        notes: notes || "",
        uploadedById: userId || "system-user",
      });

      return reply.status(201).send({
        success: true,
        message: "File versi baru berhasil diunggah",
        data: {
          productionId: targetProductionId,
          versionId,
          versionNumber: nextVersion,
          filePath: storageResult.path,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || "Gagal mengunggah file versi baru",
      });
    }
  }

  // 2. Download Stream
  static async downloadFile(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { filePath, filename } = req.query as { filePath?: string; filename?: string };

      if (!filePath) {
        return reply.status(400).send({ success: false, message: "Path file tidak valid" });
      }

      // KUNCI: Tambahkan await karena downloadFile adalah async method
      const fileStream = await storage.downloadFile(filePath);

      if (filename) {
        reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      }

      return reply.type("application/octet-stream").send(fileStream);
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || "File tidak ditemukan",
      });
    }
  }

  // 3. Review (Approve / Reject)
  static async reviewContent(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { productionId, versionId, reviewerId, status, feedback } = req.body as any;

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return reply.status(400).send({ success: false, message: "Status harus APPROVED atau REJECTED" });
      }

      await db.insert(productionReviews).values({
        id: crypto.randomUUID(),
        productionId,
        versionId,
        reviewerId: reviewerId || "reviewer-user",
        status,
        feedback: feedback || "",
      });

      await db.update(productions)
        .set({ status: status === "APPROVED" ? "APPROVED" : "REJECTED", updatedAt: new Date() })
        .where(eq(productions.id, productionId));

      return reply.send({
        success: true,
        message: `Review berhasil disimpan. Status produksi menjadi ${status}`,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || "Gagal menyimpan review",
      });
    }
  }

  // 4. Publish
  static async publishContent(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const target = await db.select().from(productions).where(eq(productions.id, id));
      if (target.length === 0) {
        return reply.status(404).send({ success: false, message: "Data produksi tidak ditemukan" });
      }

      if (target[0].status !== "APPROVED") {
        return reply.status(400).send({ success: false, message: "Konten harus berstatus APPROVED sebelum dipublikasikan" });
      }

      await db.update(productions)
        .set({ status: "PUBLISHED", updatedAt: new Date() })
        .where(eq(productions.id, id));

      return reply.send({ success: true, message: "Konten berhasil dipublikasikan" });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || "Gagal memublikasikan konten",
      });
    }
  }
}