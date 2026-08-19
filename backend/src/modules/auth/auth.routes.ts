import { FastifyInstance } from "fastify";

export default async function authRoutes(server: FastifyInstance) {
  server.post("/login", async (request, reply) => {
    return { message: "Login placeholder" };
  });

  server.post("/logout", async (request, reply) => {
    return { message: "Logout placeholder" };
  });

  server.get("/me", async (request, reply) => {
    return { message: "Me placeholder" };
  });
}
