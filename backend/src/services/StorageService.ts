import fs from "fs";
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

export interface StorageProvider {
  uploadFile(fileStream: stream.Readable, metadata: FileMetadata): Promise<StorageResult>;
  downloadFile(storagePath: string): stream.Readable;
  deleteFile(storagePath: string): Promise<void>;
}

export class LocalPrivateStorage implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || path.resolve(process.cwd(), "storage/private");
  }

  async uploadFile(fileStream: stream.Readable, metadata: FileMetadata): Promise<StorageResult> {
    const { year, month, activityCode, contentType, ext } = metadata;
    const dir = path.join(this.basePath, year, month, activityCode, contentType);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const uniqueFilename = crypto.randomUUID() + ext;
    const filePath = path.join(dir, uniqueFilename);
    const writeStream = fs.createWriteStream(filePath);

    await pipeline(fileStream, writeStream);

    const stats = fs.statSync(filePath);

    return {
      filename: uniqueFilename,
      path: filePath,
      size: stats.size,
    };
  }

  downloadFile(storagePath: string): stream.Readable {
    // Note: storagePath from DB is absolute or relative to base
    // Always ensure it's securely resolved
    const absolutePath = path.resolve(storagePath);
    if (!absolutePath.startsWith(path.resolve(this.basePath))) {
      throw new Error("Path traversal attempt");
    }
    return fs.createReadStream(absolutePath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const absolutePath = path.resolve(storagePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }
}
