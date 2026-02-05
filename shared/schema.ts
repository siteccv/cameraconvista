import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export chat models for OpenAI integration
export * from "./models/chat";

// ============================================================================
// USERS (Admin authentication)
// ============================================================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================================
// ADMIN SESSIONS (Persistent admin authentication sessions)
// ============================================================================
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions);
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

// ============================================================================
// SITE SETTINGS (Global configuration)
// ============================================================================
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  valueIt: text("value_it"),
  valueEn: text("value_en"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

// ============================================================================
// PAGES (Content pages with draft/publish)
// ============================================================================
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titleIt: text("title_it").notNull(),
  titleEn: text("title_en").notNull(),
  metaTitleIt: text("meta_title_it"),
  metaTitleEn: text("meta_title_en"),
  metaDescriptionIt: text("meta_description_it"),
  metaDescriptionEn: text("meta_description_en"),
  isVisible: boolean("is_visible").notNull().default(true),
  isDraft: boolean("is_draft").notNull().default(true),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pagesRelations = relations(pages, ({ many }) => ({
  blocks: many(pageBlocks),
}));

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// ============================================================================
// PAGE BLOCKS (Content blocks with desktop/mobile overrides)
// ============================================================================
export const pageBlocks = pgTable("page_blocks", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  blockType: text("block_type").notNull(), // hero, section, text, image, cta, etc.
  sortOrder: integer("sort_order").notNull().default(0),
  
  // Bilingual text content
  titleIt: text("title_it"),
  titleEn: text("title_en"),
  bodyIt: text("body_it"),
  bodyEn: text("body_en"),
  ctaTextIt: text("cta_text_it"),
  ctaTextEn: text("cta_text_en"),
  ctaUrl: text("cta_url"),
  
  // Media
  imageUrl: text("image_url"),
  imageAltIt: text("image_alt_it"),
  imageAltEn: text("image_alt_en"),
  
  // Desktop image transforms
  imageOffsetX: integer("image_offset_x").default(0),
  imageOffsetY: integer("image_offset_y").default(0),
  imageScaleDesktop: integer("image_scale_desktop").default(100),
  
  // Mobile image transforms (independent)
  imageOffsetXMobile: integer("image_offset_x_mobile").default(0),
  imageOffsetYMobile: integer("image_offset_y_mobile").default(0),
  imageScaleMobile: integer("image_scale_mobile").default(100),
  
  // Desktop font sizes
  titleFontSize: integer("title_font_size").default(48),
  bodyFontSize: integer("body_font_size").default(16),
  
  // Mobile font sizes (independent)
  titleFontSizeMobile: integer("title_font_size_mobile").default(32),
  bodyFontSizeMobile: integer("body_font_size_mobile").default(14),
  
  // Draft/publish
  isDraft: boolean("is_draft").notNull().default(true),
  
  // Extra data (flexible JSON for custom block types)
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const pageBlocksRelations = relations(pageBlocks, ({ one }) => ({
  page: one(pages, {
    fields: [pageBlocks.pageId],
    references: [pages.id],
  }),
}));

export const insertPageBlockSchema = createInsertSchema(pageBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPageBlock = z.infer<typeof insertPageBlockSchema>;
export type PageBlock = typeof pageBlocks.$inferSelect;

// ============================================================================
// MEDIA CATEGORIES (Folder management)
// ============================================================================
export const mediaCategories = pgTable("media_categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  labelIt: text("label_it").notNull(),
  labelEn: text("label_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMediaCategorySchema = createInsertSchema(mediaCategories).omit({
  id: true,
  createdAt: true,
});
export type InsertMediaCategory = z.infer<typeof insertMediaCategorySchema>;
export type MediaCategory = typeof mediaCategories.$inferSelect;

export const updateMediaCategorySchema = z.object({
  labelIt: z.string().optional(),
  labelEn: z.string().optional(),
  sortOrder: z.number().optional(),
});
export type UpdateMediaCategory = z.infer<typeof updateMediaCategorySchema>;

// ============================================================================
// MEDIA (Media library)
// ============================================================================
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  altIt: text("alt_it"),
  altEn: text("alt_en"),
  category: text("category"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
});
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;

export const updateMediaSchema = z.object({
  altIt: z.string().nullable().optional(),
  altEn: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});
export type UpdateMedia = z.infer<typeof updateMediaSchema>;

// ============================================================================
// EVENTS (Public events with admin management)
// ============================================================================
export const visibilityModeEnum = ["ACTIVE_ONLY", "UNTIL_DAYS_AFTER"] as const;

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  titleIt: text("title_it").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionIt: text("description_it"),
  descriptionEn: text("description_en"),
  detailsIt: text("details_it"),
  detailsEn: text("details_en"),
  posterUrl: text("poster_url"),
  posterZoom: integer("poster_zoom").default(100),
  posterOffsetX: integer("poster_offset_x").default(0),
  posterOffsetY: integer("poster_offset_y").default(0),
  startAt: timestamp("start_at"),
  active: boolean("active").notNull().default(false),
  bookingEnabled: boolean("booking_enabled").notNull().default(false),
  bookingUrl: text("booking_url").default("https://cameraconvista.resos.com/booking"),
  visibilityMode: text("visibility_mode").notNull().default("ACTIVE_ONLY"),
  visibilityDaysAfter: integer("visibility_days_after"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ============================================================================
// MENU ITEMS (Synced from Google Sheets)
// ============================================================================
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  nameIt: text("name_it").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionIt: text("description_it"),
  descriptionEn: text("description_en"),
  price: text("price"),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// ============================================================================
// WINES (Synced from Google Sheets)
// ============================================================================
export const wines = pgTable("wines", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  nameIt: text("name_it").notNull(),
  nameEn: text("name_en").notNull(),
  region: text("region"),
  year: text("year"),
  price: text("price"),
  priceGlass: text("price_glass"),
  descriptionIt: text("description_it"),
  descriptionEn: text("description_en"),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertWineSchema = createInsertSchema(wines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWine = z.infer<typeof insertWineSchema>;
export type Wine = typeof wines.$inferSelect;

// ============================================================================
// COCKTAILS (Synced from Google Sheets)
// ============================================================================
export const cocktails = pgTable("cocktails", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  nameIt: text("name_it").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionIt: text("description_it"),
  descriptionEn: text("description_en"),
  price: text("price"),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertCocktailSchema = createInsertSchema(cocktails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCocktail = z.infer<typeof insertCocktailSchema>;
export type Cocktail = typeof cocktails.$inferSelect;

// ============================================================================
// FOOTER SETTINGS (Structured JSON for footer content)
// ============================================================================
export const footerHoursEntrySchema = z.object({
  selectedDays: z.array(z.number()).default([]), // 0=Monday, 1=Tuesday, ..., 6=Sunday
  hours: z.string(),
  isClosed: z.boolean().default(false),
});

export const footerSocialLinkSchema = z.object({
  type: z.enum(["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok"]),
  url: z.string().url(),
});

export const footerSettingsSchema = z.object({
  about: z.object({
    it: z.string(),
    en: z.string(),
  }),
  contacts: z.object({
    address: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  hours: z.array(footerHoursEntrySchema),
  social: z.array(footerSocialLinkSchema),
  legalLinks: z.object({
    privacyUrl: z.string(),
    privacyLabelIt: z.string().default("Privacy Policy"),
    privacyLabelEn: z.string().default("Privacy Policy"),
    cookieUrl: z.string(),
    cookieLabelIt: z.string().default("Cookie Policy"),
    cookieLabelEn: z.string().default("Cookie Policy"),
  }),
});

export type FooterHoursEntry = z.infer<typeof footerHoursEntrySchema>;
export type FooterSocialLink = z.infer<typeof footerSocialLinkSchema>;
export type FooterSettings = z.infer<typeof footerSettingsSchema>;

// ============================================================================
// GALLERIES (Album-based gallery system)
// ============================================================================
export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  titleIt: text("title_it").notNull(),
  titleEn: text("title_en").notNull(),
  coverUrl: text("cover_url"),
  coverZoom: integer("cover_zoom").default(100),
  coverOffsetX: integer("cover_offset_x").default(0),
  coverOffsetY: integer("cover_offset_y").default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const galleriesRelations = relations(galleries, ({ many }) => ({
  images: many(galleryImages),
}));

export const insertGallerySchema = createInsertSchema(galleries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Gallery = typeof galleries.$inferSelect;

// ============================================================================
// GALLERY IMAGES (Images within albums, Instagram Story 9:16 format)
// ============================================================================
export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id").notNull().references(() => galleries.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  imageZoom: integer("image_zoom").default(100),
  imageOffsetX: integer("image_offset_x").default(0),
  imageOffsetY: integer("image_offset_y").default(0),
  altIt: text("alt_it"),
  altEn: text("alt_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  gallery: one(galleries, {
    fields: [galleryImages.galleryId],
    references: [galleries.id],
  }),
}));

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export const defaultFooterSettings: FooterSettings = {
  about: {
    it: "Uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l'innovazione nelle tecniche e la passione per l'ospitalità.",
    en: "One of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality.",
  },
  contacts: {
    address: "Via del Pratello, 42\n40122 Bologna, Italia",
    phone: "+39 051 234 5678",
    email: "info@cameraconvista.it",
  },
  hours: [
    { selectedDays: [1, 2, 3, 4, 5, 6], hours: "18:00 - 02:00", isClosed: false }, // Tue-Sun
    { selectedDays: [0], hours: "", isClosed: true }, // Monday closed
  ],
  social: [
    { type: "instagram", url: "https://instagram.com" },
    { type: "facebook", url: "https://facebook.com" },
  ],
  legalLinks: {
    privacyUrl: "/privacy",
    privacyLabelIt: "Privacy Policy",
    privacyLabelEn: "Privacy Policy",
    cookieUrl: "/cookie",
    cookieLabelIt: "Cookie Policy",
    cookieLabelEn: "Cookie Policy",
  },
};
