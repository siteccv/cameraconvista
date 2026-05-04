import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "../storage";

// Import routers
import authRouter from "./auth";
import pagesRouter, {
  adminPagesRouter,
  adminPageBlocksRouter,
  publishAllRouter,
  cleanupDuplicatesRouter,
} from "./pages";
import { publicMenuRouter, adminMenuRouter } from "./menu";
import { publicEventsRouter, adminEventsRouter } from "./events";
import { publicGalleryRouter, adminGalleryRouter } from "./gallery";
import {
  publicMediaRouter,
  adminMediaRouter,
  adminUploadsRouter,
  adminMediaCategoriesRouter,
} from "./media";
import { publicSettingsRouter, adminSettingsRouter } from "./settings";
import syncRouter from "./sync";
import eventRequestRouter from "./event-request";

function publicCache(maxAge: number = 60) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "production") {
      res.set("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    }
    next();
  };
}

export function mountRoutes(app: Express): void {
  // ========================================
  // URL Redirects (301)
  // ========================================
  app.get("/carta-vini", (_req, res) => res.redirect(301, "/lista-vini"));

  // ========================================
  // Public API Routes (with production caching)
  // ========================================

  // Pages
  app.use("/api/pages", publicCache(60), pagesRouter);

  // Menu, Wines, Cocktails
  app.use("/api/menu-items", publicCache(120));
  app.use("/api/wines", publicCache(120));
  app.use("/api/cocktails", publicCache(120));
  app.use("/api", publicMenuRouter);

  // Events
  app.use("/api/events", publicCache(60), publicEventsRouter);

  // Gallery
  app.use("/api/galleries", publicCache(120), publicGalleryRouter);

  // Media
  app.use("/api/media", publicCache(120), publicMediaRouter);

  // Settings
  app.use("/api/footer-settings", publicCache(300));
  app.use("/api", publicSettingsRouter);

  // ========================================
  // Admin API Routes
  // ========================================

  // Authentication
  app.use("/api/admin", authRouter);

  // Pages
  app.use("/api/admin/pages", adminPagesRouter);
  app.use("/api/admin/pages", adminPageBlocksRouter); // For GET /:pageId/blocks
  app.use("/api/admin/page-blocks", adminPageBlocksRouter); // For POST /, PATCH /:id, DELETE /:id
  app.use("/api/admin/publish-all", publishAllRouter);
  app.use("/api/admin/cleanup-duplicates", cleanupDuplicatesRouter);

  // Menu, Wines, Cocktails
  app.use("/api/admin", adminMenuRouter);

  // Events
  app.use("/api/admin/events", adminEventsRouter);

  // Gallery
  app.use("/api/admin/galleries", adminGalleryRouter);

  // Media
  app.use("/api/admin/media", adminMediaRouter);
  app.use("/api/admin/uploads", adminUploadsRouter);
  app.use("/api/admin/media-categories", adminMediaCategoriesRouter);

  // Settings
  app.use("/api/admin", adminSettingsRouter);

  // Google Sheets Sync
  app.use("/api/admin/sync", syncRouter);

  // Public Event Request (no auth required)
  app.use("/api/event-request", eventRequestRouter);

  // Health check for email configuration (diagnostics)
  app.get("/api/health/email", async (_req, res) => {
    const hasEnvKey = !!process.env.RESEND_API_KEY;
    let hasDbKey = false;
    if (!hasEnvKey) {
      const setting = await storage.getSiteSetting("resend_api_key");
      hasDbKey = !!setting?.valueIt;
    }
    const senderDomain = process.env.RESEND_SENDER_DOMAIN || "resend.dev";
    const recipientEmail = process.env.EVENT_REQUEST_EMAIL || "info@cameraconvista.it";
    res.json({
      resendConfigured: hasEnvKey || hasDbKey,
      source: hasEnvKey ? "env" : hasDbKey ? "db" : "none",
      senderDomain,
      recipientEmail,
      nodeEnv: process.env.NODE_ENV || "unknown",
    });
  });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  mountRoutes(app);
  return httpServer;
}
