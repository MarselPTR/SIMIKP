import { FastifyInstance } from "fastify";

export default async function productionRoutes(server: FastifyInstance) {
  server.get("/", async (request, reply) => {
    return { message: "Production list placeholder" };
  });

  server.post("/:versionId/files", async (request, reply) => {
    return { message: "Upload file placeholder" };
  });
}
