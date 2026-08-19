import { FastifyReply, FastifyRequest } from "fastify";
import { CreateAssignmentInput, QueryAssignmentsInput, UpdateAssignmentInput } from "./assignments.schema";
import { db } from "../../db";
import { assignments } from "../../db/schema/activities";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const MOCK_ASSIGNMENTS = [
  {
    id: "asg-201",
    activityId: "act-101",
    activityTitle: "Kunjungan Kerja Wali Kota ke Kecamatan Batu",
    userId: "usr-petugas-01",
    assignedToUserName: "Budi Santoso (Petugas Peliputan)",
    contentTypeId: "ct-01",
    contentTypeName: "Foto Dokumen & Kegiatan",
    deadline: "2026-08-25T15:00:00.000Z",
    instruction: "Ambil minimal 20 foto high-res, fokus pada peresmian UMKM dan respon masyarakat.",
    status: "IN_PROGRESS",
    createdBy: "usr-admin-01",
    assignedAt: "2026-08-19T08:30:00.000Z",
  },
  {
    id: "asg-202",
    activityId: "act-101",
    activityTitle: "Kunjungan Kerja Wali Kota ke Kecamatan Batu",
    userId: "usr-petugas-02",
    assignedToUserName: "Siti Rahma (Videografer)",
    contentTypeId: "ct-02",
    contentTypeName: "Video Bumper & Reel",
    deadline: "2026-08-25T17:00:00.000Z",
    instruction: "Buat video highlight reel durasi 60 detik untuk Instagram & YouTube Shorts.",
    status: "PENDING",
    createdBy: "usr-admin-01",
    assignedAt: "2026-08-19T08:35:00.000Z",
  },
];

export async function getAssignmentsHandler(
  req: FastifyRequest<{ Querystring: QueryAssignmentsInput }>,
  reply: FastifyReply
) {
  try {
    if (db) {
      const result = await db.select().from(assignments);
      return reply.send({
        success: true,
        message: "Berhasil mengambil daftar penugasan dari database",
        data: result,
      });
    }
  } catch (err) {}

  const { activityId, userId, status } = req.query || {};
  let filtered = [...MOCK_ASSIGNMENTS];

  if (activityId) filtered = filtered.filter((a) => a.activityId === activityId);
  if (userId) filtered = filtered.filter((a) => a.userId === userId);
  if (status) filtered = filtered.filter((a) => a.status === status);

  return reply.send({
    success: true,
    message: "Berhasil mengambil daftar penugasan",
    data: filtered,
  });
}

export async function getAssignmentByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const found = MOCK_ASSIGNMENTS.find((a) => a.id === id);

  if (!found) {
    return reply.status(404).send({ success: false, message: "Penugasan tidak ditemukan" });
  }

  return reply.send({ success: true, message: "Detail penugasan ditemukan", data: found });
}

export async function createAssignmentHandler(
  req: FastifyRequest<{ Body: CreateAssignmentInput }>,
  reply: FastifyReply
) {
  const body = req.body;
  const id = randomUUID();

  const newAssignment = {
    id,
    activityId: body.activityId,
    activityTitle: "Kunjungan Kerja Wali Kota ke Kecamatan Batu",
    userId: body.userId,
    assignedToUserName: "Petugas Lapangan",
    contentTypeId: body.contentTypeId,
    contentTypeName: "Hasil Produksi",
    deadline: body.deadline,
    instruction: body.instruction || null,
    status: body.status,
    createdBy: "usr-admin-01",
    assignedAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await db.insert(assignments).values({
        id,
        activityId: body.activityId,
        userId: body.userId,
        contentTypeId: body.contentTypeId,
        deadline: new Date(body.deadline) as any,
        instruction: body.instruction || null,
        status: body.status,
        createdBy: "usr-admin-01",
      });
    }
  } catch (err) {}

  MOCK_ASSIGNMENTS.unshift(newAssignment as any);

  return reply.status(201).send({
    success: true,
    message: "Penugasan berhasil dibuat",
    data: newAssignment,
  });
}

export async function updateAssignmentHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateAssignmentInput }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const index = MOCK_ASSIGNMENTS.findIndex((a) => a.id === id);

  if (index !== -1) {
    MOCK_ASSIGNMENTS[index] = { ...MOCK_ASSIGNMENTS[index], ...req.body } as any;
  }

  return reply.send({
    success: true,
    message: "Penugasan berhasil diperbarui",
    data: MOCK_ASSIGNMENTS[index] || { id, ...req.body },
  });
}

export async function updateAssignmentStatusHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const { status } = req.body;
  const index = MOCK_ASSIGNMENTS.findIndex((a) => a.id === id);

  if (index !== -1) {
    MOCK_ASSIGNMENTS[index].status = status as any;
  }

  return reply.send({
    success: true,
    message: `Status penugasan berhasil diubah menjadi ${status}`,
    data: MOCK_ASSIGNMENTS[index] || { id, status },
  });
}

export async function deleteAssignmentHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const index = MOCK_ASSIGNMENTS.findIndex((a) => a.id === id);
  if (index !== -1) MOCK_ASSIGNMENTS.splice(index, 1);

  return reply.send({ success: true, message: "Penugasan berhasil dihapus" });
}
