import type { Express } from "express";
import type { Server } from "http";
import { registerRoutes as mountAllRoutes } from "./routes/index";

/**
 * Main routes registration function
 * 
 * Routes are organized in modular files under server/routes/:
 * - auth.ts: Admin authentication (login, logout, sessions)
 * - pages.ts: Pages and page blocks management
 * - menu.ts: Menu items, wines, cocktails
 * - events.ts: Events management
 * - gallery.ts: Gallery albums and images
 * - media.ts: Media library, uploads, categories
 * - settings.ts: Site settings, footer, translations
 * - sync.ts: Google Sheets synchronization
 * - helpers.ts: Shared utilities (auth middleware, parsing)
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  return mountAllRoutes(httpServer, app);
}
