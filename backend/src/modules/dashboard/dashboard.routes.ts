import { FastifyInstance } from "fastify";
import { DashboardController } from "./dashboard.controller";

export async function dashboardRoutes(server: FastifyInstance) {
  server.get("/stats", DashboardController.getStats);
}
