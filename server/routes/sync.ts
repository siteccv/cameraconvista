import { Router } from "express";
import { syncMenuFromSheets, syncWinesFromSheets, syncCocktailsFromSheets, syncAllFromSheets } from "../sheets-sync";
import { requireAuth } from "./helpers";

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

export default router;
