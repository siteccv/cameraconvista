import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { syncMenuFromSheets, syncWinesFromSheets, syncCocktailsFromSheets, syncAllFromSheets } from "./sheets-sync";
import {
  insertPageSchema,
  insertPageBlockSchema,
  insertMenuItemSchema,
  insertWineSchema,
  insertCocktailSchema,
  insertEventSchema,
  insertMediaSchema,
  updateMediaSchema,
  insertMediaCategorySchema,
  updateMediaCategorySchema,
  insertGallerySchema,
  insertGalleryImageSchema,
  insertSiteSettingsSchema,
  footerSettingsSchema,
  defaultFooterSettings,
  type FooterSettings,
} from "@shared/schema";

const ADMIN_PASSWORD_KEY = "admin_password_hash";
const DEFAULT_PASSWORD = "1909";
const SESSION_COOKIE_NAME = "ccv_admin_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

async function isAuthenticated(req: Request): Promise<boolean> {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionToken) return false;
  const session = await storage.getAdminSession(sessionToken);
  return !!session;
}

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!(await isAuthenticated(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ========================================
  // Admin Authentication
  // ========================================
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
        await storage.createAdminSession({ id: sessionToken, expiresAt });
        
        res.cookie(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_MAX_AGE_MS,
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

  app.post("/api/admin/logout", async (req, res) => {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionToken) {
      await storage.deleteAdminSession(sessionToken);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/admin/check-session", async (req, res) => {
    res.json({ authenticated: await isAuthenticated(req) });
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
  
  // ========================================
  // Public API Routes
  // ========================================
  
  // Menu Items (public - filtered for availability)
  app.get("/api/menu-items", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items.filter(item => item.isAvailable));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // Wines (public - filtered for availability)
  app.get("/api/wines", async (req, res) => {
    try {
      const wines = await storage.getWines();
      res.json(wines.filter(wine => wine.isAvailable));
    } catch (error) {
      console.error("Error fetching wines:", error);
      res.status(500).json({ error: "Failed to fetch wines" });
    }
  });

  // Cocktails (public - filtered for availability)
  app.get("/api/cocktails", async (req, res) => {
    try {
      const cocktails = await storage.getCocktails();
      res.json(cocktails.filter(cocktail => cocktail.isAvailable));
    } catch (error) {
      console.error("Error fetching cocktails:", error);
      res.status(500).json({ error: "Failed to fetch cocktails" });
    }
  });

  // Events (public - filtered for active and visible)
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      const now = new Date();
      
      const visibleEvents = events.filter(event => {
        if (!event.active || !event.posterUrl) return false;
        
        if (event.visibilityMode === "ACTIVE_ONLY") {
          return true;
        }
        
        if (event.visibilityMode === "UNTIL_DAYS_AFTER" && event.startAt && event.visibilityDaysAfter) {
          const hideAfterDate = new Date(event.startAt);
          hideAfterDate.setDate(hideAfterDate.getDate() + event.visibilityDaysAfter);
          return now <= hideAfterDate;
        }
        
        return true;
      });
      
      visibleEvents.sort((a, b) => a.sortOrder - b.sortOrder);
      res.json(visibleEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Single event (public)
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event || !event.active) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Media (public)
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

  // Pages (public - filtered for visible and published)
  app.get("/api/pages", async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages.filter(page => page.isVisible && !page.isDraft));
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await storage.getPageBySlug(req.params.slug);
      if (!page || page.isDraft || !page.isVisible) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  // Page Blocks (public - filtered for published)
  app.get("/api/pages/:pageId/blocks", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const blocks = await storage.getPageBlocks(pageId);
      res.json(blocks.filter(block => !block.isDraft));
    } catch (error) {
      console.error("Error fetching page blocks:", error);
      res.status(500).json({ error: "Failed to fetch page blocks" });
    }
  });

  // ========================================
  // Admin API Routes (Protected)
  // ========================================

  // Admin Pages
  app.get("/api/admin/pages", requireAuth, async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  app.get("/api/admin/pages/:id", requireAuth, async (req, res) => {
    try {
      const page = await storage.getPage(parseInt(req.params.id));
      if (!page) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  app.post("/api/admin/pages", requireAuth, async (req, res) => {
    try {
      const parsed = insertPageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const page = await storage.createPage(parsed.data);
      res.status(201).json(page);
    } catch (error) {
      console.error("Error creating page:", error);
      res.status(500).json({ error: "Failed to create page" });
    }
  });

  app.patch("/api/admin/pages/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertPageSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const page = await storage.updatePage(parseInt(req.params.id), parsed.data);
      if (!page) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      res.json(page);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  app.delete("/api/admin/pages/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deletePage(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "Failed to delete page" });
    }
  });

  app.post("/api/admin/pages/:id/publish", requireAuth, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      const page = await storage.updatePage(pageId, { isDraft: false, publishedAt: new Date() });
      if (!page) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      const blocks = await storage.getPageBlocks(pageId);
      for (const block of blocks) {
        await storage.updatePageBlock(block.id, { isDraft: false });
      }
      res.json({ success: true, page });
    } catch (error) {
      console.error("Error publishing page:", error);
      res.status(500).json({ error: "Failed to publish page" });
    }
  });

  app.post("/api/admin/pages/:id/toggle-visibility", requireAuth, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      const currentPage = await storage.getPage(pageId);
      if (!currentPage) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      const page = await storage.updatePage(pageId, { isVisible: !currentPage.isVisible });
      res.json({ success: true, page });
    } catch (error) {
      console.error("Error toggling page visibility:", error);
      res.status(500).json({ error: "Failed to toggle visibility" });
    }
  });

  app.post("/api/admin/publish-all", requireAuth, async (req, res) => {
    try {
      const pages = await storage.getPages();
      for (const page of pages) {
        await storage.updatePage(page.id, { isDraft: false, publishedAt: new Date() });
        const blocks = await storage.getPageBlocks(page.id);
        for (const block of blocks) {
          await storage.updatePageBlock(block.id, { isDraft: false });
        }
      }
      res.json({ success: true, message: "All pages published" });
    } catch (error) {
      console.error("Error publishing all pages:", error);
      res.status(500).json({ error: "Failed to publish all pages" });
    }
  });

  // Admin Page Blocks
  app.get("/api/admin/pages/:pageId/blocks", requireAuth, async (req, res) => {
    try {
      const blocks = await storage.getPageBlocks(parseInt(req.params.pageId));
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching page blocks:", error);
      res.status(500).json({ error: "Failed to fetch page blocks" });
    }
  });

  app.post("/api/admin/page-blocks", requireAuth, async (req, res) => {
    try {
      const parsed = insertPageBlockSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const block = await storage.createPageBlock(parsed.data);
      res.status(201).json(block);
    } catch (error) {
      console.error("Error creating page block:", error);
      res.status(500).json({ error: "Failed to create page block" });
    }
  });

  app.patch("/api/admin/page-blocks/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertPageBlockSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const block = await storage.updatePageBlock(parseInt(req.params.id), parsed.data);
      if (!block) {
        res.status(404).json({ error: "Page block not found" });
        return;
      }
      res.json(block);
    } catch (error) {
      console.error("Error updating page block:", error);
      res.status(500).json({ error: "Failed to update page block" });
    }
  });

  app.delete("/api/admin/page-blocks/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deletePageBlock(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Page block not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting page block:", error);
      res.status(500).json({ error: "Failed to delete page block" });
    }
  });

  // Admin Menu Items
  app.get("/api/admin/menu-items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.post("/api/admin/menu-items", requireAuth, async (req, res) => {
    try {
      const parsed = insertMenuItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const item = await storage.createMenuItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.patch("/api/admin/menu-items/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertMenuItemSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const item = await storage.updateMenuItem(parseInt(req.params.id), parsed.data);
      if (!item) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/admin/menu-items/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteMenuItem(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Admin Wines
  app.get("/api/admin/wines", requireAuth, async (req, res) => {
    try {
      const wines = await storage.getWines();
      res.json(wines);
    } catch (error) {
      console.error("Error fetching wines:", error);
      res.status(500).json({ error: "Failed to fetch wines" });
    }
  });

  app.post("/api/admin/wines", requireAuth, async (req, res) => {
    try {
      const parsed = insertWineSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const wine = await storage.createWine(parsed.data);
      res.status(201).json(wine);
    } catch (error) {
      console.error("Error creating wine:", error);
      res.status(500).json({ error: "Failed to create wine" });
    }
  });

  app.patch("/api/admin/wines/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertWineSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const wine = await storage.updateWine(parseInt(req.params.id), parsed.data);
      if (!wine) {
        res.status(404).json({ error: "Wine not found" });
        return;
      }
      res.json(wine);
    } catch (error) {
      console.error("Error updating wine:", error);
      res.status(500).json({ error: "Failed to update wine" });
    }
  });

  app.delete("/api/admin/wines/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteWine(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Wine not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wine:", error);
      res.status(500).json({ error: "Failed to delete wine" });
    }
  });

  // Admin Cocktails
  app.get("/api/admin/cocktails", requireAuth, async (req, res) => {
    try {
      const cocktails = await storage.getCocktails();
      res.json(cocktails);
    } catch (error) {
      console.error("Error fetching cocktails:", error);
      res.status(500).json({ error: "Failed to fetch cocktails" });
    }
  });

  app.post("/api/admin/cocktails", requireAuth, async (req, res) => {
    try {
      const parsed = insertCocktailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const cocktail = await storage.createCocktail(parsed.data);
      res.status(201).json(cocktail);
    } catch (error) {
      console.error("Error creating cocktail:", error);
      res.status(500).json({ error: "Failed to create cocktail" });
    }
  });

  app.patch("/api/admin/cocktails/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertCocktailSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const cocktail = await storage.updateCocktail(parseInt(req.params.id), parsed.data);
      if (!cocktail) {
        res.status(404).json({ error: "Cocktail not found" });
        return;
      }
      res.json(cocktail);
    } catch (error) {
      console.error("Error updating cocktail:", error);
      res.status(500).json({ error: "Failed to update cocktail" });
    }
  });

  app.delete("/api/admin/cocktails/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteCocktail(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Cocktail not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cocktail:", error);
      res.status(500).json({ error: "Failed to delete cocktail" });
    }
  });

  // Admin Events
  app.get("/api/admin/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/admin/events", requireAuth, async (req, res) => {
    try {
      const parsed = insertEventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const event = await storage.createEvent(parsed.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/admin/events/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertEventSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const event = await storage.updateEvent(parseInt(req.params.id), parsed.data);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ========================================
  // Admin Galleries (Album-based gallery system)
  // ========================================
  app.get("/api/admin/galleries", requireAuth, async (req, res) => {
    try {
      const galleries = await storage.getGalleries();
      res.json(galleries);
    } catch (error) {
      console.error("Error fetching galleries:", error);
      res.status(500).json({ error: "Failed to fetch galleries" });
    }
  });

  app.get("/api/admin/galleries/:id", requireAuth, async (req, res) => {
    try {
      const gallery = await storage.getGallery(parseInt(req.params.id));
      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }
      res.json(gallery);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  app.post("/api/admin/galleries", requireAuth, async (req, res) => {
    try {
      const parsed = insertGallerySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const gallery = await storage.createGallery(parsed.data);
      res.status(201).json(gallery);
    } catch (error) {
      console.error("Error creating gallery:", error);
      res.status(500).json({ error: "Failed to create gallery" });
    }
  });

  app.patch("/api/admin/galleries/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertGallerySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const gallery = await storage.updateGallery(parseInt(req.params.id), parsed.data);
      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }
      res.json(gallery);
    } catch (error) {
      console.error("Error updating gallery:", error);
      res.status(500).json({ error: "Failed to update gallery" });
    }
  });

  app.delete("/api/admin/galleries/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteGallery(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gallery:", error);
      res.status(500).json({ error: "Failed to delete gallery" });
    }
  });

  // Gallery Images (within albums)
  app.get("/api/admin/galleries/:galleryId/images", requireAuth, async (req, res) => {
    try {
      const images = await storage.getGalleryImages(parseInt(req.params.galleryId));
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  app.post("/api/admin/galleries/:galleryId/images", requireAuth, async (req, res) => {
    try {
      const galleryId = parseInt(req.params.galleryId);
      const parsed = insertGalleryImageSchema.safeParse({ ...req.body, galleryId });
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const image = await storage.createGalleryImage(parsed.data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error creating gallery image:", error);
      res.status(500).json({ error: "Failed to create gallery image" });
    }
  });

  app.patch("/api/admin/galleries/:galleryId/images/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertGalleryImageSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const image = await storage.updateGalleryImage(parseInt(req.params.id), parsed.data);
      if (!image) {
        res.status(404).json({ error: "Gallery image not found" });
        return;
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ error: "Failed to update gallery image" });
    }
  });

  app.delete("/api/admin/galleries/:galleryId/images/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteGalleryImage(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Gallery image not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ error: "Failed to delete gallery image" });
    }
  });

  // ========================================
  // Public Galleries API
  // ========================================
  app.get("/api/galleries", async (req, res) => {
    try {
      const galleries = await storage.getGalleries();
      const visibleGalleries = galleries.filter(g => g.isVisible);
      res.json(visibleGalleries);
    } catch (error) {
      console.error("Error fetching public galleries:", error);
      res.status(500).json({ error: "Failed to fetch galleries" });
    }
  });

  app.get("/api/galleries/:id", async (req, res) => {
    try {
      const gallery = await storage.getGallery(parseInt(req.params.id));
      if (!gallery || !gallery.isVisible) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }
      res.json(gallery);
    } catch (error) {
      console.error("Error fetching public gallery:", error);
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  app.get("/api/galleries/:id/images", async (req, res) => {
    try {
      const gallery = await storage.getGallery(parseInt(req.params.id));
      if (!gallery || !gallery.isVisible) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }
      const images = await storage.getGalleryImages(parseInt(req.params.id));
      res.json(images);
    } catch (error) {
      console.error("Error fetching public gallery images:", error);
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  // Admin Media
  app.get("/api/admin/media", requireAuth, async (req, res) => {
    try {
      const media = await storage.getMedia();
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  app.post("/api/admin/media", requireAuth, async (req, res) => {
    try {
      const parsed = insertMediaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const media = await storage.createMedia(parsed.data);
      res.status(201).json(media);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ error: "Failed to create media" });
    }
  });

  app.put("/api/admin/media/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = updateMediaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const updated = await storage.updateMedia(id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: "Media not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating media:", error);
      res.status(500).json({ error: "Failed to update media" });
    }
  });

  app.delete("/api/admin/media/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteMedia(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Media not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // Configure multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB max
    },
  });

  // Direct upload to Supabase Storage with image optimization
  app.post("/api/admin/uploads/direct", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const { supabaseAdmin } = await import("./supabase");
      
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const file = req.file;
      let buffer = file.buffer;
      let finalMimeType = file.mimetype;
      const isImage = file.mimetype.startsWith("image/");

      // Optimize images (JPEG/PNG/WebP) while preserving quality
      if (isImage && ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
        try {
          const sharpInstance = sharp(buffer);
          const metadata = await sharpInstance.metadata();
          
          // Only resize if larger than 2000px on any side
          const maxDimension = 2000;
          if (metadata.width && metadata.height) {
            if (metadata.width > maxDimension || metadata.height > maxDimension) {
              sharpInstance.resize(maxDimension, maxDimension, {
                fit: "inside",
                withoutEnlargement: true,
              });
            }
          }

          // High quality compression preserving original format
          if (file.mimetype === "image/jpeg") {
            buffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
          } else if (file.mimetype === "image/png") {
            buffer = await sharpInstance.png({ compressionLevel: 6 }).toBuffer();
          } else if (file.mimetype === "image/webp") {
            buffer = await sharpInstance.webp({ quality: 85 }).toBuffer();
          }
        } catch (sharpError) {
          console.warn("Sharp processing failed, using original:", sharpError);
          // Continue with original buffer if Sharp fails
        }
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `public/${timestamp}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('media-public')
        .upload(storagePath, buffer, {
          contentType: finalMimeType,
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        res.status(500).json({ error: "Failed to upload file to storage" });
        return;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('media-public')
        .getPublicUrl(storagePath);

      res.json({
        url: urlData.publicUrl,
        filename: file.originalname,
        size: buffer.length,
        mimeType: finalMimeType,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Keep legacy endpoint for compatibility (redirects to Supabase)
  app.post("/api/admin/uploads/request-url", requireAuth, async (req, res) => {
    // This endpoint now returns instructions to use direct upload
    res.status(400).json({ 
      error: "This endpoint is deprecated. Use /api/admin/uploads/direct with multipart/form-data instead.",
      useEndpoint: "/api/admin/uploads/direct"
    });
  });

  // Admin Media Categories
  app.get("/api/admin/media-categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getMediaCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching media categories:", error);
      res.status(500).json({ error: "Failed to fetch media categories" });
    }
  });

  app.post("/api/admin/media-categories", requireAuth, async (req, res) => {
    try {
      const parsed = insertMediaCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const category = await storage.createMediaCategory(parsed.data);
      res.json(category);
    } catch (error) {
      console.error("Error creating media category:", error);
      res.status(500).json({ error: "Failed to create media category" });
    }
  });

  app.put("/api/admin/media-categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = updateMediaCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const updated = await storage.updateMediaCategory(id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating media category:", error);
      res.status(500).json({ error: "Failed to update media category" });
    }
  });

  app.delete("/api/admin/media-categories/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteMediaCategory(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media category:", error);
      res.status(500).json({ error: "Failed to delete media category" });
    }
  });

  // ========================================
  // Google Sheets Sync Routes (Admin Protected)
  // ========================================
  
  app.post("/api/admin/sync/menu", requireAuth, async (req, res) => {
    try {
      const result = await syncMenuFromSheets();
      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }
      res.json({ success: true, count: result.count });
    } catch (error) {
      console.error("Error syncing menu:", error);
      res.status(500).json({ success: false, error: "Failed to sync menu from Google Sheets" });
    }
  });

  app.post("/api/admin/sync/wines", requireAuth, async (req, res) => {
    try {
      const result = await syncWinesFromSheets();
      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }
      res.json({ success: true, count: result.count });
    } catch (error) {
      console.error("Error syncing wines:", error);
      res.status(500).json({ success: false, error: "Failed to sync wines from Google Sheets" });
    }
  });

  app.post("/api/admin/sync/cocktails", requireAuth, async (req, res) => {
    try {
      const result = await syncCocktailsFromSheets();
      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }
      res.json({ success: true, count: result.count });
    } catch (error) {
      console.error("Error syncing cocktails:", error);
      res.status(500).json({ success: false, error: "Failed to sync cocktails from Google Sheets" });
    }
  });

  app.post("/api/admin/sync/all", requireAuth, async (req, res) => {
    try {
      const result = await syncAllFromSheets();
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error syncing all:", error);
      res.status(500).json({ success: false, error: "Failed to sync from Google Sheets" });
    }
  });

  // Admin Site Settings
  app.get("/api/admin/site-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const filteredSettings = settings.filter(s => !s.key.includes("password"));
      res.json(filteredSettings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.post("/api/admin/site-settings", requireAuth, async (req, res) => {
    try {
      const parsed = insertSiteSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      if (parsed.data.key?.includes("password")) {
        res.status(400).json({ error: "Cannot set password via this endpoint" });
        return;
      }
      const setting = await storage.upsertSiteSetting(parsed.data);
      res.json(setting);
    } catch (error) {
      console.error("Error saving site setting:", error);
      res.status(500).json({ error: "Failed to save site setting" });
    }
  });

  // ========================================
  // Footer Settings (stored as JSON in site_settings)
  // ========================================
  const FOOTER_SETTINGS_KEY = "footer_settings";

  // Public: Get footer settings
  app.get("/api/footer-settings", async (req, res) => {
    try {
      const setting = await storage.getSiteSetting(FOOTER_SETTINGS_KEY);
      if (setting?.valueIt) {
        const parsed = footerSettingsSchema.safeParse(JSON.parse(setting.valueIt));
        if (parsed.success) {
          res.json(parsed.data);
          return;
        }
      }
      res.json(defaultFooterSettings);
    } catch (error) {
      console.error("Error fetching footer settings:", error);
      res.json(defaultFooterSettings);
    }
  });

  // Admin: Get footer settings
  app.get("/api/admin/footer-settings", requireAuth, async (req, res) => {
    try {
      const setting = await storage.getSiteSetting(FOOTER_SETTINGS_KEY);
      if (setting?.valueIt) {
        const parsed = footerSettingsSchema.safeParse(JSON.parse(setting.valueIt));
        if (parsed.success) {
          res.json(parsed.data);
          return;
        }
      }
      res.json(defaultFooterSettings);
    } catch (error) {
      console.error("Error fetching footer settings:", error);
      res.json(defaultFooterSettings);
    }
  });

  // Admin: Update footer settings
  app.put("/api/admin/footer-settings", requireAuth, async (req, res) => {
    try {
      const parsed = footerSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }
      const jsonValue = JSON.stringify(parsed.data);
      await storage.upsertSiteSetting({
        key: FOOTER_SETTINGS_KEY,
        valueIt: jsonValue,
        valueEn: jsonValue,
      });
      res.json({ success: true, data: parsed.data });
    } catch (error) {
      console.error("Error saving footer settings:", error);
      res.status(500).json({ error: "Failed to save footer settings" });
    }
  });

  // ========================================
  // Translation API (IT → EN) using OpenAI
  // ========================================
  const translateSchema = z.object({
    text: z.string().min(1, "Text is required"),
    context: z.string().optional(),
  });

  app.post("/api/admin/translate", requireAuth, async (req, res) => {
    try {
      const parsed = translateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        return;
      }

      const { text, context } = parsed.data;
      
      const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
      const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
      
      if (!apiKey) {
        res.status(500).json({ error: "OpenAI API key not configured" });
        return;
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey, baseURL });

      const systemPrompt = `You are a professional translator specializing in hospitality and fine dining.

Your task is to translate Italian text to English with the following style:
- Elegant and refined international English
- Concise and sophisticated phrasing
- Optimized for restaurants, bars, and hospitality industry
- Maintain the same tone and formality as the original
- Preserve any proper nouns, brand names, or Italian terms that should remain untranslated (like dish names)

${context ? `Context: ${context}` : ""}

Respond with ONLY the English translation, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const translation = response.choices[0]?.message?.content?.trim() || "";
      
      if (!translation) {
        res.status(500).json({ error: "No translation received" });
        return;
      }

      res.json({ translation });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  return httpServer;
}
