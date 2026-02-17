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
    fileSize: 26 * 1024 * 1024, // 26MB max (supports 25MB uploads with overhead)
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

adminMediaRouter.post("/rename-all", requireAuth, async (req, res) => {
  try {
    const allMedia = await storage.getMedia();
    const grouped: Record<string, typeof allMedia> = {};
    for (const item of allMedia) {
      const cat = item.category || "uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    let renamed = 0;
    for (const [category, items] of Object.entries(grouped)) {
      if (category === "uncategorized") continue;
      const prefix = category.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const sorted = items.sort((a, b) => a.id - b.id);
      for (let i = 0; i < sorted.length; i++) {
        const num = String(i + 1).padStart(2, "0");
        const ext = (sorted[i].filename.match(/\.[^.]+$/) || [".jpg"])[0];
        const newName = `${prefix}_${num}${ext}`;
        if (sorted[i].filename !== newName) {
          await storage.updateMedia(sorted[i].id, { filename: newName });
          renamed++;
        }
      }
    }

    res.json({ success: true, renamed });
  } catch (error) {
    console.error("Error renaming media:", error);
    res.status(500).json({ error: "Failed to rename media" });
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

adminMediaRouter.post("/:id/rotate", requireAuth, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { direction } = req.body as { direction?: "cw" | "ccw" };
    const angle = direction === "ccw" ? -90 : 90;

    const mediaItem = await storage.getMediaItem(id);
    if (!mediaItem) {
      res.status(404).json({ error: "Media not found" });
      return;
    }

    const imageResponse = await fetch(mediaItem.url);
    if (!imageResponse.ok) {
      res.status(500).json({ error: "Failed to download image" });
      return;
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const rotatedBuffer = await sharp(imageBuffer)
      .rotate(angle)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const rotatedMeta = await sharp(rotatedBuffer).metadata();

    const { supabaseAdmin } = await import("../supabase");

    const timestamp = Date.now();
    const baseName = (mediaItem.filename || "image").replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `public/${timestamp}-rot-${baseName}.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('media-public')
      .upload(storagePath, rotatedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error during rotation:", uploadError);
      res.status(500).json({ error: "Failed to upload rotated image" });
      return;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media-public')
      .getPublicUrl(storagePath);

    const newFilename = mediaItem.filename.replace(/\.[^.]+$/, '.webp');
    const updated = await storage.updateMedia(id, {
      url: urlData.publicUrl,
      size: rotatedBuffer.length,
      width: rotatedMeta.width || null,
      height: rotatedMeta.height || null,
      mimeType: "image/webp",
      filename: newFilename,
    });

    res.json(updated);
  } catch (error) {
    console.error("Error rotating image:", error);
    res.status(500).json({ error: "Failed to rotate image" });
  }
});

adminMediaRouter.post("/bulk-delete", requireAuth, async (req, res) => {
  try {
    const { ids } = req.body as { ids?: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids array is required" });
      return;
    }
    const deleted = await storage.bulkDeleteMedia(ids);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error("Error bulk deleting media:", error);
    res.status(500).json({ error: "Failed to bulk delete media" });
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

adminUploadsRouter.post("/direct", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "File too large. Maximum size is 25MB." });
        return;
      }
      res.status(400).json({ error: err.message || "Upload error" });
      return;
    }
    next();
  });
}, async (req, res) => {
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

    // Optimize images (JPEG/PNG/WebP)
    if (isImage && ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      try {
        const sharpInstance = sharp(buffer);
        const metadata = await sharpInstance.metadata();
        
        // Max resolution 1920px for better performance/storage
        const maxDimension = 1920;
        if (metadata.width && metadata.height) {
          if (metadata.width > maxDimension || metadata.height > maxDimension) {
            sharpInstance.resize(maxDimension, maxDimension, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }
        }

        // Convert all to WebP for maximum efficiency
        buffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
        finalMimeType = "image/webp";
      } catch (sharpError) {
        console.warn("Sharp processing failed, using original:", sharpError);
      }
    }

    // Generate unique filename (use .webp extension if converted)
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = finalMimeType === "image/webp"
      ? sanitizedName.replace(/\.(png|jpg|jpeg|PNG|JPG|JPEG)$/i, '.webp')
      : sanitizedName;
    const storagePath = `public/${timestamp}-${finalName}`;

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
