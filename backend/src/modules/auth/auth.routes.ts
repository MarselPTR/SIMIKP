import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { db } from "../../db";
import { users, userRoles, roles } from "../../db/schema";
import { eq } from "drizzle-orm";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginSchema.parse(request.body);
      
      // Find user
      const foundUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        staffType: users.staffType,
        active: users.active,
        roleName: roles.name,
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.username, data.username))
      .limit(1);

      if (foundUsers.length === 0) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      const user = foundUsers[0];

      if (!user.active) {
        return reply.status(401).send({ error: "Account disabled" });
      }

      // Mock password check: we assume any non-empty password is fine for the dummy prototype
      if (!data.password) {
         return reply.status(401).send({ error: "Invalid credentials" });
      }

      // Generate a mock session token (In a real app, store this session in DB/Redis)
      const sessionToken = JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.roleName,
        staffType: user.staffType,
      });

      // Encode base64 for safe cookie storage
      const encodedSession = Buffer.from(sessionToken).toString("base64");

      // Set HTTP-Only Cookie
      reply.setCookie("simikp_session", encodedSession, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 1 day
      });

      return reply.send({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.roleName,
          staffType: user.staffType,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  fastify.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const cookieSession = request.cookies["simikp_session"];
    if (!cookieSession) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const decodedSession = Buffer.from(cookieSession, "base64").toString("utf-8");
      const sessionUser = JSON.parse(decodedSession);
      
      // Verify user actually still exists in database (handles database resets)
      const foundUsers = await db.select({ id: users.id }).from(users).where(eq(users.id, sessionUser.id)).limit(1);
      if (foundUsers.length === 0) {
        reply.clearCookie("simikp_session", { path: "/" });
        return reply.status(401).send({ error: "Invalid session user" });
      }

      return reply.send({ success: true, user: sessionUser });
    } catch (err) {
      reply.clearCookie("simikp_session", { path: "/" });
      return reply.status(401).send({ error: "Invalid session" });
    }
  });

  fastify.post("/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie("simikp_session", { path: "/" });
    return reply.send({ success: true });
  });
}
