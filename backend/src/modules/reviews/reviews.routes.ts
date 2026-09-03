import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { db } from "../../db";
import { reviews } from "../../db/schema/publications";
import { users } from "../../db/schema/users";
import { productionVersions, productionItems } from "../../db/schema/production";
import { assignments, activities } from "../../db/schema/activities";
import { contentTypes } from "../../db/schema/master";
import { eq } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
import { createNotification } from "../system/notifications.service";
import { sendReviewRevisionEmail } from "../../services/mail.service";

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

      // Kirim email notifikasi revisi jika reviewer meminta perbaikan
      const statusStr = (status || "").toLowerCase();
      if (statusStr.includes("revis") || statusStr.includes("reject") || statusStr.includes("perbaikan")) {
        const authorInfo = await db
          .select({
            authorName: users.name,
            authorEmail: users.email,
            activityTitle: activities.title,
            contentType: contentTypes.name,
          })
          .from(productionVersions)
          .innerJoin(productionItems, eq(productionVersions.productionItemId, productionItems.id))
          .innerJoin(assignments, eq(productionItems.assignmentId, assignments.id))
          .innerJoin(users, eq(assignments.userId, users.id))
          .innerJoin(activities, eq(assignments.activityId, activities.id))
          .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
          .where(eq(productionVersions.id, productionVersionId))
          .limit(1);

        const reviewerInfo = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, finalReviewerId))
          .limit(1);

        if (authorInfo.length > 0 && authorInfo[0].authorEmail) {
          sendReviewRevisionEmail({
            to: authorInfo[0].authorEmail,
            authorName: authorInfo[0].authorName || "Petugas",
            activityTitle: authorInfo[0].activityTitle || "Liputan Kegiatan",
            contentType: authorInfo[0].contentType || "Konten Media",
            reviewerName: reviewerInfo[0]?.name || "Tim Redaktur",
            feedback: feedback || "Terdapat catatan perbaikan materi.",
          }).catch(err => console.error("[Reviews] Gagal mengirim email revisi:", err));
        }
      }

      await logAudit(request, "SUBMIT_REVIEW", "reviews", newReviewId);

      return reply.status(201).send({ success: true, message: "Review berhasil diajukan" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengajukan review" });
    }
  });
}
