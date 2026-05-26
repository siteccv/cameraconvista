import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import {
  insertSiteSettingsSchema,
  footerSettingsSchema,
  defaultFooterSettings,
} from "@shared/schema";
import {
  COLLI_BOOKING_SETTINGS_KEY,
  DEFAULT_COLLI_BOOKING_SETTINGS,
  normalizeColliBookingPhone,
  type ColliBookingSettings,
} from "@shared/colli";
import { requireAuth } from "./helpers";

const FOOTER_SETTINGS_KEY = "footer_settings";
const SITE_LINKS_KEY = "site_links";
const PUBLIC_SITE_SETTINGS_KEYS = new Set([
  FOOTER_SETTINGS_KEY,
  "menu_category_map",
  "published_menu_items",
  "published_wines",
  "published_cocktails",
]);

// ========================================
// Public Routes
// ========================================
export const publicSettingsRouter = Router();

publicSettingsRouter.get("/site-settings", async (req, res) => {
  try {
    const settings = await storage.getSiteSettings();
    const publicSettings = settings.filter((s) => PUBLIC_SITE_SETTINGS_KEYS.has(s.key));
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
    const filteredSettings = settings.filter((s) => !s.key.includes("password"));
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
// Site Links API
// ========================================
const siteLinksSchema = z.object({
  adminSiteUrl: z.string().default(""),
  publicSiteUrl: z.string().default(""),
});

const colliBookingSettingsSchema = z.object({
  phoneNumber: z.string().min(5).max(32),
});

function normalizeColliBookingSettings(input: unknown): ColliBookingSettings {
  const parsed = colliBookingSettingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid Colli booking settings");
  }

  const phoneNumber = normalizeColliBookingPhone(parsed.data.phoneNumber);
  if (!/^\+\d{8,15}$/.test(phoneNumber)) {
    throw new Error("Invalid WhatsApp phone number");
  }

  return { phoneNumber };
}

function readColliBookingSettings(value: string | null | undefined): ColliBookingSettings {
  if (!value) return DEFAULT_COLLI_BOOKING_SETTINGS;

  try {
    return normalizeColliBookingSettings(JSON.parse(value));
  } catch {
    return DEFAULT_COLLI_BOOKING_SETTINGS;
  }
}

adminSettingsRouter.get("/site-links", requireAuth, async (req, res) => {
  try {
    const setting = await storage.getSiteSetting(SITE_LINKS_KEY);
    if (setting?.valueIt) {
      const parsed = siteLinksSchema.safeParse(JSON.parse(setting.valueIt));
      if (parsed.success) {
        res.json(parsed.data);
        return;
      }
    }
    res.json({ adminSiteUrl: "", publicSiteUrl: "" });
  } catch (error) {
    console.error("Error fetching site links:", error);
    res.json({ adminSiteUrl: "", publicSiteUrl: "" });
  }
});

adminSettingsRouter.put("/site-links", requireAuth, async (req, res) => {
  try {
    const parsed = siteLinksSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const jsonValue = JSON.stringify(parsed.data);
    await storage.upsertSiteSetting({
      key: SITE_LINKS_KEY,
      valueIt: jsonValue,
      valueEn: jsonValue,
    });
    res.json({ success: true, data: parsed.data });
  } catch (error) {
    console.error("Error saving site links:", error);
    res.status(500).json({ error: "Failed to save site links" });
  }
});

// ========================================
// Colli Booking API
// ========================================
publicSettingsRouter.get("/colli-booking-settings", async (req, res) => {
  try {
    const setting = await storage.getSiteSetting(COLLI_BOOKING_SETTINGS_KEY);
    res.json(readColliBookingSettings(setting?.valueIt));
  } catch (error) {
    console.error("Error fetching Colli booking settings:", error);
    res.json(DEFAULT_COLLI_BOOKING_SETTINGS);
  }
});

adminSettingsRouter.get("/colli-booking-settings", requireAuth, async (req, res) => {
  try {
    const setting = await storage.getSiteSetting(COLLI_BOOKING_SETTINGS_KEY);
    res.json(readColliBookingSettings(setting?.valueIt));
  } catch (error) {
    console.error("Error fetching Colli booking settings:", error);
    res.json(DEFAULT_COLLI_BOOKING_SETTINGS);
  }
});

adminSettingsRouter.put("/colli-booking-settings", requireAuth, async (req, res) => {
  try {
    const settings = normalizeColliBookingSettings(req.body);
    const jsonValue = JSON.stringify(settings);
    await storage.upsertSiteSetting({
      key: COLLI_BOOKING_SETTINGS_KEY,
      valueIt: jsonValue,
      valueEn: jsonValue,
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to save Colli booking settings",
    });
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

    const apiKey = process.env.OPENAI_API_KEY;
    const model = "gpt-4o-mini";

    if (!apiKey) {
      res.status(500).json({ error: "OpenAI API key not configured. Set OPENAI_API_KEY." });
      return;
    }

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

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
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const translation = response.choices[0]?.message?.content?.trim() || "";

    if (!translation) {
      res.status(500).json({ error: "No translation received" });
      return;
    }

    res.json({ translation });
  } catch (error: any) {
    console.error("Translation error:", error?.message || error);
    const detail = error?.message || "Unknown error";
    res.status(500).json({ error: `Translation failed: ${detail}` });
  }
});
