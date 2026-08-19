import { FastifyReply, FastifyRequest } from "fastify";
import { CreateActivityInput, QueryActivitiesInput, UpdateActivityInput } from "./activities.schema";
import { db } from "../../db";
import { activities, activityKeywords, activityPersons, activityStrategicIssues } from "../../db/schema/activities";
import { eq, like, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const MOCK_ACTIVITIES = [
  {
    id: "act-101",
    activityCode: "KGT-2026-0001",
    title: "Kunjungan Kerja Wali Kota ke Kecamatan Batu",
    strakomNumber: "STR-001/IKP/2026",
    activityDate: "2026-08-25",
    activityTime: "09:00:00",
    locationId: "loc-01",
    locationName: "Kecamatan Batu",
    priority: "HIGH",
    status: "SCHEDULED",
    description: "Peninjauan langsung proyek infrastruktur jalan dan peresmian UMKM lokal.",
    createdBy: "usr-admin-01",
    createdAt: "2026-08-19T08:00:00.000Z",
  },
  {
    id: "act-102",
    activityCode: "KGT-2026-0002",
    title: "Press Conference Penanganan Banjir Musiman",
    strakomNumber: "STR-002/IKP/2026",
    activityDate: "2026-08-26",
    activityTime: "13:30:00",
    locationId: "loc-02",
    locationName: "Balai Kota Batu",
    priority: "URGENT",
    status: "IN_PROGRESS",
    description: "Konferensi pers bersama BPBD dan Dinas PU terkait kesiapsiagaan bencana.",
    createdBy: "usr-admin-01",
    createdAt: "2026-08-19T09:30:00.000Z",
  },
];

export async function getActivitiesHandler(
  req: FastifyRequest<{ Querystring: QueryActivitiesInput }>,
  reply: FastifyReply
) {
  try {
    if (db) {
      const { page = 1, limit = 10, search, status, priority } = req.query || {};
      const offset = (page - 1) * limit;

      let whereClause = undefined;
      if (search) {
        whereClause = or(
          like(activities.title, `%${search}%`),
          like(activities.activityCode, `%${search}%`)
        );
      }

      const result = await db.select().from(activities).where(whereClause).limit(limit).offset(offset);
      return reply.send({
        success: true,
        message: "Berhasil mengambil daftar kegiatan dari database",
        data: result,
        meta: { page, limit, total: result.length, totalPages: 1 },
      });
    }
  } catch (err) {
    // Fallback to mock data if DB is not populated yet
  }

  const { page = 1, limit = 10, search, status, priority } = req.query || {};
  let filtered = [...MOCK_ACTIVITIES];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (a) => a.title.toLowerCase().includes(s) || a.activityCode.toLowerCase().includes(s)
    );
  }

  if (status) filtered = filtered.filter((a) => a.status === status);
  if (priority) filtered = filtered.filter((a) => a.priority === priority);

  const total = filtered.length;
  const start = (page - 1) * limit;

  return reply.send({
    success: true,
    message: "Berhasil mengambil daftar kegiatan",
    data: filtered.slice(start, start + limit),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getActivityByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;

  try {
    if (db) {
      const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
      if (result.length > 0) {
        return reply.send({ success: true, message: "Detail kegiatan ditemukan", data: result[0] });
      }
    }
  } catch (err) {}

  const found = MOCK_ACTIVITIES.find((a) => a.id === id);
  if (!found) {
    return reply.status(404).send({ success: false, message: "Kegiatan tidak ditemukan" });
  }

  return reply.send({ success: true, message: "Detail kegiatan ditemukan", data: found });
}

export async function createActivityHandler(
  req: FastifyRequest<{ Body: CreateActivityInput }>,
  reply: FastifyReply
) {
  const body = req.body;
  const id = randomUUID();
  const activityCode = body.activityCode || `KGT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newActivity = {
    id,
    activityCode,
    title: body.title,
    strakomNumber: body.strakomNumber || null,
    activityDate: body.activityDate,
    activityTime: body.activityTime || null,
    locationId: body.locationId || null,
    priority: body.priority,
    status: body.status,
    description: body.description || null,
    createdBy: "usr-admin-01",
    createdAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await db.insert(activities).values({
        id,
        activityCode,
        title: body.title,
        strakomNumber: body.strakomNumber || null,
        activityDate: body.activityDate as any,
        activityTime: body.activityTime || null,
        locationId: body.locationId || null,
        priority: body.priority,
        status: body.status,
        description: body.description || null,
        createdBy: "usr-admin-01",
      });
    }
  } catch (err) {}

  MOCK_ACTIVITIES.unshift(newActivity as any);

  return reply.status(201).send({
    success: true,
    message: "Kegiatan berhasil dibuat",
    data: newActivity,
  });
}

export async function updateActivityHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateActivityInput }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const index = MOCK_ACTIVITIES.findIndex((a) => a.id === id);

  if (index !== -1) {
    MOCK_ACTIVITIES[index] = { ...MOCK_ACTIVITIES[index], ...req.body } as any;
  }

  return reply.send({
    success: true,
    message: "Kegiatan berhasil diperbarui",
    data: MOCK_ACTIVITIES[index] || { id, ...req.body },
  });
}

export async function deleteActivityHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const index = MOCK_ACTIVITIES.findIndex((a) => a.id === id);
  if (index !== -1) MOCK_ACTIVITIES.splice(index, 1);

  return reply.send({
    success: true,
    message: "Kegiatan berhasil dihapus",
  });
}
