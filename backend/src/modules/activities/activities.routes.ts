import { FastifyInstance } from "fastify";
import { ActivitiesController } from "./activities.controller";

export default async function activitiesRoutes(server: FastifyInstance) {
  server.get("/", ActivitiesController.getAll);
  server.post("/", ActivitiesController.create);
  server.put("/:id", ActivitiesController.update);
  server.delete("/:id", ActivitiesController.delete);
}
