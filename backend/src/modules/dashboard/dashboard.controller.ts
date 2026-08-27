import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { activities, assignments, opds, users } from "../../db/schema";
import { sql, eq } from "drizzle-orm";

export class DashboardController {
  static async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Basic Counts
      const totalActivities = await db.select({ count: sql`COUNT(*)` }).from(activities);
      const activeActivities = await db.select({ count: sql`COUNT(*)` }).from(activities).where(eq(activities.status, 'active'));
      const totalAssignments = await db.select({ count: sql`COUNT(*)` }).from(assignments);
      const inProgressAssignments = await db.select({ count: sql`COUNT(*)` }).from(assignments).where(eq(assignments.status, 'IN_PROGRESS'));
      const completedAssignments = await db.select({ count: sql`COUNT(*)` }).from(assignments).where(eq(assignments.status, 'COMPLETED'));

      // 2. OPD Production Stats (Count of Activities per OPD)
      const opdStats = await db.select({
        name: opds.name,
        singkatan: opds.singkatan,
        count: sql<number>`COUNT(${activities.id})`
      })
      .from(opds)
      .leftJoin(activities, eq(activities.opdId, opds.id))
      .groupBy(opds.id)
      .orderBy(sql`COUNT(${activities.id}) DESC`);

      // 3. Pegawai Production Stats (Count of Completed Assignments per User)
      const pegawaiStats = await db.select({
        id: users.id,
        name: users.name,
        staffType: users.staffType,
        count: sql<number>`COUNT(${assignments.id})`
      })
      .from(users)
      .leftJoin(assignments, sql`${assignments.userId} = ${users.id} AND ${assignments.status} = 'COMPLETED'`)
      .where(sql`${users.staffType} IS NOT NULL`) // Only show Petugas
      .groupBy(users.id)
      .orderBy(sql`COUNT(${assignments.id}) DESC`);

      return reply.send({
        success: true,
        data: {
          totalKegiatan: Number(totalActivities[0].count),
          aktifKegiatan: Number(activeActivities[0].count),
          totalPenugasan: Number(totalAssignments[0].count),
          produksiRunning: Number(inProgressAssignments[0].count),
          reviewPending: 0, // Mock for now until Phase 5
          publikasiPublished: Number(completedAssignments[0].count), // Use completed assignments as a proxy for published
          opdProduction: opdStats.map(o => ({ ...o, count: Number(o.count) })),
          pegawaiProduction: pegawaiStats.map(p => ({ ...p, count: Number(p.count) })),
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memuat data dashboard" });
    }
  }
}
