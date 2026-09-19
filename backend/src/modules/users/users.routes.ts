import { FastifyInstance } from "fastify";
import { UsersController } from "./users.controller";
import { requireRole } from "../../middlewares/role.middleware";

export default async function usersRoutes(server: FastifyInstance) {
  server.get("/notification-preferences", UsersController.getNotificationPreferences);
  server.patch("/notification-preferences", UsersController.updateNotificationPreferences);
  server.get("/petugas", UsersController.getPetugas);
  server.post("/petugas", { preHandler: [requireRole(["SUPER_ADMIN"])] }, UsersController.createPetugas as any);
  server.delete("/petugas/:id", { preHandler: [requireRole(["SUPER_ADMIN"])] }, UsersController.deletePetugas as any);
  server.put("/profile", UsersController.updateProfile);
  server.patch("/profile", UsersController.updateProfile);
}
