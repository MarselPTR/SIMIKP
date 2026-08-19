import { FastifyInstance } from "fastify";
import {
  createAssignmentHandler,
  deleteAssignmentHandler,
  getAssignmentByIdHandler,
  getAssignmentsHandler,
  updateAssignmentHandler,
  updateAssignmentStatusHandler,
} from "./assignments.controller";

export default async function assignmentsRoutes(server: FastifyInstance) {
  server.get("/", getAssignmentsHandler);
  server.get("/:id", getAssignmentByIdHandler);
  server.post("/", createAssignmentHandler);
  server.put("/:id", updateAssignmentHandler);
  server.patch("/:id/status", updateAssignmentStatusHandler);
  server.delete("/:id", deleteAssignmentHandler);
}
