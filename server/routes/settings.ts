import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertSiteSettingsSchema, footerSettingsSchema, defaultFooterSettings } from "@shared/schema";
import { requireAuth } from "./helpers";

const FOOTER_SETTINGS_KEY = "footer_settings";

// ========================================
// Public Routes
// ========================================
export const publicSettingsRouter = Router();

publicSettingsRouter.get("/site-settings", async (req, res) => {
  try {
    const settings = await storage.getSiteSettings();
    const publicSettings = settings.filter(s => !s.key.includes("password"));
    res.json(publicSettings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

publicSettingsRouter.get("/footer-settings", async (req, res) => {
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

// ========================================
// Admin Routes
// ========================================
export const adminSettingsRouter = Router();

adminSettingsRouter.get("/site-settings", requireAuth, async (req, res) => {
  try {
    const settings = await storage.getSiteSettings();
    const filteredSettings = settings.filter(s => !s.key.includes("password"));
    res.json(filteredSettings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

adminSettingsRouter.post("/site-settings", requireAuth, async (req, res) => {
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

adminSettingsRouter.get("/footer-settings", requireAuth, async (req, res) => {
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

adminSettingsRouter.put("/footer-settings", requireAuth, async (req, res) => {
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
// Translation API
// ========================================
const translateSchema = z.object({
  text: z.string().min(1, "Text is required"),
  context: z.string().optional(),
});

adminSettingsRouter.post("/translate", requireAuth, async (req, res) => {
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
