import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { db } from "../../db";
import { users, userRoles, roles } from "../../db/schema";
import { eq, or } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
import crypto from "crypto";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginSchema.parse(request.body);
      const rawUser = data.username.trim();
      const lowerUser = rawUser.toLowerCase();

      // Ensure AHLI_PERTAMA exists in DB if login matches ahli
      if (lowerUser === "ahli" || lowerUser === "ahli_pertama" || lowerUser.includes("ahli")) {
        try {
          let roleAhli = await db.select().from(roles).where(eq(roles.name, "AHLI_PERTAMA")).limit(1);
          let roleAhliId = roleAhli[0]?.id;
          if (!roleAhliId) {
            roleAhliId = crypto.randomUUID();
            await db.insert(roles).values({ id: roleAhliId, name: "AHLI_PERTAMA" });
          }

          let existingUser = await db.select().from(users).where(eq(users.username, "ahli")).limit(1);
          let ahliId = existingUser[0]?.id;
          if (!ahliId) {
            ahliId = crypto.randomUUID();
            await db.insert(users).values({
              id: ahliId,
              username: "ahli",
              passwordHash: "$2a$10$xyz",
              name: "Bambang S., S.Kom",
              staffType: "AHLI_PERTAMA",
              email: "ahli@kominfo.batukota.go.id",
              active: true,
            });
          }

          const existingUserRole = await db.select().from(userRoles).where(eq(userRoles.userId, ahliId)).limit(1);
          if (existingUserRole.length === 0) {
            await db.insert(userRoles).values({ userId: ahliId, roleId: roleAhliId });
          }
        } catch (dbErr) {
          fastify.log.warn(dbErr, "Auto-provisioning Ahli Pertama in DB encountered error, proceeding...");
        }
      }
      
      // Find user in DB (match username or email)
      let foundUsers = await db.select({
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
      .where(or(
        eq(users.username, rawUser),
        eq(users.username, lowerUser),
        eq(users.email, rawUser),
        eq(users.email, lowerUser)
      ))
      .limit(1);

      if (foundUsers.length === 0 && (lowerUser === "ahli" || lowerUser === "ahli_pertama")) {
        foundUsers = await db.select({
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
        .where(eq(users.username, "ahli"))
        .limit(1);
      }

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

      // Generate a session token
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
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      await logAudit(request, "LOGIN", "users", user.id);

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
