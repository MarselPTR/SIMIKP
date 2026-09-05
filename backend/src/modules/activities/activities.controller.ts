import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { activities, activityRequiredContents, assignments } from "../../db/schema/activities";
import { productionItems, productionVersions, productionFiles } from "../../db/schema/production";
import { reviews, publications } from "../../db/schema/publications";
import { opds, contentTypes, locations } from "../../db/schema/master";
import { users } from "../../db/schema/users";
import { eq, or, desc, inArray } from "drizzle-orm";
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
  address: z.string().min(1, "Alamat lengkap wajib diisi"),
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
          activityTime: activities.activityTime,
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
        activityDate: r.activityDate,
        activityTime: r.activityTime,
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
      let userId: string | null = null;
      if (cookieSession) {
        try {
          const session = request.server.jwt.verify(cookieSession) as any;
          userId = session.id;
        } catch (e) {}
      }
      // created_by is a NOT NULL FK to users — bail out clearly instead of
      // letting the insert crash with a 500 on an expired/missing session.
      const validUser = userId
        ? await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
        : [];
      if (validUser.length === 0) {
        return reply.status(401).send({ success: false, error: "Sesi tidak valid, silakan login ulang" });
      }
      const createdBy = validUser[0].id;

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
      const locKey = data.locationName || data.location || data.locationId || data.address;
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
          createdBy,
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
      const locKey = data.locationName || data.location || data.locationId || data.address;
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
        // 1. Ambil semua penugasan yang terkait dengan kegiatan ini
        const asgns = await tx
          .select({ id: assignments.id })
          .from(assignments)
          .where(eq(assignments.activityId, id));

        if (asgns.length > 0) {
          const asgnIds = asgns.map((a) => a.id);

          // 2. Ambil item produksi yang terhubung ke penugasan
          const prods = await tx
            .select({ id: productionItems.id })
            .from(productionItems)
            .where(inArray(productionItems.assignmentId, asgnIds));

          if (prods.length > 0) {
            const prodIds = prods.map((p) => p.id);

            // 3. Ambil versi produksi
            const vers = await tx
              .select({ id: productionVersions.id })
              .from(productionVersions)
              .where(inArray(productionVersions.productionItemId, prodIds));

            if (vers.length > 0) {
              const verIds = vers.map((v) => v.id);

              // 4. Hapus reviews, publikasi, berkas media, dan versi produksi
              await tx.delete(reviews).where(inArray(reviews.productionVersionId, verIds));
              await tx.delete(publications).where(inArray(publications.productionVersionId, verIds));
              await tx.delete(productionFiles).where(inArray(productionFiles.productionVersionId, verIds));
              await tx.delete(productionVersions).where(inArray(productionVersions.id, verIds));
            }

            // Hapus item produksi
            await tx.delete(productionItems).where(inArray(productionItems.id, prodIds));
          }

          // 5. Hapus penugasan
          await tx.delete(assignments).where(eq(assignments.activityId, id));
        }

        // 6. Hapus required contents & kegiatan
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
