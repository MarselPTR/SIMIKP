import { FastifyInstance } from "fastify";
import { AssignmentsController } from "./assignments.controller";

export async function assignmentRoutes(server: FastifyInstance) {
  server.get("/", AssignmentsController.getAllAssignments);
  server.post("/", AssignmentsController.createAssignment);
  server.put("/:id", AssignmentsController.updateAssignment);
  server.delete("/:id", AssignmentsController.deleteAssignment);
}
