import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../storage";

export const ADMIN_PASSWORD_KEY = "admin_password_hash";
export const DEFAULT_PASSWORD = "1909";
export const SESSION_COOKIE_NAME = "ccv_admin_session";
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function getAdminPasswordHash(): Promise<string> {
  const setting = await storage.getSiteSetting(ADMIN_PASSWORD_KEY);
  if (setting?.valueIt) {
    return setting.valueIt;
  }
  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
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
