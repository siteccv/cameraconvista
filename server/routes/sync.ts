import { Router } from "express";
import { syncMenuFromSheets, syncWinesFromSheets, syncCocktailsFromSheets, syncAllFromSheets } from "../sheets-sync";
import { requireAuth } from "./helpers";
import { storage } from "../storage";

const router = Router();

router.post("/menu", requireAuth, async (req, res) => {
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

router.post("/wines", requireAuth, async (req, res) => {
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

router.post("/cocktails", requireAuth, async (req, res) => {
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

router.post("/all", requireAuth, async (req, res) => {
  try {
    const result = await syncAllFromSheets();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error syncing all:", error);
    res.status(500).json({ success: false, error: "Failed to sync from Google Sheets" });
  }
});

router.post("/publish-menu", requireAuth, async (req, res) => {
  try {
    const items = await storage.getMenuItems();
    const snapshot = JSON.stringify(items);
    await storage.upsertSiteSetting({
      key: "published_menu_items",
      valueIt: snapshot,
      valueEn: snapshot,
    });
    console.log(`[sync] Published menu: ${items.length} items`);
    res.json({ success: true, count: items.length, publishedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error publishing menu:", error);
    res.status(500).json({ success: false, error: "Failed to publish menu" });
  }
});

router.post("/publish-wines", requireAuth, async (req, res) => {
  try {
    const items = await storage.getWines();
    const snapshot = JSON.stringify(items);
    await storage.upsertSiteSetting({
      key: "published_wines",
      valueIt: snapshot,
      valueEn: snapshot,
    });
    console.log(`[sync] Published wines: ${items.length} items`);
    res.json({ success: true, count: items.length, publishedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error publishing wines:", error);
    res.status(500).json({ success: false, error: "Failed to publish wines" });
  }
});

router.post("/publish-cocktails", requireAuth, async (req, res) => {
  try {
    const items = await storage.getCocktails();
    const snapshot = JSON.stringify(items);
    await storage.upsertSiteSetting({
      key: "published_cocktails",
      valueIt: snapshot,
      valueEn: snapshot,
    });
    console.log(`[sync] Published cocktails: ${items.length} items`);
    res.json({ success: true, count: items.length, publishedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error publishing cocktails:", error);
    res.status(500).json({ success: false, error: "Failed to publish cocktails" });
  }
});

router.get("/publish-status", requireAuth, async (req, res) => {
  try {
    const [menuSetting, winesSetting, cocktailsSetting] = await Promise.all([
      storage.getSiteSetting("published_menu_items"),
      storage.getSiteSetting("published_wines"),
      storage.getSiteSetting("published_cocktails"),
    ]);
    const parseCount = (val: string | null | undefined): number => {
      try { return JSON.parse(val || "[]").length; } catch { return 0; }
    };
    res.json({
      menu: menuSetting ? { publishedAt: menuSetting.updatedAt, count: parseCount(menuSetting.valueIt) } : null,
      wines: winesSetting ? { publishedAt: winesSetting.updatedAt, count: parseCount(winesSetting.valueIt) } : null,
      cocktails: cocktailsSetting ? { publishedAt: cocktailsSetting.updatedAt, count: parseCount(cocktailsSetting.valueIt) } : null,
    });
  } catch (error) {
    console.error("Error fetching publish status:", error);
    res.status(500).json({ error: "Failed to fetch publish status" });
  }
});

export default router;
