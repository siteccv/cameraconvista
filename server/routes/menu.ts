import { Router } from "express";
import { storage } from "../storage";
import { insertMenuItemSchema, insertWineSchema, insertCocktailSchema } from "@shared/schema";
import { requireAuth, parseId } from "./helpers";

// ========================================
// Public Routes (serve published snapshots when available)
// ========================================
export const publicMenuRouter = Router();

async function getPublishedOrLive<T extends { isAvailable?: boolean }>(
  settingKey: string,
  liveFetcher: () => Promise<T[]>,
): Promise<T[]> {
  const setting = await storage.getSiteSetting(settingKey);
  if (setting?.valueIt) {
    try {
      const items = JSON.parse(setting.valueIt) as T[];
      return items.filter((item: any) => item.isAvailable !== false);
    } catch {
      console.error(`[menu] Failed to parse published snapshot for ${settingKey}`);
    }
  }
  const items = await liveFetcher();
  return items.filter((item: any) => item.isAvailable !== false);
}

publicMenuRouter.get("/menu-items", async (req, res) => {
  try {
    const items = await getPublishedOrLive("published_menu_items", () => storage.getMenuItems());
    res.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

publicMenuRouter.get("/wines", async (req, res) => {
  try {
    const wines = await getPublishedOrLive("published_wines", () => storage.getWines());
    res.json(wines);
  } catch (error) {
    console.error("Error fetching wines:", error);
    res.status(500).json({ error: "Failed to fetch wines" });
  }
});

publicMenuRouter.get("/cocktails", async (req, res) => {
  try {
    const cocktails = await getPublishedOrLive("published_cocktails", () => storage.getCocktails());
    res.json(cocktails);
  } catch (error) {
    console.error("Error fetching cocktails:", error);
    res.status(500).json({ error: "Failed to fetch cocktails" });
  }
});

// ========================================
// Admin Routes
// ========================================
export const adminMenuRouter = Router();

// Menu Items
adminMenuRouter.get("/menu-items", requireAuth, async (req, res) => {
  try {
    const items = await storage.getMenuItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

adminMenuRouter.post("/menu-items", requireAuth, async (req, res) => {
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

adminMenuRouter.patch("/menu-items/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertMenuItemSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const item = await storage.updateMenuItem(parseId(req.params.id), parsed.data);
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

adminMenuRouter.delete("/menu-items/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteMenuItem(parseId(req.params.id));
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

// Wines
adminMenuRouter.get("/wines", requireAuth, async (req, res) => {
  try {
    const wines = await storage.getWines();
    res.json(wines);
  } catch (error) {
    console.error("Error fetching wines:", error);
    res.status(500).json({ error: "Failed to fetch wines" });
  }
});

adminMenuRouter.post("/wines", requireAuth, async (req, res) => {
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

adminMenuRouter.patch("/wines/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertWineSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const wine = await storage.updateWine(parseId(req.params.id), parsed.data);
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

adminMenuRouter.delete("/wines/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteWine(parseId(req.params.id));
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

// Cocktails
adminMenuRouter.get("/cocktails", requireAuth, async (req, res) => {
  try {
    const cocktails = await storage.getCocktails();
    res.json(cocktails);
  } catch (error) {
    console.error("Error fetching cocktails:", error);
    res.status(500).json({ error: "Failed to fetch cocktails" });
  }
});

adminMenuRouter.post("/cocktails", requireAuth, async (req, res) => {
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

adminMenuRouter.patch("/cocktails/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertCocktailSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const cocktail = await storage.updateCocktail(parseId(req.params.id), parsed.data);
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

adminMenuRouter.delete("/cocktails/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteCocktail(parseId(req.params.id));
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
