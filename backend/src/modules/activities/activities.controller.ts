import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { activities, activityRequiredContents, assignments } from "../../db/schema/activities";
import { opds, contentTypes } from "../../db/schema/master";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";

const createActivitySchema = z.object({
  title: z.string(),
  activityDate: z.string(),
  activityTime: z.string().optional(),
  priority: z.enum(["Tinggi", "Sedang", "Rendah"]).optional().default("Sedang"),
  locationId: z.string().optional(),
  opdId: z.string().optional(),
  description: z.string().optional(),
  outputDibutuhkan: z.array(z.string()).optional(), // array of contentType IDs
});

export class ActivitiesController {
  static async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Fetch activities with OPD
      const rows = await db
        .select({
          id: activities.id,
          title: activities.title,
          activityDate: activities.activityDate,
          priority: activities.priority,
          status: activities.status,
          opdName: opds.name,
        })
        .from(activities)
        .leftJoin(opds, eq(activities.opdId, opds.id))
        .orderBy(desc(activities.createdAt));

      // 2. Fetch required contents for these activities
      const activityIds = rows.map(r => r.id);
      
      let reqContents: any[] = [];
      if (activityIds.length > 0) {
        reqContents = await db
          .select({
            activityId: activityRequiredContents.activityId,
            contentTypeName: contentTypes.name,
          })
          .from(activityRequiredContents)
          .innerJoin(contentTypes, eq(activityRequiredContents.contentTypeId, contentTypes.id));
      }

      // Group required contents by activity ID
      const contentsMap = new Map<string, string[]>();
      reqContents.forEach(rc => {
        if (!contentsMap.has(rc.activityId)) {
          contentsMap.set(rc.activityId, []);
        }
        contentsMap.get(rc.activityId)?.push(rc.contentTypeName);
      });

      // Format response to match frontend expectations
      const formatted = rows.map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        deadline: r.activityDate ? r.activityDate.toISOString().split("T")[0] : "", // maps to activityDate
        prioritas: r.priority || "Sedang",
        opdPenyelenggara: r.opdName || "—",
        outputDibutuhkan: contentsMap.get(r.id) || [],
      }));

      return reply.send({ success: true, data: formatted });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data kegiatan" });
    }
  }

  static async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createActivitySchema.parse(request.body);

      const cookieSession = request.cookies["simikp_session"];
      let userId = "system";
      if (cookieSession) {
        try {
          const decoded = Buffer.from(cookieSession, "base64").toString("utf-8");
          const session = JSON.parse(decoded);
          userId = session.id;
        } catch (e) {}
      }

      const newId = crypto.randomUUID();
      const code = `ACT-${Date.now()}`;

      await db.transaction(async (tx) => {
        // Insert Activity
        await tx.insert(activities).values({
          id: newId,
          activityCode: code,
          title: data.title,
          activityDate: new Date(data.activityDate),
          activityTime: data.activityTime,
          priority: data.priority,
          locationId: data.locationId || null,
          opdId: data.opdId || null,
          description: data.description,
          status: "active",
          createdBy: userId,
        });

        // Insert Required Contents
        if (data.outputDibutuhkan && data.outputDibutuhkan.length > 0) {
          const relations = data.outputDibutuhkan.map(ctId => ({
            activityId: newId,
            contentTypeId: ctId,
          }));
          await tx.insert(activityRequiredContents).values(relations);
        }
      });

      return reply.status(201).send({ success: true, message: "Kegiatan berhasil dibuat", id: newId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal membuat kegiatan" });
    }
  }

  static async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = createActivitySchema.parse(request.body);

      await db.transaction(async (tx) => {
        // Update Activity
        await tx.update(activities)
          .set({
            title: data.title,
            activityDate: new Date(data.activityDate),
            activityTime: data.activityTime,
            priority: data.priority,
            locationId: data.locationId || null,
            opdId: data.opdId || null,
            description: data.description,
          })
          .where(eq(activities.id, id));

        // Update Required Contents (Delete old, insert new)
        await tx.delete(activityRequiredContents).where(eq(activityRequiredContents.activityId, id));

        if (data.outputDibutuhkan && data.outputDibutuhkan.length > 0) {
          const relations = data.outputDibutuhkan.map(ctId => ({
            activityId: id,
            contentTypeId: ctId,
          }));
          await tx.insert(activityRequiredContents).values(relations);
        }
      });

      return reply.send({ success: true, message: "Kegiatan berhasil diperbarui" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui kegiatan" });
    }
  }

  static async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      await db.transaction(async (tx) => {
        await tx.delete(assignments).where(eq(assignments.activityId, id));
        await tx.delete(activityRequiredContents).where(eq(activityRequiredContents.activityId, id));
        await tx.delete(activities).where(eq(activities.id, id));
      });

      return reply.send({ success: true, message: "Kegiatan berhasil dihapus" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menghapus kegiatan" });
    }
  }
}
