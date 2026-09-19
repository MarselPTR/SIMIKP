import { FastifyInstance } from "fastify";
import { ProductionsController } from "./productions.controller";

import { requireRole } from "../../middlewares/role.middleware";

export default async function productionsRoutes(server: FastifyInstance) {
  server.get("/", ProductionsController.getAll);
  server.post("/", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, ProductionsController.createProduction);
  server.get("/bank-konten", ProductionsController.getBankKonten);
  server.post("/bank-konten/upload", ProductionsController.uploadBankKonten);
  server.get("/my-tasks", ProductionsController.getMyTasks);
  server.post("/:assignmentId/status", ProductionsController.updateStatus);
  server.post("/:assignmentId/submit", ProductionsController.submitWork);
  server.post("/curate-approval", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, ProductionsController.curateAndApprove);
}
