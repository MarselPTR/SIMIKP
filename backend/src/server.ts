import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyJwt from "@fastify/jwt";
import { ZodError } from "zod";

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: true, // adjust based on frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
});

server.register(cookie, {
  secret: process.env.COOKIE_SECRET || "simikp-super-secret-cookie-key", // for cookies signature
  parseOptions: {}
});

server.register(multipart, {
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || "4096") * 1024 * 1024),
  }
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "simikp_super_secret_key_2026",
  cookie: {
    cookieName: "simikp_session",
    signed: false,
  },
  sign: {
    expiresIn: "7d",
  }
});

server.addHook("onRequest", async (request, reply) => {
  const url = request.raw.url || "";
  if (!url.startsWith("/api/v1/") || url.startsWith("/api/v1/auth/")) return;

  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ success: false, error: "Unauthorized" });
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
import { reportsRoutes } from "./modules/reports/reports.routes";
import activitiesRoutes from "./modules/activities/activities.routes";
import masterRoutes from "./modules/master/master.routes";
import usersRoutes from "./modules/users/users.routes";
import productionsRoutes from "./modules/productions/productions.routes";
import { reviewsRoutes } from "./modules/reviews/reviews.routes";
import { publicationsRoutes } from "./modules/publications/publications.routes";
import { systemRoutes } from "./modules/system/system.routes";
import { storageRoutes } from "./modules/storage/storage.routes";

// Register routes
server.register(authRoutes, { prefix: "/api/v1/auth" });
server.register(assignmentRoutes, { prefix: "/api/v1/assignments" });
server.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
server.register(reportsRoutes, { prefix: "/api/v1/reports" });
server.register(activitiesRoutes, { prefix: "/api/v1/activities" });
server.register(masterRoutes, { prefix: "/api/v1/master" });
server.register(usersRoutes, { prefix: "/api/v1/users" });
server.register(productionsRoutes, { prefix: "/api/v1/productions" });
server.register(reviewsRoutes, { prefix: "/api/v1/reviews" });
server.register(publicationsRoutes, { prefix: "/api/v1/publications" });
server.register(systemRoutes, { prefix: "/api/v1/system" });
server.register(storageRoutes, { prefix: "/api/v1/storage" });

// Health check endpoint for cloud monitoring (Render, etc.)
server.get("/healthz", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

import path from "path";
import fastifyStatic from "@fastify/static";
import fs from "fs";

// Serve uploaded storage files (photos, videos, designs)
const uploadsDir = path.resolve(__dirname, "../storage/uploads");
const privateUsersDir = path.resolve(__dirname, "../storage/private/users");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(privateUsersDir)) {
  fs.mkdirSync(privateUsersDir, { recursive: true });
}
server.register(fastifyStatic, {
  root: uploadsDir,
  prefix: "/api/v1/storage/uploads/",
  decorateReply: false,
  setHeaders: (res: any, path) => {
    if (typeof res.setHeader === "function") {
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Accept-Ranges", "bytes");
    } else if (typeof res.header === "function") {
      res.header("Content-Disposition", "inline");
      res.header("Accept-Ranges", "bytes");
    }
  },
});

server.get("/api/v1/users/assets/:filename", async (request, reply) => {
  try {
    await request.jwtVerify();
    const { filename } = request.params as { filename: string };
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      return reply.status(400).send({ success: false, message: "Nama file tidak valid" });
    }

    const filePath = path.join(privateUsersDir, safeFilename);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ success: false, message: "Berkas tidak ditemukan" });
    }

    return reply.type("application/octet-stream").send(fs.createReadStream(filePath));
  } catch {
    return reply.status(401).send({ success: false, message: "Unauthorized" });
  }
});

// Serve static frontend files (assuming we run from backend root, pointing to ../frontend/dist)
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

if (fs.existsSync(frontendDistPath)) {
  server.register(fastifyStatic, {
    root: frontendDistPath,
    prefix: "/",
    wildcard: false, // Disable wildcard so we can handle 404s manually
  });

  const assetsPath = path.join(frontendDistPath, "assets");
  if (fs.existsSync(assetsPath)) {
    // Serve assets folder explicitly since wildcard is false
    server.register(fastifyStatic, {
      root: assetsPath,
      prefix: "/assets/",
      decorateReply: false, // Prevent conflict with the first registration
    });
  }
}

// React Router Fallback: Any request not starting with /api should return index.html
server.setNotFoundHandler((request, reply) => {
  if (request.raw.url && request.raw.url.startsWith("/api")) {
    return reply.status(404).send({ success: false, message: "API Endpoint not found" });
  }
  
  const indexPath = path.join(frontendDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    const stream = fs.createReadStream(indexPath);
    return reply.type("text/html").send(stream);
  }
  
  return reply.status(404).send({ success: false, message: "Resource not found" });
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
