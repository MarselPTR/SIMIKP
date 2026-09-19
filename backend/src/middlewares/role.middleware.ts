import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { users, userRoles, roles } from "../db/schema";
import { eq } from "drizzle-orm";

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      if (!user || !user.id) {
        return reply.status(401).send({ success: false, message: "Unauthorized" });
      }

      // Query database to get the user's role to ensure it's up to date
      const foundUser = await db.select({
        roleName: roles.name
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, user.id))
      .limit(1);

      if (foundUser.length === 0) {
        return reply.status(403).send({ success: false, message: "Forbidden: No role assigned" });
      }

      const role = foundUser[0].roleName;

      if (!allowedRoles.includes(role)) {
        return reply.status(403).send({ success: false, message: "Forbidden: Insufficient permissions" });
      }

    } catch (err) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }
  };
}
