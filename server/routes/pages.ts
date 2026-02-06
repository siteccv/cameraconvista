import { Router } from "express";
import { storage } from "../storage";
import { insertPageSchema, insertPageBlockSchema, type PageBlock } from "@shared/schema";
import { requireAuth, parseId } from "./helpers";

const SNAPSHOT_FIELDS = [
  "titleIt", "titleEn", "bodyIt", "bodyEn",
  "ctaTextIt", "ctaTextEn", "ctaUrl",
  "imageUrl", "imageAltIt", "imageAltEn",
  "imageOffsetX", "imageOffsetY", "imageScaleDesktop",
  "imageOffsetXMobile", "imageOffsetYMobile", "imageScaleMobile",
  "titleFontSize", "bodyFontSize", "titleFontSizeMobile", "bodyFontSizeMobile",
] as const;

function extractBlockSnapshot(block: PageBlock): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const field of SNAPSHOT_FIELDS) {
    snapshot[field] = block[field];
  }
  return snapshot;
}

function applyPublishedSnapshot(block: PageBlock): PageBlock {
  const snapshot = block.publishedSnapshot as Record<string, unknown> | null;
  if (!snapshot) return block;
  const merged = { ...block };
  for (const field of SNAPSHOT_FIELDS) {
    if (field in snapshot) {
      (merged as any)[field] = snapshot[field];
    }
  }
  return merged;
}

const router = Router();

// ========================================
// Public Routes
// ========================================

router.get("/", async (req, res) => {
  try {
    const pages = await storage.getPages();
    res.json(pages.filter(page => page.isVisible));
  } catch (error) {
    console.error("Error fetching pages:", error);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const page = await storage.getPageBySlug(req.params.slug);
    if (!page || !page.isVisible) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    res.json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({ error: "Failed to fetch page" });
  }
});

router.get("/:pageId/blocks", async (req, res) => {
  try {
    const pageId = parseId(req.params.pageId);
    const blocks = await storage.getPageBlocks(pageId);
    const publishedBlocks = blocks.map(applyPublishedSnapshot);
    res.json(publishedBlocks);
  } catch (error) {
    console.error("Error fetching page blocks:", error);
    res.status(500).json({ error: "Failed to fetch page blocks" });
  }
});

export default router;

// ========================================
// Admin Routes (separate router)
// ========================================
export const adminPagesRouter = Router();

adminPagesRouter.get("/", requireAuth, async (req, res) => {
  try {
    const pages = await storage.getPages();
    res.json(pages);
  } catch (error) {
    console.error("Error fetching pages:", error);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

adminPagesRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const page = await storage.getPage(parseId(req.params.id));
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

adminPagesRouter.post("/", requireAuth, async (req, res) => {
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

adminPagesRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertPageSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const updateData = { ...parsed.data, isDraft: true };
    const page = await storage.updatePage(parseId(req.params.id), updateData);
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

adminPagesRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deletePage(parseId(req.params.id));
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

adminPagesRouter.post("/:id/publish", requireAuth, async (req, res) => {
  try {
    const pageId = parseId(req.params.id);
    const page = await storage.updatePage(pageId, { isDraft: false, publishedAt: new Date() });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    const blocks = await storage.getPageBlocks(pageId);
    for (const block of blocks) {
      const snapshot = extractBlockSnapshot(block);
      await storage.updatePageBlock(block.id, { isDraft: false, publishedSnapshot: snapshot });
    }
    res.json({ success: true, page });
  } catch (error) {
    console.error("Error publishing page:", error);
    res.status(500).json({ error: "Failed to publish page" });
  }
});

adminPagesRouter.post("/:id/toggle-visibility", requireAuth, async (req, res) => {
  try {
    const pageId = parseId(req.params.id);
    const currentPage = await storage.getPage(pageId);
    if (!currentPage) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (currentPage.slug === "home") {
      res.status(400).json({ error: "Cannot hide the home page" });
      return;
    }
    const page = await storage.updatePage(pageId, { isVisible: !currentPage.isVisible });
    res.json({ success: true, page });
  } catch (error) {
    console.error("Error toggling page visibility:", error);
    res.status(500).json({ error: "Failed to toggle visibility" });
  }
});

// Admin Page Blocks
export const adminPageBlocksRouter = Router();

adminPageBlocksRouter.get("/:pageId/blocks", requireAuth, async (req, res) => {
  try {
    const blocks = await storage.getPageBlocks(parseId(req.params.pageId));
    res.json(blocks);
  } catch (error) {
    console.error("Error fetching page blocks:", error);
    res.status(500).json({ error: "Failed to fetch page blocks" });
  }
});

adminPageBlocksRouter.post("/", requireAuth, async (req, res) => {
  try {
    const parsed = insertPageBlockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const block = await storage.createPageBlock(parsed.data);
    const snapshot = extractBlockSnapshot(block);
    const updatedBlock = await storage.updatePageBlock(block.id, { publishedSnapshot: snapshot, isDraft: false });
    res.status(201).json(updatedBlock || block);
  } catch (error) {
    console.error("Error creating page block:", error);
    res.status(500).json({ error: "Failed to create page block" });
  }
});

adminPageBlocksRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const parsed = insertPageBlockSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const blockId = parseId(req.params.id);
    const updateData = { ...parsed.data, isDraft: true };
    const block = await storage.updatePageBlock(blockId, updateData);
    if (!block) {
      res.status(404).json({ error: "Page block not found" });
      return;
    }
    if (block.pageId) {
      await storage.updatePage(block.pageId, { isDraft: true });
    }
    res.json(block);
  } catch (error) {
    console.error("Error updating page block:", error);
    res.status(500).json({ error: "Failed to update page block" });
  }
});

adminPageBlocksRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deletePageBlock(parseId(req.params.id));
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

// Publish All
export const cleanupDuplicatesRouter = Router();

cleanupDuplicatesRouter.post("/", requireAuth, async (req, res) => {
  try {
    const pages = await storage.getPages();
    let totalDeleted = 0;
    for (const page of pages) {
      const blocks = await storage.getPageBlocks(page.id);
      const seen = new Map<string, number>();
      for (const block of blocks) {
        if (seen.has(block.blockType)) {
          await storage.deletePageBlock(block.id);
          totalDeleted++;
        } else {
          seen.set(block.blockType, block.id);
        }
      }
    }
    res.json({ success: true, message: `Cleaned up ${totalDeleted} duplicate blocks` });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    res.status(500).json({ error: "Failed to clean up duplicates" });
  }
});

export const publishAllRouter = Router();

publishAllRouter.post("/", requireAuth, async (req, res) => {
  try {
    const pages = await storage.getPages();
    for (const page of pages) {
      await storage.updatePage(page.id, { isDraft: false, publishedAt: new Date() });
      const blocks = await storage.getPageBlocks(page.id);
      for (const block of blocks) {
        const snapshot = extractBlockSnapshot(block);
        await storage.updatePageBlock(block.id, { isDraft: false, publishedSnapshot: snapshot });
      }
    }
    res.json({ success: true, message: "All pages published" });
  } catch (error) {
    console.error("Error publishing all pages:", error);
    res.status(500).json({ error: "Failed to publish all pages" });
  }
});
