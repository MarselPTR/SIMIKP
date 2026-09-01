import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { activities, activityRequiredContents, assignments } from "../../db/schema/activities";
import { opds, contentTypes, locations } from "../../db/schema/master";
import { eq, or, desc } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { logAudit } from "../system/audit.service";

const createActivitySchema = z.object({
  title: z.string(),
  activityDate: z.string(),
  activityTime: z.string().optional(),
  priority: z.enum(["Tinggi", "Sedang", "Rendah"]).optional().default("Sedang"),
  locationId: z.string().optional(),
  location: z.string().optional(),
  locationName: z.string().optional(),
  kecamatan: z.string().optional(),
  desaKelurahan: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  opdId: z.string().optional(),
  opdPenyelenggara: z.string().optional(),
  description: z.string().optional(),
  outputDibutuhkan: z.array(z.string()).optional(),
});

export class ActivitiesController {
  static async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Fetch activities with OPD and Location
      const rows = await db
        .select({
          id: activities.id,
          title: activities.title,
          activityDate: activities.activityDate,
          priority: activities.priority,
          status: activities.status,
          opdName: opds.name,
          locationId: activities.locationId,
          locationName: locations.name,
          kecamatan: locations.kecamatan,
          desaKelurahan: locations.desaKelurahan,
          address: locations.address,
          lat: locations.lat,
          lng: locations.lng,
        })
        .from(activities)
        .leftJoin(opds, eq(activities.opdId, opds.id))
        .leftJoin(locations, eq(activities.locationId, locations.id))
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
        deadline: r.activityDate ? r.activityDate.toISOString().split("T")[0] : "",
        prioritas: r.priority || "Sedang",
        opdPenyelenggara: r.opdName || "Diskominfo",
        locationId: r.locationId || "",
        lokasi: r.locationName || "",
        kecamatan: r.kecamatan || "",
        desaKelurahan: r.desaKelurahan || "",
        alamat: r.address || "",
        lat: r.lat || null,
        lng: r.lng || null,
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

      // Resolve OPD
      let finalOpdId: string | null = null;
      const opdKey = data.opdId || data.opdPenyelenggara;
      if (opdKey && opdKey.trim()) {
        const existingOpds = await db
          .select()
          .from(opds)
          .where(or(eq(opds.id, opdKey), eq(opds.name, opdKey), eq(opds.singkatan, opdKey)))
          .limit(1);

        if (existingOpds.length > 0) {
          finalOpdId = existingOpds[0].id;
        } else {
          const newOpdId = crypto.randomUUID();
          await db.insert(opds).values({
            id: newOpdId,
            name: opdKey,
            singkatan: opdKey.slice(0, 10),
          });
          finalOpdId = newOpdId;
        }
      }

      // Resolve Location with detail
      let finalLocationId: string | null = null;
      const locKey = data.locationName || data.location || data.locationId;
      if (locKey && locKey.trim()) {
        const existingLocs = await db
          .select()
          .from(locations)
          .where(or(eq(locations.id, locKey), eq(locations.name, locKey)))
          .limit(1);

        if (existingLocs.length > 0) {
          finalLocationId = existingLocs[0].id;
          if (data.kecamatan || data.desaKelurahan || data.address) {
            await db.update(locations)
              .set({
                kecamatan: data.kecamatan || existingLocs[0].kecamatan,
                desaKelurahan: data.desaKelurahan || existingLocs[0].desaKelurahan,
                address: data.address || existingLocs[0].address,
                lat: data.lat ?? existingLocs[0].lat,
                lng: data.lng ?? existingLocs[0].lng,
              })
              .where(eq(locations.id, finalLocationId));
          }
        } else {
          const newLocId = crypto.randomUUID();
          await db.insert(locations).values({
            id: newLocId,
            name: locKey,
            kecamatan: data.kecamatan || null,
            desaKelurahan: data.desaKelurahan || null,
            address: data.address || null,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
          });
          finalLocationId = newLocId;
        }
      }

      await db.transaction(async (tx) => {
        // Insert Activity
        await tx.insert(activities).values({
          id: newId,
          activityCode: code,
          title: data.title,
          activityDate: new Date(data.activityDate),
          activityTime: data.activityTime,
          priority: data.priority,
          locationId: finalLocationId,
          opdId: finalOpdId,
          description: data.description,
          status: "active",
          createdBy: userId,
        });

        // Insert Required Contents
        if (data.outputDibutuhkan && data.outputDibutuhkan.length > 0) {
          for (const ctKey of data.outputDibutuhkan) {
            if (!ctKey || !ctKey.trim()) continue;

            let finalCtId: string | null = null;
            const existingCt = await tx
              .select()
              .from(contentTypes)
              .where(or(eq(contentTypes.id, ctKey), eq(contentTypes.name, ctKey)))
              .limit(1);

            if (existingCt.length > 0) {
              finalCtId = existingCt[0].id;
            } else {
              const newCtId = crypto.randomUUID();
              await tx.insert(contentTypes).values({
                id: newCtId,
                name: ctKey,
              });
              finalCtId = newCtId;
            }

            if (finalCtId) {
              await tx.insert(activityRequiredContents).values({
                activityId: newId,
                contentTypeId: finalCtId,
              });
            }
          }
        }
      });

      await logAudit(request, "CREATE_ACTIVITY", "activities", newId);

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

      // Resolve OPD
      let finalOpdId: string | null = null;
      const opdKey = data.opdId || data.opdPenyelenggara;
      if (opdKey && opdKey.trim()) {
        const existingOpds = await db
          .select()
          .from(opds)
          .where(or(eq(opds.id, opdKey), eq(opds.name, opdKey), eq(opds.singkatan, opdKey)))
          .limit(1);

        if (existingOpds.length > 0) {
          finalOpdId = existingOpds[0].id;
        } else {
          const newOpdId = crypto.randomUUID();
          await db.insert(opds).values({
            id: newOpdId,
            name: opdKey,
            singkatan: opdKey.slice(0, 10),
          });
          finalOpdId = newOpdId;
        }
      }

      // Resolve Location with detail
      let finalLocationId: string | null = null;
      const locKey = data.locationName || data.location || data.locationId;
      if (locKey && locKey.trim()) {
        const existingLocs = await db
          .select()
          .from(locations)
          .where(or(eq(locations.id, locKey), eq(locations.name, locKey)))
          .limit(1);

        if (existingLocs.length > 0) {
          finalLocationId = existingLocs[0].id;
          if (data.kecamatan || data.desaKelurahan || data.address) {
            await db.update(locations)
              .set({
                kecamatan: data.kecamatan || existingLocs[0].kecamatan,
                desaKelurahan: data.desaKelurahan || existingLocs[0].desaKelurahan,
                address: data.address || existingLocs[0].address,
                lat: data.lat ?? existingLocs[0].lat,
                lng: data.lng ?? existingLocs[0].lng,
              })
              .where(eq(locations.id, finalLocationId));
          }
        } else {
          const newLocId = crypto.randomUUID();
          await db.insert(locations).values({
            id: newLocId,
            name: locKey,
            kecamatan: data.kecamatan || null,
            desaKelurahan: data.desaKelurahan || null,
            address: data.address || null,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
          });
          finalLocationId = newLocId;
        }
      }

      await db.transaction(async (tx) => {
        // Update Activity
        await tx.update(activities)
          .set({
            title: data.title,
            activityDate: new Date(data.activityDate),
            activityTime: data.activityTime,
            priority: data.priority,
            locationId: finalLocationId,
            opdId: finalOpdId,
            description: data.description,
          })
          .where(eq(activities.id, id));

        // Update Required Contents (Delete old, insert new)
        await tx.delete(activityRequiredContents).where(eq(activityRequiredContents.activityId, id));

        if (data.outputDibutuhkan && data.outputDibutuhkan.length > 0) {
          for (const ctKey of data.outputDibutuhkan) {
            if (!ctKey || !ctKey.trim()) continue;

            let finalCtId: string | null = null;
            const existingCt = await tx
              .select()
              .from(contentTypes)
              .where(or(eq(contentTypes.id, ctKey), eq(contentTypes.name, ctKey)))
              .limit(1);

            if (existingCt.length > 0) {
              finalCtId = existingCt[0].id;
            } else {
              const newCtId = crypto.randomUUID();
              await tx.insert(contentTypes).values({
                id: newCtId,
                name: ctKey,
              });
              finalCtId = newCtId;
            }

            if (finalCtId) {
              await tx.insert(activityRequiredContents).values({
                activityId: id,
                contentTypeId: finalCtId,
              });
            }
          }
        }
      });

      await logAudit(request, "UPDATE_ACTIVITY", "activities", id);

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

      await logAudit(request, "DELETE_ACTIVITY", "activities", id);

      return reply.send({ success: true, message: "Kegiatan berhasil dihapus" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menghapus kegiatan" });
    }
  }
}
