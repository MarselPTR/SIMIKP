import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { opds, contentTypes } from "../../db/schema/master";
import { activityRequiredContents } from "../../db/schema/activities";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class MasterController {
  static async getOpds(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db.select().from(opds);
      return reply.send({ success: true, data });
    } catch (error) {
      return reply.status(500).send({ success: false, error: "Gagal mengambil data OPD" });
    }
  }

  static async getContentTypes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db.select().from(contentTypes);
      return reply.send({ success: true, data });
    } catch (error) {
      return reply.status(500).send({ success: false, error: "Gagal mengambil tipe konten" });
    }
  }

  static async createContentType(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, roleCode } = request.body as { name: string; roleCode: string };
      if (!name || !roleCode) {
        return reply.status(400).send({ success: false, error: "Nama dan Role Code wajib diisi" });
      }

      const id = crypto.randomUUID();
      await db.insert(contentTypes).values({
        id,
        name,
        roleCode,
      });

      return reply.status(201).send({ success: true, message: "Tipe output berhasil ditambahkan", data: { id, name, roleCode } });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return reply.status(400).send({ success: false, error: "Tipe output dengan nama tersebut sudah ada" });
      }
      return reply.status(500).send({ success: false, error: "Gagal menambahkan tipe output" });
    }
  }

  static async updateContentType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { name, roleCode } = request.body as { name: string; roleCode: string };

      if (!name || !roleCode) {
        return reply.status(400).send({ success: false, error: "Nama dan Role Code wajib diisi" });
      }

      await db
        .update(contentTypes)
        .set({ name, roleCode })
        .where(eq(contentTypes.id, id));

      return reply.send({ success: true, message: "Tipe output berhasil diperbarui" });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return reply.status(400).send({ success: false, error: "Tipe output dengan nama tersebut sudah ada" });
      }
      return reply.status(500).send({ success: false, error: "Gagal memperbarui tipe output" });
    }
  }

  static async deleteContentType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      // Cek apakah konten masih digunakan di relasi kegiatan
      const inUse = await db
        .select({ id: activityRequiredContents.id })
        .from(activityRequiredContents)
        .where(eq(activityRequiredContents.contentTypeId, id))
        .limit(1);

      if (inUse.length > 0) {
        return reply.status(400).send({ success: false, error: "Tipe output sedang digunakan dalam kegiatan dan tidak dapat dihapus." });
      }

      await db.delete(contentTypes).where(eq(contentTypes.id, id));
      return reply.send({ success: true, message: "Tipe output berhasil dihapus" });
    } catch (error) {
      return reply.status(500).send({ success: false, error: "Gagal menghapus tipe output" });
    }
  }
}
