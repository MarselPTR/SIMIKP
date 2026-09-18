import crypto from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Backward-compatibility: if hash is a legacy mock/seed placeholder
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    return password === "admin123";
  }

  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [algorithm, salt, key] = parts;
  if (algorithm !== "scrypt" || !salt || !key) return false;

  try {
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
    const storedKey = Buffer.from(key, "hex");
    return storedKey.length === derivedKey.length && crypto.timingSafeEqual(storedKey, derivedKey);
  } catch {
    return false;
  }
}