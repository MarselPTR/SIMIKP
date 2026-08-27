import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { users } from "../../db/schema";
import { isNotNull } from "drizzle-orm";

export class UsersController {
  static async getPetugas(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db
        .select({
          id: users.id,
          name: users.name,
          staffType: users.staffType,
        })
        .from(users)
        .where(isNotNull(users.staffType));

      return reply.send({ success: true, data });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data petugas" });
    }
  }
}
