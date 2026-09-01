import { FastifyRequest, FastifyReply } from "fastify";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications.service";
import { db } from "../../db";
import { auditLogs, users } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export class SystemController {
  static async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cookieSession = request.cookies?.["simikp_session"];
      let userId: string | undefined = undefined;
      if (cookieSession) {
        try {
          const decoded = Buffer.from(cookieSession, "base64").toString("utf-8");
          const session = JSON.parse(decoded);
          userId = session.id;
        } catch {}
      }

      const notifs = await getUserNotifications(userId);
      return reply.send({ success: true, data: notifs });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memuat notifikasi" });
    }
  }

  static async markRead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await markNotificationRead(id);
      return reply.send({ success: true, message: "Notifikasi ditandai telah dibaca" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui notifikasi" });
    }
  }

  static async markAllRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cookieSession = request.cookies?.["simikp_session"];
      let userId: string | undefined = undefined;
      if (cookieSession) {
        try {
          const decoded = Buffer.from(cookieSession, "base64").toString("utf-8");
          const session = JSON.parse(decoded);
          userId = session.id;
        } catch {}
      }

      await markAllNotificationsRead(userId);
      return reply.send({ success: true, message: "Semua notifikasi ditandai telah dibaca" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui notifikasi" });
    }
  }

  static async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const logs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
          actorName: users.name,
          actorUsername: users.username,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorUserId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(50);

      return reply.send({ success: true, data: logs });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil audit logs" });
    }
  }
}
