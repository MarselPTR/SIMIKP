import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { opds, contentTypes } from "../../db/schema/master";

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
}
