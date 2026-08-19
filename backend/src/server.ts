import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { ZodError } from "zod";
import activitiesRoutes from "./modules/activities/activities.routes";
import assignmentsRoutes from "./modules/assignments/assignments.routes";

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: true, // adjust based on frontend URL
  credentials: true,
});

server.register(cookie, {
  secret: process.env.COOKIE_SECRET || "simikp-super-secret-cookie-key", // for cookies signature
  parseOptions: {},
});

server.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || "250") * 1024 * 1024,
  },
});

// Centralized error handler
server.setErrorHandler((error: any, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Input validation failed",
      errors: error.flatten().fieldErrors,
    });
  }

  server.log.error(error);

  return reply.status(error.statusCode || 500).send({
    success: false,
    code: error.code || "INTERNAL_SERVER_ERROR",
    message: error.message || "An unexpected error occurred",
  });
});

// Register routes
server.register(activitiesRoutes, { prefix: "/api/v1/activities" });
server.register(assignmentsRoutes, { prefix: "/api/v1/assignments" });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "127.0.0.1";
    await server.listen({ port, host });
    console.log(`Server listening at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
