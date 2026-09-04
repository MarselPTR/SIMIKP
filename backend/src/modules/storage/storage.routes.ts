import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pipeline } from "stream/promises";

export interface MediaFileInfo {
  url: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  isCurated?: boolean;
}

export const storageRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const uploadsDir = path.resolve(process.cwd(), "storage/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  server.post("/upload", async (request, reply) => {
    try {
      const parts = request.files();
      const uploadedFiles: MediaFileInfo[] = [];

      for await (const part of parts) {
        if (part.type === "file") {
          const ext = path.extname(part.filename) || "";
          const safeBase = path.basename(part.filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
          const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${safeBase}${ext}`;
          const targetPath = path.join(uploadsDir, uniqueName);

          await pipeline(part.file, fs.createWriteStream(targetPath));
          const stats = fs.statSync(targetPath);

          uploadedFiles.push({
            url: `/api/v1/storage/uploads/${uniqueName}`,
            filename: uniqueName,
            originalName: part.filename,
            fileSize: stats.size,
            mimeType: part.mimetype,
            isCurated: false,
          });
        }
      }

      return reply.status(200).send({
        success: true,
        files: uploadedFiles,
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        success: false,
        error: err.message || "Gagal mengunggah berkas",
      });
    }
  });
};
