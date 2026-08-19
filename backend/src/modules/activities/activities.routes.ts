import { FastifyInstance } from "fastify";
import {
  createActivityHandler,
  deleteActivityHandler,
  getActivitiesHandler,
  getActivityByIdHandler,
  updateActivityHandler,
} from "./activities.controller";

export default async function activitiesRoutes(server: FastifyInstance) {
  server.get("/", getActivitiesHandler);
  server.get("/:id", getActivityByIdHandler);
  server.post("/", createActivityHandler);
  server.put("/:id", updateActivityHandler);
  server.delete("/:id", deleteActivityHandler);
}
