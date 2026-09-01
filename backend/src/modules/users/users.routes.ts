import { FastifyInstance } from "fastify";
import { UsersController } from "./users.controller";

export default async function usersRoutes(server: FastifyInstance) {
  server.get("/petugas", UsersController.getPetugas);
  server.post("/petugas", UsersController.createPetugas);
  server.delete("/petugas/:id", UsersController.deletePetugas);
}
