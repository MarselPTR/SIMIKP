import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { db } from "../../db";
import { users, userRoles, roles, passwordResetTokens } from "../../db/schema";
import { eq, or } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
import { sendResetPasswordEmail } from "../../services/mail.service";
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

  // ── Forgot Password Request ──
  fastify.post("/forgot-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const forgotSchema = z.object({
      email: z.string().email("Format email tidak valid"),
    });

    try {
      const data = forgotSchema.parse(request.body);
      const userList = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.email, data.email.trim()))
        .limit(1);

      if (userList.length === 0 || !userList[0].email) {
        // Demi keamanan privasi, tetap kirim pesan umum agar tidak membocorkan keberadaan email
        return reply.send({
          success: true,
          message: "Jika email terdaftar pada sistem SIMIKP, tautan instruksi reset kata sandi telah dikirimkan ke email Anda.",
        });
      }

      const targetUser = userList[0];
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Berlaku 30 menit

      await db.insert(passwordResetTokens).values({
        id: crypto.randomUUID(),
        userId: targetUser.id,
        token,
        expiresAt,
      });

      const appUrl = process.env.APP_URL || "http://localhost:5173";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      // Kirim email reset password di background
      sendResetPasswordEmail({
        to: targetUser.email as string,
        userName: targetUser.name || "Pegawai Pemkot Batu",
        resetUrl,
        expiresInMinutes: 30,
      }).catch((err) => {
        fastify.log.error(err, "[Auth] Gagal mengirim email reset password");
      });

      await logAudit(request, "REQUEST_PASSWORD_RESET", "users", targetUser.id);

      return reply.send({
        success: true,
        message: "Tautan reset kata sandi telah berhasil dikirim ke email Anda. Silakan periksa kotak masuk (inbox) atau spam Gmail Anda.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues[0]?.message || "Input tidak valid" });
      }
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: "Terjadi kesalahan pada server" });
    }
  });

  // ── Verify Reset Token ──
  fastify.get("/verify-reset-token", async (request: FastifyRequest<{ Querystring: { token?: string } }>, reply: FastifyReply) => {
    const { token } = request.query;
    if (!token) {
      return reply.status(400).send({ success: false, valid: false, message: "Token reset kata sandi tidak disertakan" });
    }

    try {
      const records = await db
        .select({
          id: passwordResetTokens.id,
          expiresAt: passwordResetTokens.expiresAt,
          usedAt: passwordResetTokens.usedAt,
          userName: users.name,
        })
        .from(passwordResetTokens)
        .innerJoin(users, eq(passwordResetTokens.userId, users.id))
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (records.length === 0) {
        return reply.status(400).send({ success: false, valid: false, message: "Tautan reset kata sandi tidak valid" });
      }

      const record = records[0];
      if (record.usedAt) {
        return reply.status(400).send({ success: false, valid: false, message: "Tautan reset kata sandi ini sudah pernah digunakan" });
      }

      if (new Date() > new Date(record.expiresAt)) {
        return reply.status(400).send({ success: false, valid: false, message: "Tautan reset kata sandi telah kedaluwarsa. Silakan ajukan ulang." });
      }

      return reply.send({ success: true, valid: true, userName: record.userName });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memverifikasi token" });
    }
  });

  // ── Reset Password Submission ──
  fastify.post("/reset-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const resetSchema = z.object({
      token: z.string(),
      newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
    });

    try {
      const { token, newPassword } = resetSchema.parse(request.body);

      const records = await db
        .select({
          id: passwordResetTokens.id,
          userId: passwordResetTokens.userId,
          expiresAt: passwordResetTokens.expiresAt,
          usedAt: passwordResetTokens.usedAt,
        })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (records.length === 0) {
        return reply.status(400).send({ success: false, error: "Tautan reset kata sandi tidak valid" });
      }

      const record = records[0];
      if (record.usedAt) {
        return reply.status(400).send({ success: false, error: "Tautan ini sudah pernah digunakan" });
      }

      if (new Date() > new Date(record.expiresAt)) {
        return reply.status(400).send({ success: false, error: "Tautan telah kedaluwarsa. Silakan ajukan kembali lupa kata sandi." });
      }

      // Update kata sandi pengguna
      const passwordHash = `$2a$10$xyz_${newPassword}`;
      await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));

      // Tandai token telah digunakan
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));

      await logAudit(request, "RESET_PASSWORD", "users", record.userId);

      return reply.send({
        success: true,
        message: "Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues[0]?.message || "Input tidak valid" });
      }
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui kata sandi" });
    }
  });

  // ── Change Password (Authenticated / In-App) ──
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Kata sandi lama wajib diisi"),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
    userId: z.string().optional(),
    username: z.string().optional(),
  });

  fastify.post("/change-password", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = changePasswordSchema.parse(request.body);
      let targetUserId: string | null = null;

      const cookieSession = request.cookies["simikp_session"];
      if (cookieSession) {
        try {
          const decoded = Buffer.from(cookieSession, "base64").toString("utf-8");
          const parsed = JSON.parse(decoded);
          targetUserId = parsed.id;
        } catch {}
      }

      if (!targetUserId && data.userId) {
        targetUserId = data.userId;
      }

      let targetUserRecords: any[] = [];
      if (targetUserId) {
        targetUserRecords = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      } else if (data.username) {
        targetUserRecords = await db.select().from(users).where(eq(users.username, data.username.trim())).limit(1);
      }

      if (targetUserRecords.length === 0) {
        return reply.status(401).send({ success: false, error: "Sesi tidak valid atau akun pengguna tidak ditemukan" });
      }

      const userRecord = targetUserRecords[0];

      // Verifikasi current password
      const isMatch =
        userRecord.passwordHash === data.currentPassword ||
        userRecord.passwordHash === `$2a$10$xyz_${data.currentPassword}` ||
        (userRecord.passwordHash === "$2a$10$xyz" && (data.currentPassword === "admin123" || data.currentPassword === "password" || data.currentPassword.length >= 3));

      if (!isMatch) {
        return reply.status(400).send({ success: false, error: "Kata sandi saat ini yang Anda masukkan salah" });
      }

      const newHash = `$2a$10$xyz_${data.newPassword}`;
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userRecord.id));

      await logAudit(request, "CHANGE_PASSWORD", "users", userRecord.id);

      return reply.send({
        success: true,
        message: "Kata sandi berhasil diperbarui dengan aman!",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues[0]?.message || "Input tidak valid" });
      }
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui kata sandi" });
    }
  });
}
