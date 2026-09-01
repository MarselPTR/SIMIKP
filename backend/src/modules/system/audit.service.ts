import { FastifyRequest } from "fastify";
import { db } from "../../db";
import { auditLogs } from "../../db/schema/system";
import crypto from "crypto";

export async function logAudit(
  request: FastifyRequest,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
) {
  try {
    const id = crypto.randomUUID();
    const cookieSession = request.cookies?.["simikp_session"];
    let actorUserId: string | null = null;
    if (cookieSession) {
      try {
        const decoded = Buffer.from(cookieSession, "base64").toString("utf-8");
        const session = JSON.parse(decoded);
        actorUserId = session.id || null;
      } catch {}
    }

    const ipAddress = request.ip || request.headers["x-forwarded-for"]?.toString() || null;
    const userAgent = request.headers["user-agent"] || null;

    await db.insert(auditLogs).values({
      id,
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: metadata || null,
      ipAddress: typeof ipAddress === "string" ? ipAddress.slice(0, 45) : null,
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
      createdAt: new Date(),
    });
    return id;
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
    return null;
  }
}
