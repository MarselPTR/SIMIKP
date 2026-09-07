import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { activities, assignments, opds, users } from "../../db/schema";
import { publications } from "../../db/schema/publications";
import { productionFiles } from "../../db/schema/production";
import { sql, eq, and, gte, lt, inArray, isNotNull } from "drizzle-orm";

export class DashboardController {
  static async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Basic Counts
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const totalActivities = await db
        .select({ count: sql`COUNT(*)` })
        .from(activities)
        .where(and(gte(activities.activityDate, monthStart), lt(activities.activityDate, nextMonthStart)));
      const activeActivities = await db.select({ count: sql`COUNT(*)` }).from(activities).where(eq(activities.status, 'active'));
      const totalAssignments = await db.select({ count: sql`COUNT(*)` }).from(assignments);
      const inProgressAssignments = await db
        .select({ count: sql`COUNT(*)` })
        .from(assignments)
        .where(inArray(assignments.status, ['IN_PROGRESS', 'LIPUTAN', 'DESAIN', 'MENULIS', 'KURASI']));
      const reviewPendingAssignments = await db
        .select({ count: sql`COUNT(*)` })
        .from(assignments)
        .where(and(
          isNotNull(assignments.workLink),
          inArray(assignments.status, ['IN_PROGRESS', 'LIPUTAN', 'DESAIN', 'MENULIS', 'KURASI'])
        ));
      const completedAssignments = await db.select({ count: sql`COUNT(*)` }).from(assignments).where(eq(assignments.status, 'COMPLETED'));
      const publishedContent = await db.select({ count: sql`COUNT(*)` }).from(publications).where(eq(publications.status, 'published'));
      const bankContentFiles = await db.select({ count: sql`COUNT(*)` }).from(productionFiles);

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
          reviewPending: Number(reviewPendingAssignments[0].count),
          publikasiPublished: Number(publishedContent[0].count),
          totalFilesBank: Number(bankContentFiles[0].count),
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
