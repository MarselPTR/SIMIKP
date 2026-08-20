import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { activities, assignments, productionItems, opds, users } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Total Kegiatan
      const [kegiatanCount] = await db.select({ count: sql<number>`count(*)` }).from(activities);
      
      // 2. Produksi per OPD
      // Mengelompokkan kegiatan berdasarkan OPD
      const produksiPerOpd = await db.select({
        opdName: opds.name,
        total: sql<number>`count(${activities.id})`,
      })
      .from(activities)
      .leftJoin(opds, eq(activities.opdId, opds.id))
      .groupBy(opds.name);

      // 3. Produksi per Pegawai
      // Mengelompokkan assignment/produksi berdasarkan User
      const produksiPerPegawai = await db.select({
        pegawaiName: users.name,
        total: sql<number>`count(${assignments.id})`,
      })
      .from(assignments)
      .innerJoin(users, eq(assignments.userId, users.id))
      .groupBy(users.name);

      // 4. Kegiatan Selesai vs Belum Selesai
      const kegiatanStatus = await db.select({
        status: activities.status,
        total: sql<number>`count(*)`,
      })
      .from(activities)
      .groupBy(activities.status);

      return reply.send({
        success: true,
        data: {
          totalKegiatan: kegiatanCount.count,
          produksiPerOpd,
          produksiPerPegawai,
          kegiatanStatus,
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
