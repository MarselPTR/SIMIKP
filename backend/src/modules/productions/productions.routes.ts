import { FastifyInstance } from "fastify";
import { ProductionsController } from "./productions.controller";

export default async function productionsRoutes(server: FastifyInstance) {
  server.get("/", ProductionsController.getAll);
  server.get("/bank-konten", ProductionsController.getBankKonten);
  server.get("/my-tasks", ProductionsController.getMyTasks);
  server.post("/:assignmentId/status", ProductionsController.updateStatus);
  server.post("/:assignmentId/submit", ProductionsController.submitWork);
}
