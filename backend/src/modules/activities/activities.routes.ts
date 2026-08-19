import { FastifyInstance } from "fastify";

export default async function activitiesRoutes(server: FastifyInstance) {
  server.get("/", async (request, reply) => {
    return { message: "Activities list placeholder" };
  });

  server.post("/", async (request, reply) => {
    return { message: "Activities create placeholder" };
  });
}
