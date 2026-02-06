import type { Express } from "express";
import type { Server } from "http";

// Import routers
import authRouter from "./auth";
import pagesRouter, { adminPagesRouter, adminPageBlocksRouter, publishAllRouter } from "./pages";
import { publicMenuRouter, adminMenuRouter } from "./menu";
import { publicEventsRouter, adminEventsRouter } from "./events";
import { publicGalleryRouter, adminGalleryRouter } from "./gallery";
import { publicMediaRouter, adminMediaRouter, adminUploadsRouter, adminMediaCategoriesRouter } from "./media";
import { publicSettingsRouter, adminSettingsRouter } from "./settings";
import syncRouter from "./sync";

export function mountRoutes(app: Express): void {
  // ========================================
  // URL Redirects (301)
  // ========================================
  app.get("/carta-vini", (_req, res) => res.redirect(301, "/lista-vini"));

  // ========================================
  // Public API Routes
  // ========================================
  
  // Pages
  app.use("/api/pages", pagesRouter);
  
  // Menu, Wines, Cocktails
  app.use("/api", publicMenuRouter);
  
  // Events
  app.use("/api/events", publicEventsRouter);
  
  // Gallery
  app.use("/api/galleries", publicGalleryRouter);
  
  // Media
  app.use("/api/media", publicMediaRouter);
  
  // Settings
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
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  mountRoutes(app);
  return httpServer;
}
