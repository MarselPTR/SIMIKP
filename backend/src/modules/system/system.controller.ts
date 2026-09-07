import { FastifyRequest, FastifyReply } from "fastify";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications.service";
import { db } from "../../db";
import { auditLogs, users } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export class SystemController {
  private static getAuthenticatedUserId(request: FastifyRequest): string | null {
    const authenticatedUser = (request as FastifyRequest & { user?: { id?: string } }).user;
    if (authenticatedUser?.id) return authenticatedUser.id;

    const cookieSession = request.cookies?.["simikp_session"];
    if (!cookieSession) return null;
    try {
      const session = request.server.jwt.verify(cookieSession) as { id?: string };
      return session.id || null;
    } catch {
      return null;
    }
  }

  static async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = SystemController.getAuthenticatedUserId(request);
      if (!userId) return reply.status(401).send({ success: false, error: "Unauthorized" });

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
      const userId = SystemController.getAuthenticatedUserId(request);
      if (!userId) return reply.status(401).send({ success: false, error: "Unauthorized" });
      const updated = await markNotificationRead(id, userId);
      if (!updated) return reply.status(404).send({ success: false, error: "Notifikasi tidak ditemukan" });
      return reply.send({ success: true, message: "Notifikasi ditandai telah dibaca" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui notifikasi" });
    }
  }

  static async markAllRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = SystemController.getAuthenticatedUserId(request);
      if (!userId) return reply.status(401).send({ success: false, error: "Unauthorized" });

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
