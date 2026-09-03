import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { users, userRoles, roles } from "../../db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
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

      // Find Petugas Role
      const petugasRole = await db.select().from(roles).where(eq(roles.name, "PETUGAS")).limit(1);
      if (petugasRole.length > 0) {
        await db.insert(userRoles).values({
          userId: userId,
          roleId: petugasRole[0].id,
        });
      }

      await logAudit(request, "CREATE_USER", "users", userId);

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
}
