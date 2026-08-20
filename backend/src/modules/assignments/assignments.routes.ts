import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { assignments, activities } from "../../db/schema";
import { and, eq, lte, gte } from "drizzle-orm";
import { z } from "zod";

const createAssignmentSchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  contentTypeId: z.string().uuid(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Format must be HH:MM:SS"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Format must be HH:MM:SS"),
  deadline: z.string().datetime().optional(),
  instruction: z.string().optional(),
});

export async function assignmentRoutes(fastify: FastifyInstance) {
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createAssignmentSchema.parse(request.body);
      
      // We assume user is authenticated and we have request.user.id
      const createdBy = "TODO_AUTH_USER_ID"; // Replace with actual auth context

      // 1. Ambil tanggal kegiatan dari activityId yang dituju
      const targetActivity = await db.select({ activityDate: activities.activityDate })
        .from(activities)
        .where(eq(activities.id, data.activityId))
        .limit(1);

      if (targetActivity.length === 0) {
        return reply.status(404).send({ error: "Activity not found" });
      }

      const activityDate = targetActivity[0].activityDate;

      // 2. Cari semua penugasan lain untuk userId ini di hari yang sama
      // Untuk mengecek hari yang sama, kita gabungkan JOIN ke tabel activities
      const existingAssignments = await db.select({
        id: assignments.id,
        startTime: assignments.startTime,
        endTime: assignments.endTime,
      })
      .from(assignments)
      .innerJoin(activities, eq(assignments.activityId, activities.id))
      .where(
        and(
          eq(assignments.userId, data.userId),
          eq(activities.activityDate, activityDate)
        )
      );

      // 3. Cek overlap waktu (start_time dan end_time)
      let hasConflict = false;
      const newStart = data.startTime;
      const newEnd = data.endTime;

      for (const assign of existingAssignments) {
        if (!assign.startTime || !assign.endTime) continue;
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (newStart < assign.endTime && newEnd > assign.startTime) {
          hasConflict = true;
          break;
        }
      }

      // 4. Simpan ke database
      const newAssignmentId = crypto.randomUUID();
      await db.insert(assignments).values({
        id: newAssignmentId,
        activityId: data.activityId,
        userId: data.userId,
        contentTypeId: data.contentTypeId,
        startTime: data.startTime,
        endTime: data.endTime,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: "ASSIGNED",
        instruction: data.instruction,
        createdBy,
      });

      // 5. Jika ada bentrok, beri peringatan tapi tetap sukses (200 OK)
      if (hasConflict) {
        return reply.status(200).send({
          success: true,
          id: newAssignmentId,
          warning: true,
          message: "⚠️ Peringatan: PIC memiliki penugasan yang bertabrakan",
        });
      }

      return reply.status(201).send({
        success: true,
        id: newAssignmentId,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
