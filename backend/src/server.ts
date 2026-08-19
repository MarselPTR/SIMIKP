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
    this.basePath = process.env.STORAGE_PATH || path.resolve(process.cwd(), "storage/private");
  }

  private getSecureAbsolutePath(storagePath: string): string {
    const absolutePath = path.resolve(storagePath);
    const normalizedBase = path.resolve(this.basePath) + path.sep;

    if (!absolutePath.startsWith(normalizedBase) && absolutePath !== path.resolve(this.basePath)) {
      throw new Error("Path traversal attempt");
    }

    return absolutePath;
  }

  async uploadFile(fileStream: stream.Readable, metadata: FileMetadata): Promise<StorageResult> {
    const { year, month, activityCode, contentType, ext } = metadata;
    const dir = path.join(this.basePath, year, month, activityCode, contentType);

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

  downloadFile(storagePath: string): stream.Readable {
    const absolutePath = this.getSecureAbsolutePath(storagePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error("File tidak ditemukan");
    }

    return fs.createReadStream(absolutePath);
  }
}