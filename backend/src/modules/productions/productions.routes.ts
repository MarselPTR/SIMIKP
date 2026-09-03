import { FastifyInstance } from "fastify";
import { ProductionsController } from "./productions.controller";

export default async function productionsRoutes(server: FastifyInstance) {
  server.get("/", ProductionsController.getAll);
  server.post("/", ProductionsController.createProduction);
  server.get("/bank-konten", ProductionsController.getBankKonten);
  server.post("/bank-konten/upload", ProductionsController.uploadBankKonten);
  server.get("/my-tasks", ProductionsController.getMyTasks);
  server.post("/:assignmentId/status", ProductionsController.updateStatus);
  server.post("/:assignmentId/submit", ProductionsController.submitWork);
  server.post("/curate-approval", ProductionsController.curateAndApprove);
}
