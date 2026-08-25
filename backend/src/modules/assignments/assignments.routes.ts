import { FastifyInstance } from "fastify";
import { AssignmentsController } from "./assignments.controller";

export async function assignmentRoutes(server: FastifyInstance) {
  server.get("/", AssignmentsController.getAllAssignments);
  server.post("/", AssignmentsController.createAssignment);
}
