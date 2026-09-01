import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { db } from "../../db";
import { reviews } from "../../db/schema/publications";
import { users } from "../../db/schema/users";
import { productionVersions, productionItems } from "../../db/schema/production";
import { eq } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
import { createNotification } from "../system/notifications.service";

export async function reviewsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    try {
      const results = await db
        .select({
          id: reviews.id,
          content: productionItems.title,
          reviewer: users.name,
          status: reviews.status,
          submittedAt: reviews.reviewedAt,
          feedback: reviews.comment,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.reviewerId, users.id))
        .leftJoin(productionVersions, eq(reviews.productionVersionId, productionVersions.id))
        .leftJoin(productionItems, eq(productionVersions.productionItemId, productionItems.id));
      
      return reply.send({ success: true, data: results });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: "Internal server error" });
    }
  });

  fastify.post("/", async (request, reply) => {
    try {
      const body = request.body as any;
      const { reviewerId, status, feedback } = body;
      
      const newReviewId = crypto.randomUUID();
      
      const versions = await db.select().from(productionVersions).limit(1);
      const productionVersionId = versions.length ? versions[0].id : "dummy-version";
      
      const usersList = await db.select().from(users).limit(1);
      const finalReviewerId = reviewerId || (usersList.length ? usersList[0].id : "system");

      await db.insert(reviews).values({
        id: newReviewId,
        productionVersionId,
        reviewerId: finalReviewerId,
        status: status || "pending",
        comment: feedback || "",
      });

      await logAudit(request, "SUBMIT_REVIEW", "reviews", newReviewId);

      return reply.status(201).send({ success: true, message: "Review berhasil diajukan" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengajukan review" });
    }
  });
}
