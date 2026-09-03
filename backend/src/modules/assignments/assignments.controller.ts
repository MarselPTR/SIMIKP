import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { assignments, activities, users, contentTypes, activityRequiredContents, locations, opds, userRoles, roles } from "../../db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { z } from "zod";
import { createNotification } from "../system/notifications.service";
import { logAudit } from "../system/audit.service";
import {
  sendAssignmentNotificationEmail,
  sendAssignmentScheduleChangeEmail,
  sendAssignmentCancelledEmail,
  sendReviewRevisionEmail,
  sendRevisionSubmissionAlertEmail,
} from "../../services/mail.service";

const createAssignmentSchema = z.object({
  activityId: z.string().optional(),
  userId: z.string().optional(),
  picId: z.string().optional(),
  contentTypeId: z.string().optional(),
  contentType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  instruction: z.string().optional(),
  location: z.string().optional(),
  activityDate: z.string().optional(),
});

const claimAssignmentSchema = z.object({
  activityId: z.string(),
  contentTypeId: z.string().optional(),
  contentType: z.string().optional(),
});

// Jenis konten (role) -> jabatan yang boleh mengklaimnya. Cocok dengan checklist
// "Output yang Dibutuhkan" di form Kegiatan.
const CONTENT_TYPE_TO_STAFF_TYPE: Record<string, string> = {
  "Naskah Berita": "PRAHUM",
  Foto: "FOTOGRAFER",
  Video: "VIDEOGRAFER",
  Reels: "VIDEOGRAFER",
  Infografis: "DESAINER_EDITOR",
  Audio: "DESAINER_EDITOR",
};

// Petugas tanpa jabatan tetap bebas mengklaim role apapun; "FOTO_VIDEO" adalah
// nilai jabatan lama (sebelum dipecah jadi Fotografer/Videografer) dan tetap boleh keduanya.
function staffTypeMatchesContentType(staffType: string | null | undefined, contentTypeName: string): boolean {
  if (!staffType) return true;
  const required = CONTENT_TYPE_TO_STAFF_TYPE[contentTypeName];
  if (!required) return true;
  if (staffType === required) return true;
  if (staffType === "FOTO_VIDEO" && (required === "FOTOGRAFER" || required === "VIDEOGRAFER")) return true;
  return false;
}

const updateAssignmentSchema = z.object({
  activityId: z.string().optional(),
  userId: z.string().optional(),
  picId: z.string().optional(),
  contentTypeId: z.string().optional(),
  contentType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  instruction: z.string().optional(),
  location: z.string().optional(),
  activityDate: z.string().optional(),
  workLink: z.string().optional(),
  revisionNotes: z.string().optional(),
  revisionAuthor: z.string().optional(),
  isRevisionSubmission: z.boolean().optional(),
});

export class AssignmentsController {
  static async getAllAssignments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db
        .select({
          id: assignments.id,
          activityId: assignments.activityId,
          userId: assignments.userId,
          activityTitle: activities.title,
          activityDate: activities.activityDate,
          picName: users.name,
          staffType: users.staffType,
          contentType: contentTypes.name,
          startTime: assignments.startTime,
          endTime: assignments.endTime,
          status: assignments.status,
          instruction: assignments.instruction,
          workLink: assignments.workLink,
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

      const targetActivityKey = body.activityId;
      const targetUserKey = body.userId || body.picId;
      const targetContentTypeKey = body.contentTypeId || body.contentType;

      let finalActivityId = targetActivityKey || "";
      let finalUserId = targetUserKey || "";
      let finalContentTypeId = targetContentTypeKey || "";

      if (targetActivityKey) {
        const actMatches = await db.select().from(activities).where(or(eq(activities.id, targetActivityKey), eq(activities.title, targetActivityKey))).limit(1);
        if (actMatches.length) finalActivityId = actMatches[0].id;
      }

      if (targetUserKey) {
        const userMatches = await db.select().from(users).where(or(eq(users.id, targetUserKey), eq(users.name, targetUserKey))).limit(1);
        if (userMatches.length) finalUserId = userMatches[0].id;
      }

      if (targetContentTypeKey) {
        const ctMatches = await db.select().from(contentTypes).where(or(eq(contentTypes.id, targetContentTypeKey), eq(contentTypes.name, targetContentTypeKey))).limit(1);
        if (ctMatches.length) finalContentTypeId = ctMatches[0].id;
      }

      // Check conflict for the exact same ActivityDate and overlapping time
      if (finalActivityId && finalUserId && body.startTime && body.endTime) {
        const targetActivity = await db
          .select({ activityDate: activities.activityDate })
          .from(activities)
          .where(eq(activities.id, finalActivityId))
          .limit(1);

        if (targetActivity.length > 0) {
          const tDate = targetActivity[0].activityDate;
          
          const existingOnSameDate = await db
            .select({
              id: assignments.id,
              startTime: assignments.startTime,
              endTime: assignments.endTime,
              activityTitle: activities.title,
            })
            .from(assignments)
            .innerJoin(activities, eq(assignments.activityId, activities.id))
            .where(
              and(
                eq(assignments.userId, finalUserId),
                eq(activities.activityDate, tDate)
              )
            );
          
          const isOverlap = (start1: string, end1: string, start2: string, end2: string) => {
            return start1 < end2 && start2 < end1;
          };

          const conflicts = existingOnSameDate.filter(ex => 
            ex.startTime && ex.endTime && 
            isOverlap(body.startTime!, body.endTime!, ex.startTime.toString(), ex.endTime.toString())
          );

          if (conflicts.length > 0) {
            return reply.status(409).send({
              success: false,
              error: "Bentrok Jadwal",
              message: `User sudah memiliki penugasan lain ("${conflicts[0].activityTitle}") pada rentang waktu tersebut.`,
              conflicts
            });
          }
        }
      }

      const cookieSession = request.cookies["simikp_session"];
      let createdBy = finalUserId || "system";
      if (cookieSession) {
        try {
          const session = JSON.parse(Buffer.from(cookieSession, "base64").toString("utf-8"));
          createdBy = session.id;
        } catch (e) {}
      }

      const newId = crypto.randomUUID();
      await db.insert(assignments).values({
        id: newId,
        activityId: finalActivityId,
        userId: finalUserId,
        contentTypeId: finalContentTypeId,
        startTime: body.startTime,
        endTime: body.endTime,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: body.status || "ASSIGNED",
        instruction: body.instruction,
        createdBy,
      });

      if (finalUserId) {
        const act = await db
          .select({
            title: activities.title,
            activityDate: activities.activityDate,
            opdName: opds.name,
            locationName: locations.name,
          })
          .from(activities)
          .leftJoin(opds, eq(activities.opdId, opds.id))
          .leftJoin(locations, eq(activities.locationId, locations.id))
          .where(eq(activities.id, finalActivityId))
          .limit(1);

        const actData = act[0];
        const actTitle = actData?.title || "Kegiatan Baru";

        await createNotification({
          userId: finalUserId,
          type: "ASSIGNMENT",
          title: "Penugasan Baru",
          message: `Anda ditugaskan pada agenda "${actTitle}"`,
          metadata: { assignmentId: newId, activityId: finalActivityId },
        });

        // Kirim email notifikasi jika akun petugas memiliki email
        const targetUser = await db
          .select({
            name: users.name,
            email: users.email,
            roleName: roles.name,
          })
          .from(users)
          .leftJoin(userRoles, eq(users.id, userRoles.userId))
          .leftJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(users.id, finalUserId))
          .limit(1);

        const targetContentType = finalContentTypeId ? await db
          .select({ name: contentTypes.name })
          .from(contentTypes)
          .where(eq(contentTypes.id, finalContentTypeId))
          .limit(1) : [];

        if (targetUser.length > 0 && targetUser[0].email) {
          const appUrl = process.env.APP_URL || "http://localhost:5173";
          const isPetugas = targetUser[0].roleName?.toUpperCase() === "PETUGAS";
          const targetUrl = isPetugas ? `${appUrl}/petugas/penugasan` : `${appUrl}/penugasan`;

          // Asynchronous background call: tidak menghambat respon HTTP API
          sendAssignmentNotificationEmail({
            to: targetUser[0].email,
            officerName: targetUser[0].name || "Petugas",
            activityTitle: actTitle,
            activityDate: actData?.activityDate ? actData.activityDate.toString() : "",
            startTime: body.startTime,
            endTime: body.endTime,
            locationName: actData?.locationName || undefined,
            opdName: actData?.opdName || undefined,
            contentType: targetContentType[0]?.name || body.contentType,
            instruction: body.instruction,
            assignmentId: newId,
            targetUrl,
          }).catch((err) => {
            console.error("[AssignmentsController] Gagal mengirim email:", err);
          });
        }
      }
      await logAudit(request, "CREATE_ASSIGNMENT", "assignments", newId);

      return reply.send({ success: true, message: "Penugasan berhasil dibuat", id: newId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal membuat penugasan" });
    }
  }

  // Petugas mengambil sendiri slot role yang masih kosong di sebuah agenda.
  static async claimAssignment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = claimAssignmentSchema.parse(request.body);

      const cookieSession = request.cookies["simikp_session"];
      let userId: string | null = null;
      if (cookieSession) {
        try {
          const session = JSON.parse(Buffer.from(cookieSession, "base64").toString("utf-8"));
          userId = session.id;
        } catch (e) {}
      }
      const validUser = userId
        ? await db.select({ id: users.id, staffType: users.staffType }).from(users).where(eq(users.id, userId)).limit(1)
        : [];
      if (validUser.length === 0) {
        return reply.status(401).send({ success: false, error: "Sesi tidak valid, silakan login ulang", message: "Sesi tidak valid, silakan login ulang" });
      }
      const finalUserId = validUser[0].id;

      const actMatches = await db.select().from(activities).where(or(eq(activities.id, body.activityId), eq(activities.title, body.activityId))).limit(1);
      if (!actMatches.length) {
        return reply.status(404).send({ success: false, error: "Agenda tidak ditemukan", message: "Agenda tidak ditemukan" });
      }
      const finalActivityId = actMatches[0].id;

      const contentTypeKey = body.contentTypeId || body.contentType;
      if (!contentTypeKey) {
        return reply.status(400).send({ success: false, error: "Role/jenis konten wajib dipilih", message: "Role/jenis konten wajib dipilih" });
      }
      const ctMatches = await db.select().from(contentTypes).where(or(eq(contentTypes.id, contentTypeKey), eq(contentTypes.name, contentTypeKey))).limit(1);
      if (!ctMatches.length) {
        return reply.status(404).send({ success: false, error: "Jenis konten tidak ditemukan", message: "Jenis konten tidak ditemukan" });
      }
      const finalContentTypeId = ctMatches[0].id;

      if (!staffTypeMatchesContentType(validUser[0].staffType, ctMatches[0].name)) {
        return reply.status(403).send({ success: false, error: "Role ini bukan bagian dari jabatan Anda", message: "Role ini bukan bagian dari jabatan Anda" });
      }

      const newId = crypto.randomUUID();

      await db.transaction(async (tx) => {
        const required = await tx.select().from(activityRequiredContents).where(
          and(eq(activityRequiredContents.activityId, finalActivityId), eq(activityRequiredContents.contentTypeId, finalContentTypeId))
        ).limit(1);
        if (!required.length) {
          throw new Error("NOT_REQUIRED");
        }

        const taken = await tx.select({ id: assignments.id }).from(assignments).where(
          and(eq(assignments.activityId, finalActivityId), eq(assignments.contentTypeId, finalContentTypeId))
        ).limit(1);
        if (taken.length) {
          throw new Error("ALREADY_TAKEN");
        }

        await tx.insert(assignments).values({
          id: newId,
          activityId: finalActivityId,
          userId: finalUserId,
          contentTypeId: finalContentTypeId,
          status: "ASSIGNED",
          createdBy: finalUserId,
        });
      });

      // Kirim email konfirmasi pengambilan tugas mandiri (Self-Claim) ke petugas
      const claimDetail = await db
        .select({
          name: users.name,
          email: users.email,
          activityTitle: activities.title,
          activityDate: activities.activityDate,
          locationName: locations.name,
          contentType: contentTypes.name,
        })
        .from(assignments)
        .innerJoin(users, eq(assignments.userId, users.id))
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .leftJoin(locations, eq(activities.locationId, locations.id))
        .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .where(eq(assignments.id, newId))
        .limit(1);

      if (claimDetail.length > 0 && claimDetail[0].email) {
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        sendAssignmentNotificationEmail({
          to: claimDetail[0].email,
          officerName: claimDetail[0].name || "Petugas",
          activityTitle: claimDetail[0].activityTitle,
          activityDate: claimDetail[0].activityDate ? claimDetail[0].activityDate.toString() : "",
          locationName: claimDetail[0].locationName || undefined,
          contentType: claimDetail[0].contentType,
          instruction: "Tugas ini berhasil Anda ambil secara mandiri melalui menu Agenda Tersedia.",
          assignmentId: newId,
          targetUrl: `${appUrl}/petugas/penugasan`,
        }).catch((err) => console.error("[AssignmentsController] Gagal kirim email klaim:", err));
      }

      await logAudit(request, "CLAIM_ASSIGNMENT", "assignments", newId);

      return reply.send({ success: true, message: "Berhasil mengambil tugas", id: newId });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      if (error?.message === "NOT_REQUIRED") {
        return reply.status(400).send({ success: false, error: "Role ini tidak dibutuhkan pada agenda ini", message: "Role ini tidak dibutuhkan pada agenda ini" });
      }
      if (error?.message === "ALREADY_TAKEN") {
        return reply.status(409).send({ success: false, error: "Slot ini sudah diambil petugas lain", message: "Slot ini sudah diambil petugas lain" });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil tugas", message: "Gagal mengambil tugas" });
    }
  }

  static async updateAssignment(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const body = updateAssignmentSchema.parse(request.body);

      // Cek status penugasan sebelum update untuk mendeteksi penyerahan hasil revisi
      const existing = await db
        .select({
          status: assignments.status,
          userId: assignments.userId,
          activityId: assignments.activityId,
          contentTypeId: assignments.contentTypeId,
        })
        .from(assignments)
        .where(eq(assignments.id, id))
        .limit(1);

      const isSubmittingRevision = (body.isRevisionSubmission === true || (existing.length > 0 && existing[0].status === "REVISI")) && body.workLink !== undefined;

      const updateData: Record<string, any> = {};

      if (body.activityId) {
        const actMatches = await db.select().from(activities).where(or(eq(activities.id, body.activityId), eq(activities.title, body.activityId))).limit(1);
        updateData.activityId = actMatches.length ? actMatches[0].id : body.activityId;
      }

      const targetUser = body.userId || body.picId;
      if (targetUser) {
        const userMatches = await db.select().from(users).where(or(eq(users.id, targetUser), eq(users.name, targetUser))).limit(1);
        updateData.userId = userMatches.length ? userMatches[0].id : targetUser;
      }

      const targetContentType = body.contentTypeId || body.contentType;
      if (targetContentType) {
        const ctMatches = await db.select().from(contentTypes).where(or(eq(contentTypes.id, targetContentType), eq(contentTypes.name, targetContentType))).limit(1);
        updateData.contentTypeId = ctMatches.length ? ctMatches[0].id : targetContentType;
      }

      if (body.startTime !== undefined) updateData.startTime = body.startTime;
      if (body.endTime !== undefined) updateData.endTime = body.endTime;
      if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.instruction !== undefined) updateData.instruction = body.instruction;
      if (body.workLink !== undefined) updateData.workLink = body.workLink;

      if (Object.keys(updateData).length > 0) {
        await db.update(assignments)
          .set(updateData)
          .where(eq(assignments.id, id));
        await logAudit(request, "UPDATE_ASSIGNMENT", "assignments", id);

        // 1. Kirim notifikasi email jika status diubah menjadi REVISI oleh Ahli Pertama / Reviewer
        if (body.status && body.status.toUpperCase().includes("REVISI")) {
          const revDetail = await db
            .select({
              officerName: users.name,
              officerEmail: users.email,
              activityTitle: activities.title,
              contentType: contentTypes.name,
            })
            .from(assignments)
            .leftJoin(users, eq(assignments.userId, users.id))
            .leftJoin(activities, eq(assignments.activityId, activities.id))
            .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
            .where(eq(assignments.id, id))
            .limit(1);

          if (revDetail.length > 0 && revDetail[0].officerEmail) {
            sendReviewRevisionEmail({
              to: revDetail[0].officerEmail,
              authorName: revDetail[0].officerName || "Petugas",
              activityTitle: revDetail[0].activityTitle || "Liputan Kegiatan",
              contentType: revDetail[0].contentType || "Konten Media",
              reviewerName: body.revisionAuthor || "Pranata Humas Ahli Pertama",
              feedback: body.revisionNotes || body.instruction || "Terdapat catatan perbaikan materi naskah/liputan.",
            }).catch((err) => console.error("[AssignmentsController] Gagal kirim email revisi:", err));
          }
        }

        // 2. Kirim notifikasi email jika ada pembaruan jadwal pelaksanaan
        const isScheduleChanged = body.startTime !== undefined || body.endTime !== undefined || body.deadline !== undefined || (body.instruction !== undefined && !body.status?.toUpperCase().includes("REVISI")) || body.activityId !== undefined;
        if (isScheduleChanged) {
          const detail = await db
            .select({
              officerName: users.name,
              officerEmail: users.email,
              activityTitle: activities.title,
              activityDate: activities.activityDate,
              locationName: locations.name,
              startTime: assignments.startTime,
              endTime: assignments.endTime,
              instruction: assignments.instruction,
            })
            .from(assignments)
            .leftJoin(users, eq(assignments.userId, users.id))
            .leftJoin(activities, eq(assignments.activityId, activities.id))
            .leftJoin(locations, eq(activities.locationId, locations.id))
            .where(eq(assignments.id, id))
            .limit(1);

          if (detail.length > 0 && detail[0].officerEmail) {
            sendAssignmentScheduleChangeEmail({
              to: detail[0].officerEmail,
              officerName: detail[0].officerName || "Petugas",
              activityTitle: detail[0].activityTitle || "Penugasan Kegiatan",
              activityDate: detail[0].activityDate ? detail[0].activityDate.toString() : "",
              startTime: detail[0].startTime || undefined,
              endTime: detail[0].endTime || undefined,
              locationName: detail[0].locationName || undefined,
              notes: body.instruction || "Jadwal dan detail penugasan telah diperbarui.",
            }).catch(err => console.error("[AssignmentsController] Gagal kirim email perubahan jadwal:", err));
          }
        }

        // 3. Kirim notifikasi email ke Ahli Pertama & Reviewer jika petugas mengirimkan hasil revisi/perbaikan
        if (isSubmittingRevision) {
          const revSubmitDetail = await db
            .select({
              officerName: users.name,
              activityTitle: activities.title,
              contentType: contentTypes.name,
            })
            .from(assignments)
            .leftJoin(users, eq(assignments.userId, users.id))
            .leftJoin(activities, eq(assignments.activityId, activities.id))
            .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
            .where(eq(assignments.id, id))
            .limit(1);

          const targetAhliReviewers = await db
            .select({
              name: users.name,
              email: users.email,
            })
            .from(users)
            .leftJoin(userRoles, eq(users.id, userRoles.userId))
            .leftJoin(roles, eq(userRoles.roleId, roles.id))
            .where(
              or(
                eq(roles.name, "AHLI_PERTAMA"),
                eq(users.staffType, "AHLI_PERTAMA"),
                eq(roles.name, "REVIEWER")
              )
            );

          for (const reviewer of targetAhliReviewers) {
            if (reviewer.email) {
              sendRevisionSubmissionAlertEmail({
                to: reviewer.email,
                reviewerName: reviewer.name || "Pranata Humas Ahli Pertama",
                officerName: revSubmitDetail[0]?.officerName || "Petugas Lapangan",
                activityTitle: revSubmitDetail[0]?.activityTitle || "Liputan Kegiatan",
                contentType: revSubmitDetail[0]?.contentType || "Konten Media",
                workLink: body.workLink,
                previousNotes: body.revisionNotes || undefined,
              }).catch((err) => console.error("[AssignmentsController] Gagal kirim email verifikasi revisi ke Ahli Pertama:", err));
            }
          }
        }
      }

      return reply.send({ success: true, message: "Penugasan berhasil diperbarui" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui penugasan" });
    }
  }

  static async deleteAssignment(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      // Ambil data penugasan sebelum dihapus untuk mengirim email pembatalan
      const detail = await db
        .select({
          officerName: users.name,
          officerEmail: users.email,
          activityTitle: activities.title,
        })
        .from(assignments)
        .leftJoin(users, eq(assignments.userId, users.id))
        .leftJoin(activities, eq(assignments.activityId, activities.id))
        .where(eq(assignments.id, id))
        .limit(1);

      await db.delete(assignments).where(eq(assignments.id, id));
      await logAudit(request, "DELETE_ASSIGNMENT", "assignments", id);

      // Kirim email pembatalan jika akun memiliki email
      if (detail.length > 0 && detail[0].officerEmail) {
        sendAssignmentCancelledEmail({
          to: detail[0].officerEmail,
          officerName: detail[0].officerName || "Petugas",
          activityTitle: detail[0].activityTitle || "Penugasan Kegiatan",
        }).catch(err => console.error("[AssignmentsController] Gagal kirim email pembatalan:", err));
      }

      return reply.send({ success: true, message: "Penugasan berhasil dihapus" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menghapus penugasan" });
    }
  }
}
