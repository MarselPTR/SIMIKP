import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { assignments, activities, users, contentTypes } from "../../db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { z } from "zod";

const createAssignmentSchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  contentTypeId: z.string().uuid(),
  startTime: z.string(), // format: HH:mm:ss
  endTime: z.string(),   // format: HH:mm:ss
  deadline: z.string().datetime().optional(), // For full Date objects
});

export class AssignmentsController {
  static async getAllAssignments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db
        .select({
          id: assignments.id,
          activityTitle: activities.title,
          activityDate: activities.activityDate,
          picName: users.name,
          contentType: contentTypes.name,
          startTime: assignments.startTime,
          endTime: assignments.endTime,
          status: assignments.status,
        })
        .from(assignments)
        .leftJoin(activities, eq(assignments.activityId, activities.id))
        .leftJoin(users, eq(assignments.userId, users.id))
        .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .orderBy(sql`${activities.activityDate} DESC, ${assignments.startTime} ASC`);

      return reply.send({ success: true, data });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data penugasan" });
    }
  }

  static async createAssignment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createAssignmentSchema.parse(request.body);

      // Check conflict for the exact same ActivityDate and overlapping time
      // First, get the activity date for the target assignment
      const targetActivity = await db
        .select({ activityDate: activities.activityDate })
        .from(activities)
        .where(eq(activities.id, body.activityId))
        .limit(1);

      if (targetActivity.length === 0) {
        return reply.status(404).send({ success: false, error: "Kegiatan tidak ditemukan" });
      }

      const targetDate = targetActivity[0].activityDate;

      // Find overlapping assignments for the same User on the same Date
      const conflicts = await db
        .select({
          id: assignments.id,
          activityTitle: activities.title,
          startTime: assignments.startTime,
          endTime: assignments.endTime
        })
        .from(assignments)
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .where(
          and(
            eq(assignments.userId, body.userId),
            // Date comparison using sql format to ignore time
            sql`DATE(${activities.activityDate}) = DATE(${targetDate})`,
            or(
              // Overlap logic: A overlaps B if (StartA < EndB) AND (EndA > StartB)
              and(
                sql`${assignments.startTime} < ${body.endTime}`,
                sql`${assignments.endTime} > ${body.startTime}`
              )
            )
          )
        );

      if (conflicts.length > 0) {
        return reply.status(409).send({
          success: false,
          error: "Terjadi bentrok jadwal Petugas!",
          conflicts
        });
      }

      // No conflict, safe to create
      const cookieSession = request.cookies["simikp_session"];
      let createdBy = "system";
      if (cookieSession) {
        try {
          const session = JSON.parse(Buffer.from(cookieSession, "base64").toString("utf-8"));
          createdBy = session.id;
        } catch (e) {}
      }

      const newId = crypto.randomUUID();
      await db.insert(assignments).values({
        id: newId,
        activityId: body.activityId,
        userId: body.userId,
        contentTypeId: body.contentTypeId,
        startTime: body.startTime,
        endTime: body.endTime,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: "ASSIGNED",
        createdBy,
      });

      return reply.send({ success: true, message: "Penugasan berhasil dibuat", id: newId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal membuat penugasan" });
    }
  }
}
