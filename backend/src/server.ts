import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { ZodError } from "zod";

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: true, // adjust based on frontend URL
  credentials: true,
});

server.register(cookie, {
  secret: process.env.COOKIE_SECRET || "simikp-super-secret-cookie-key", // for cookies signature
  parseOptions: {}
});

server.register(multipart, {
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || "250") * 1024 * 1024),
  }
});

// Centralized error handler
server.setErrorHandler((err: unknown, request, reply) => {
  if (err instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Input validation failed",
      errors: err.flatten().fieldErrors,
    });
  }
  
  const error = err as any;
  server.log.error(error);
  
  return reply.status(error.statusCode || 500).send({
    success: false,
    code: error.code || "INTERNAL_SERVER_ERROR",
    message: error.message || "An unexpected error occurred",
  });
});

import { authRoutes } from "./modules/auth/auth.routes";
import { assignmentRoutes } from "./modules/assignments/assignments.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import activitiesRoutes from "./modules/activities/activities.routes";
import masterRoutes from "./modules/master/master.routes";
import usersRoutes from "./modules/users/users.routes";
import productionsRoutes from "./modules/productions/productions.routes";
import { reportsRoutes } from "./modules/reports/reports.routes";
import { reviewsRoutes } from "./modules/reviews/reviews.routes";
import { publicationsRoutes } from "./modules/publications/publications.routes";

// Register routes
server.register(authRoutes, { prefix: "/api/v1/auth" });
server.register(assignmentRoutes, { prefix: "/api/v1/assignments" });
server.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
server.register(activitiesRoutes, { prefix: "/api/v1/activities" });
server.register(masterRoutes, { prefix: "/api/v1/master" });
server.register(usersRoutes, { prefix: "/api/v1/users" });
server.register(productionsRoutes, { prefix: "/api/v1/productions" });
server.register(reportsRoutes, { prefix: "/api/v1/reports" });
server.register(reviewsRoutes, { prefix: "/api/v1/reviews" });
server.register(publicationsRoutes, { prefix: "/api/v1/publications" });

import path from "path";
import fastifyStatic from "@fastify/static";
import fs from "fs";

// Serve static frontend files (assuming we run from backend root, pointing to ../frontend/dist)
const frontendDistPath = path.join(process.cwd(), "../frontend/dist");

server.register(fastifyStatic, {
  root: frontendDistPath,
  prefix: "/",
  wildcard: false, // Disable wildcard so we can handle 404s manually
});

// Serve assets folder explicitly since wildcard is false
server.register(fastifyStatic, {
  root: path.join(frontendDistPath, "assets"),
  prefix: "/assets/",
  decorateReply: false, // Prevent conflict with the first registration
});

// React Router Fallback: Any request not starting with /api should return index.html
server.setNotFoundHandler((request, reply) => {
  if (request.raw.url && request.raw.url.startsWith("/api")) {
    return reply.status(404).send({ success: false, message: "API Endpoint not found" });
  }
  
  // Return index.html for client-side routing
  const stream = fs.createReadStream(path.join(frontendDistPath, "index.html"));
  reply.type("text/html").send(stream);
});

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
