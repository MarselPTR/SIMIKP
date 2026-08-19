import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import crypto from "crypto";

const pipeline = promisify(stream.pipeline);

export interface FileMetadata {
  originalFilename: string;
  ext: string;
  activityCode: string;
  contentType: string;
  year: string;
  month: string;
}

export interface StorageResult {
  filename: string;
  path: string;
  size: number;
}

export class LocalPrivateStorage {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH 
      ? path.resolve(process.env.STORAGE_PATH) 
      : path.resolve(process.cwd(), "storage/private");
  }

  /**
   * Mengubah path relatif/absolut menjadi path absolut aman di dalam basePath
   */
  private getSecureAbsolutePath(storagePath: string): string {
    // Gabungkan dengan basePath jika storagePath adalah path relatif
    const absolutePath = path.isAbsolute(storagePath)
      ? path.resolve(storagePath)
      : path.resolve(this.basePath, storagePath);

    const normalizedBase = path.resolve(this.basePath);

    // Cek apakah target file benar-benar di dalam basePath
    if (!absolutePath.startsWith(normalizedBase)) {
      throw new Error("Path traversal attempt detected");
    }

    return absolutePath;
  }

  /**
   * Upload File Stream
   */
  async uploadFile(fileStream: stream.Readable, metadata: FileMetadata): Promise<StorageResult> {
    const { year, month, activityCode, contentType, ext } = metadata;
    
    // Sanitasi input agar aman jadi nama folder
    const safeActivity = activityCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeContent = contentType.replace(/[^a-zA-Z0-9_-]/g, "_");
    
    const dir = path.join(this.basePath, year, month, safeActivity, safeContent);

    await fsPromises.mkdir(dir, { recursive: true });

    const sanitizedExt = ext.startsWith(".") ? ext : `.${ext}`;
    const uniqueFilename = `${crypto.randomUUID()}${sanitizedExt}`;
    const filePath = path.join(dir, uniqueFilename);
    const writeStream = fs.createWriteStream(filePath);

    try {
      await pipeline(fileStream, writeStream);
      const stats = await fsPromises.stat(filePath);

      return {
        filename: uniqueFilename,
        path: filePath,
        size: stats.size,
      };
    } catch (error) {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Stream File untuk Download (Async Check)
   */
  async downloadFile(storagePath: string): Promise<stream.Readable> {
    const absolutePath = this.getSecureAbsolutePath(storagePath);
    
    try {
      await fsPromises.access(absolutePath, fs.constants.R_OK);
    } catch {
      throw new Error("File tidak ditemukan atau tidak memiliki akses");
    }

    return fs.createReadStream(absolutePath);
  }

  /**
   * Hapus File Fisik
   */
  async deleteFile(storagePath: string): Promise<void> {
    const absolutePath = this.getSecureAbsolutePath(storagePath);
    try {
      await fsPromises.unlink(absolutePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}