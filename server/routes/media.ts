import { Router } from "express";
import { storage } from "../storage";
import { insertMediaSchema, updateMediaSchema, insertMediaCategorySchema, updateMediaCategorySchema } from "@shared/schema";
import { requireAuth, parseId } from "./helpers";
import multer from "multer";
import sharp from "sharp";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
});

// ========================================
// Public Routes
// ========================================
export const publicMediaRouter = Router();

publicMediaRouter.get("/", async (req, res) => {
  try {
    const media = await storage.getMedia();
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

// ========================================
// Admin Routes
// ========================================
export const adminMediaRouter = Router();

adminMediaRouter.get("/", requireAuth, async (req, res) => {
  try {
    const media = await storage.getMedia();
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

adminMediaRouter.post("/", requireAuth, async (req, res) => {
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

adminMediaRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseId(req.params.id);
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

adminMediaRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteMedia(parseId(req.params.id));
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

// ========================================
// Upload Routes
// ========================================
export const adminUploadsRouter = Router();

adminUploadsRouter.post("/direct", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const { supabaseAdmin } = await import("../supabase");
    
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

// ========================================
// Media Categories
// ========================================
export const adminMediaCategoriesRouter = Router();

adminMediaCategoriesRouter.get("/", requireAuth, async (req, res) => {
  try {
    const categories = await storage.getMediaCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching media categories:", error);
    res.status(500).json({ error: "Failed to fetch media categories" });
  }
});

adminMediaCategoriesRouter.post("/", requireAuth, async (req, res) => {
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

adminMediaCategoriesRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseId(req.params.id);
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

adminMediaCategoriesRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteMediaCategory(parseId(req.params.id));
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
