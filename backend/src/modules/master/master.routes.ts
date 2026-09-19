import { FastifyInstance } from "fastify";
import { MasterController } from "./master.controller";

import { requireRole } from "../../middlewares/role.middleware";

export default async function masterRoutes(server: FastifyInstance) {
  server.get("/opds", MasterController.getOpds);
  server.get("/content-types", MasterController.getContentTypes);
  server.post("/content-types", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN"])] }, MasterController.createContentType);
  server.put("/content-types/:id", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN"])] }, MasterController.updateContentType as any);
  server.delete("/content-types/:id", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN"])] }, MasterController.deleteContentType as any);
}
