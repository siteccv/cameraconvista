import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  // Site Settings
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  return httpServer;
}
