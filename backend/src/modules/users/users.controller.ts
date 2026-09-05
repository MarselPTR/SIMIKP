import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { users, userRoles, roles } from "../../db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
import { sendWelcomeNewUserEmail } from "../../services/mail.service";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

export class UsersController {
  static async getPetugas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db
        .select({
          id: users.id,
          name: users.name,
          staffType: users.staffType,
          email: users.email,
          nik: users.nik,
          gender: users.gender,
          pasFotoUrl: users.pasFotoUrl,
          active: users.active,
        })
        .from(users)
        .innerJoin(userRoles, eq(userRoles.userId, users.id))
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(eq(roles.name, "PETUGAS"));

      return reply.send({ success: true, data });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data petugas" });
    }
  }

  static async createPetugas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const parts = request.parts();
      const body: any = {};
      let pasFotoUrl = null;
      let scanKtpUrl = null;

      const uploadDir = path.resolve(process.cwd(), "storage/private/users");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for await (const part of parts) {
        if (part.type === 'file') {
          const ext = path.extname(part.filename);
          const uniqueFilename = crypto.randomUUID() + ext;
          const filePath = path.join(uploadDir, uniqueFilename);
          const writeStream = fs.createWriteStream(filePath);
          
          await pipeline(part.file, writeStream);
          
          const url = `/api/v1/users/assets/${uniqueFilename}`; // virtual path
          if (part.fieldname === 'pasFoto') {
            pasFotoUrl = url;
          } else if (part.fieldname === 'scanKtp') {
            scanKtpUrl = url;
          }
        } else {
          body[part.fieldname] = part.value;
        }
      }

      // Check for username conflict
      const existingUser = await db.select().from(users).where(eq(users.username, body.username)).limit(1);
      if (existingUser.length > 0) {
        return reply.status(400).send({ success: false, error: "Username sudah digunakan" });
      }

      const userId = crypto.randomUUID();
      const passwordHash = body.password ? `$2a$10$xyz_${body.password}` : "$2a$10$xyz"; // Mock hash using actual password for demo
      const birthDate = body.birthDate ? new Date(body.birthDate) : null;

      await db.insert(users).values({
        id: userId,
        username: body.username,
        passwordHash,
        name: body.name,
        staffType: body.program || null,
        email: body.email,
        nik: body.nik,
        gender: body.gender,
        birthPlace: body.birthPlace,
        birthDate: birthDate,
        pasFotoUrl,
        active: true,
      });

      // Determine Role based on program
      const targetRoleName = body.program === "AHLI_PERTAMA" ? "AHLI_PERTAMA" : "PETUGAS";
      const targetRole = await db.select().from(roles).where(eq(roles.name, targetRoleName)).limit(1);
      if (targetRole.length > 0) {
        await db.insert(userRoles).values({
          userId: userId,
          roleId: targetRole[0].id,
        });
      } else {
        // Fallback to any role if target not found
        const fallbackRole = await db.select().from(roles).where(eq(roles.name, "PETUGAS")).limit(1);
        if (fallbackRole.length > 0) {
          await db.insert(userRoles).values({
            userId: userId,
            roleId: fallbackRole[0].id,
          });
        }
      }

      await logAudit(request, "CREATE_USER", "users", userId);

      // Kirim email selamat datang dan kredensial akun jika email terisi
      if (body.email) {
        const ROLE_LABEL_MAP: Record<string, string> = {
          PRAHUM: "Pranata Humas (Penulis Naskah)",
          FOTO_VIDEO: "Petugas Fotografer & Videografer",
          DESAINER_EDITOR: "Desainer & Editor Grafis",
          AHLI_PERTAMA: "Pranata Humas Ahli Pertama (Redaktur)",
          ADMIN: "Administrator Sistem",
          MANAGER: "Pimpinan / Manager",
          REVIEWER: "Tim Reviewer",
        };

        const displayRole = (body.program && ROLE_LABEL_MAP[body.program]) || ROLE_LABEL_MAP[targetRoleName] || "Petugas Lapangan";

        sendWelcomeNewUserEmail({
          to: body.email,
          name: body.name || body.username,
          username: body.username,
          temporaryPassword: body.password || "Sesuai yang didaftarkan Admin",
          roleName: displayRole,
        }).catch((err) => {
          console.error("[UsersController] Gagal mengirim welcome email:", err);
        });
      }

      return reply.send({ success: true, message: "Petugas berhasil ditambahkan", id: userId });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menambahkan petugas" });
    }
  }

  static async deletePetugas(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      
      // Delete user_roles first to prevent foreign key constraint fails
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      
      // Delete the user
      await db.delete(users).where(eq(users.id, id));
      
      return reply.send({ success: true, message: "Petugas berhasil dihapus" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menghapus petugas" });
    }
  }

  static async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const { id, username, name, email, nik, phone, bio, pasFotoUrl, avatar, staffType } = body;

      let targetUserId = id;
      const cookieSession = request.cookies["simikp_session"];
      if (!targetUserId && cookieSession) {
        try {
          const session = request.server.jwt.verify(cookieSession) as any;
          targetUserId = session.id;
        } catch {}
      }

      let existingUser: any[] = [];
      if (targetUserId) {
        existingUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      } else if (username) {
        existingUser = await db.select().from(users).where(eq(users.username, username.trim())).limit(1);
      }

      if (!existingUser.length) {
        return reply.status(404).send({ success: false, error: "Pengguna tidak ditemukan" });
      }

      const userRecord = existingUser[0];
      const updateData: Record<string, any> = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (nik !== undefined) updateData.nik = nik;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      if (staffType !== undefined) updateData.staffType = staffType;
      if (pasFotoUrl !== undefined || avatar !== undefined) {
        updateData.pasFotoUrl = pasFotoUrl ?? avatar;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, userRecord.id));
        await logAudit(request, "UPDATE_PROFILE", "users", userRecord.id);
      }

      const [updated] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          phone: users.phone,
          bio: users.bio,
          nik: users.nik,
          staffType: users.staffType,
          pasFotoUrl: users.pasFotoUrl,
        })
        .from(users)
        .where(eq(users.id, userRecord.id))
        .limit(1);

      return reply.send({
        success: true,
        message: "Profil berhasil diperbarui",
        data: updated,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memperbarui profil pengguna" });
    }
  }
}
