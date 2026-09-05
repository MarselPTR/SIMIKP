import { FastifyInstance } from "fastify";
import { MasterController } from "./master.controller";

export default async function masterRoutes(server: FastifyInstance) {
  server.get("/opds", MasterController.getOpds);
  server.get("/content-types", MasterController.getContentTypes);
  server.post("/content-types", MasterController.createContentType);
  server.put("/content-types/:id", MasterController.updateContentType);
  server.delete("/content-types/:id", MasterController.deleteContentType);
}
