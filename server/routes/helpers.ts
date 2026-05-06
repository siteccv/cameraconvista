import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../storage";

export const ADMIN_PASSWORD_KEY = "admin_password_hash";
export const LEGACY_ADMIN_PASSWORD_KEY = "admin_password";
export const ADMIN_PASSWORD_MIN_LENGTH = 10;
const DEV_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "1909";
export const SESSION_COOKIE_NAME = "ccv_admin_session";
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function isBcryptHash(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}

export async function getAdminPasswordHash(): Promise<string> {
  const setting = await storage.getSiteSetting(ADMIN_PASSWORD_KEY);
  if (isBcryptHash(setting?.valueIt)) {
    return setting.valueIt;
  }

  const legacySetting = await storage.getSiteSetting(LEGACY_ADMIN_PASSWORD_KEY);
  if (isBcryptHash(legacySetting?.valueIt)) {
    await storage.upsertSiteSetting({
      key: ADMIN_PASSWORD_KEY,
      valueIt: legacySetting.valueIt,
      valueEn: legacySetting.valueIt,
    });
    return legacySetting.valueIt;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Admin password hash not configured");
  }

  const defaultHash = await bcrypt.hash(DEV_DEFAULT_PASSWORD, 10);
  await storage.upsertSiteSetting({
    key: ADMIN_PASSWORD_KEY,
    valueIt: defaultHash,
    valueEn: defaultHash,
  });
  return defaultHash;
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await storage.upsertSiteSetting({
    key: ADMIN_PASSWORD_KEY,
    valueIt: hash,
    valueEn: hash,
  });
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = await getAdminPasswordHash();
  return bcrypt.compare(password, hash);
}

export async function isAuthenticated(req: Request): Promise<boolean> {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionToken) return false;
  const session = await storage.getAdminSession(sessionToken);
  return !!session;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!(await isAuthenticated(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function parseId(id: string | string[] | undefined): number {
  const idStr = Array.isArray(id) ? id[0] : id;
  const parsed = parseInt(idStr || "", 10);
  return isNaN(parsed) ? -1 : parsed;
}

export function validateId(id: string | string[] | undefined, res: Response): number | null {
  const parsed = parseId(id);
  if (parsed <= 0) {
    res.status(400).json({ error: "Invalid ID" });
    return null;
  }
  return parsed;
}
