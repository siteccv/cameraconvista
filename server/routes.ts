import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const ADMIN_PASSWORD_KEY = "admin_password_hash";
const DEFAULT_PASSWORD = "1909";
const SESSION_COOKIE_NAME = "ccv_admin_session";
const activeSessions = new Map<string, { createdAt: number }>();

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function getAdminPasswordHash(): Promise<string> {
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

async function setAdminPassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await storage.upsertSiteSetting({
    key: ADMIN_PASSWORD_KEY,
    valueIt: hash,
    valueEn: hash,
  });
}

async function verifyPassword(password: string): Promise<boolean> {
  const hash = await getAdminPasswordHash();
  return bcrypt.compare(password, hash);
}

function isAuthenticated(req: Request): boolean {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionToken) return false;
  const session = activeSessions.get(sessionToken);
  if (!session) return false;
  const maxAge = 24 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > maxAge) {
    activeSessions.delete(sessionToken);
    return false;
  }
  return true;
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Admin Authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        const sessionToken = generateSessionToken();
        activeSessions.set(sessionToken, { createdAt: Date.now() });
        
        res.cookie(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
          path: "/",
        });
        
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionToken) {
      activeSessions.delete(sessionToken);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/admin/check-session", (req, res) => {
    res.json({ authenticated: isAuthenticated(req) });
  });

  app.post("/api/admin/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const isValid = await verifyPassword(currentPassword);
      
      if (!isValid) {
        res.status(401).json({ success: false, error: "Current password is incorrect" });
        return;
      }
      
      if (!newPassword || newPassword.length < 4) {
        res.status(400).json({ success: false, error: "New password must be at least 4 characters" });
        return;
      }
      
      await setAdminPassword(newPassword);
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ success: false, error: "Password change failed" });
    }
  });
  
  // Menu Items
  app.get("/api/menu-items", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items.filter(item => item.isAvailable));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // Wines
  app.get("/api/wines", async (req, res) => {
    try {
      const wines = await storage.getWines();
      res.json(wines.filter(wine => wine.isAvailable));
    } catch (error) {
      console.error("Error fetching wines:", error);
      res.status(500).json({ error: "Failed to fetch wines" });
    }
  });

  // Cocktails
  app.get("/api/cocktails", async (req, res) => {
    try {
      const cocktails = await storage.getCocktails();
      res.json(cocktails.filter(cocktail => cocktail.isAvailable));
    } catch (error) {
      console.error("Error fetching cocktails:", error);
      res.status(500).json({ error: "Failed to fetch cocktails" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events.filter(event => event.isVisible && !event.isDraft));
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Media
  app.get("/api/media", async (req, res) => {
    try {
      const media = await storage.getMedia();
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Site Settings (public - filtered to exclude sensitive data)
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const publicSettings = settings.filter(s => !s.key.includes("password"));
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  return httpServer;
}
