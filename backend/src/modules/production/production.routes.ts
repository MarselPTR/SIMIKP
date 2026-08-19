import { FastifyInstance } from "fastify";
import { ProductionController } from "./production.controller";

export default async function productionRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", ProductionController.uploadVersion);
  fastify.get("/download", ProductionController.downloadFile);
  fastify.post("/review", ProductionController.reviewContent);
  fastify.patch("/:id/publish", ProductionController.publishContent);
}