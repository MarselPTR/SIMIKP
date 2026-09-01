import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { db } from "../../db";
import { publications } from "../../db/schema/publications";
import { productionVersions, productionItems } from "../../db/schema/production";
import { eq } from "drizzle-orm";

export async function publicationsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    try {
      // Fetch publikasi join dengan produksi
      const results = await db
        .select({
          id: publications.id,
          title: productionItems.title,
          channel: publications.channel,
          status: publications.status,
          publishDate: publications.publicationDate,
          views: publications.notes,
          link: publications.url,
        })
        .from(publications)
        .leftJoin(productionVersions, eq(publications.productionVersionId, productionVersions.id))
        .leftJoin(productionItems, eq(productionVersions.productionItemId, productionItems.id));
      
      // Parse "Views: 1250" to integer 1250, default to 0 if not parsable
      const mappedResults = results.map((r) => {
        let parsedViews = 0;
        if (r.views && typeof r.views === 'string') {
          const match = r.views.match(/\d+/);
          if (match) parsedViews = parseInt(match[0], 10);
        }
        return {
          ...r,
          views: parsedViews
        };
      });

      return reply.send({ success: true, data: mappedResults });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: "Internal server error" });
    }
  });

  fastify.post("/", async (request, reply) => {
    try {
      const body = request.body as any;
      const { title, channel, status, url } = body;
      
      const newPubId = crypto.randomUUID();
      
      const versions = await db.select().from(productionVersions).limit(1);
      const productionVersionId = versions.length ? versions[0].id : null;

      if (!productionVersionId) {
        return reply.status(422).send({
          success: false,
          message: "Belum ada data produksi. Buat Penugasan terlebih dahulu.",
        });
      }

      // Cari user admin pertama untuk recordedBy
      const { users: usersTable } = await import("../../db/schema/users.js");
      const adminUser = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
      const recordedBy = adminUser.length ? adminUser[0].id : "system";

      await db.insert(publications).values({
        id: newPubId,
        productionVersionId,
        channel: channel || "Website",
        url: url || "",
        status: status || "scheduled",
        publicationDate: new Date(),
        notes: "Views: 0",
        recordedBy,
      });

      return reply.status(201).send({ success: true, message: "Publikasi berhasil ditambahkan" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menambah publikasi" });
    }
  });
}
