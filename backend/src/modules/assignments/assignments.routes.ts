import { FastifyInstance } from "fastify";
import { AssignmentsController } from "./assignments.controller";
import { requireRole } from "../../middlewares/role.middleware";

export async function assignmentRoutes(server: FastifyInstance) {
  server.get("/", AssignmentsController.getAllAssignments);
  
  // Hanya admin/ahli pertama yang bisa membuat/mengubah/menghapus penugasan (Kecuali klaim mandiri)
  server.post("/", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, AssignmentsController.createAssignment);
  server.post("/claim", AssignmentsController.claimAssignment);
  server.put("/:id", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, AssignmentsController.updateAssignment as any);
  server.delete("/:id", { preHandler: [requireRole(["SUPER_ADMIN", "ADMIN", "AHLI_PERTAMA"])] }, AssignmentsController.deleteAssignment as any);
}
