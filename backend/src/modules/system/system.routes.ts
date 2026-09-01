import { FastifyInstance } from "fastify";
import { SystemController } from "./system.controller";

export async function systemRoutes(fastify: FastifyInstance) {
  fastify.get("/notifications", SystemController.getNotifications);
  fastify.patch("/notifications/:id/read", SystemController.markRead);
  fastify.patch("/notifications/read-all", SystemController.markAllRead);
  fastify.get("/audit-logs", SystemController.getAuditLogs);
}
