import { FastifyInstance } from "fastify";
import { ActivitiesController } from "./activities.controller";

import { requireRole } from "../../middlewares/role.middleware";

export default async function activitiesRoutes(server: FastifyInstance) {
  server.get("/", ActivitiesController.getAll);
  server.post("/", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, ActivitiesController.create);
  server.put("/:id", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, ActivitiesController.update as any);
  server.delete("/:id", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, ActivitiesController.delete as any);
}
