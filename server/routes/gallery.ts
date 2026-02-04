import { Router } from "express";
import { storage } from "../storage";
import { insertGallerySchema, insertGalleryImageSchema } from "@shared/schema";
import { requireAuth, parseId } from "./helpers";

// ========================================
// Public Routes
// ========================================
export const publicGalleryRouter = Router();

publicGalleryRouter.get("/", async (req, res) => {
  try {
    const galleries = await storage.getGalleries();
    const visibleGalleries = galleries.filter(g => g.isVisible);
    res.json(visibleGalleries);
  } catch (error) {
    console.error("Error fetching public galleries:", error);
    res.status(500).json({ error: "Failed to fetch galleries" });
  }
});

publicGalleryRouter.get("/:id", async (req, res) => {
  try {
    const gallery = await storage.getGallery(parseId(req.params.id));
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

publicGalleryRouter.get("/:id/images", async (req, res) => {
  try {
    const gallery = await storage.getGallery(parseId(req.params.id));
    if (!gallery || !gallery.isVisible) {
      res.status(404).json({ error: "Gallery not found" });
      return;
    }
    const images = await storage.getGalleryImages(parseId(req.params.id));
    res.json(images);
  } catch (error) {
    console.error("Error fetching public gallery images:", error);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
});

// ========================================
// Admin Routes
// ========================================
export const adminGalleryRouter = Router();

adminGalleryRouter.get("/", requireAuth, async (req, res) => {
  try {
    const galleries = await storage.getGalleries();
    res.json(galleries);
  } catch (error) {
    console.error("Error fetching galleries:", error);
    res.status(500).json({ error: "Failed to fetch galleries" });
  }
});

adminGalleryRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const gallery = await storage.getGallery(parseId(req.params.id));
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

adminGalleryRouter.post("/", requireAuth, async (req, res) => {
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

adminGalleryRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertGallerySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const gallery = await storage.updateGallery(parseId(req.params.id), parsed.data);
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

adminGalleryRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteGallery(parseId(req.params.id));
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

// Gallery Images
adminGalleryRouter.get("/:galleryId/images", requireAuth, async (req, res) => {
  try {
    const images = await storage.getGalleryImages(parseId(req.params.galleryId));
    res.json(images);
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
});

adminGalleryRouter.post("/:galleryId/images", requireAuth, async (req, res) => {
  try {
    const galleryId = parseId(req.params.galleryId);
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

adminGalleryRouter.patch("/:galleryId/images/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertGalleryImageSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const image = await storage.updateGalleryImage(parseId(req.params.id), parsed.data);
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

adminGalleryRouter.delete("/:galleryId/images/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteGalleryImage(parseId(req.params.id));
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
