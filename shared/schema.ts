import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  jsonb,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS (Admin authentication)
// ============================================================================
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
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
  publishedSnapshot: jsonb("published_snapshot"),

  // Extra data (flexible JSON for custom block types)
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  endAt: timestamp("end_at"),
  active: boolean("active").notNull().default(false),
  bookingEnabled: boolean("booking_enabled").notNull().default(false),
  bookingUrl: text("booking_url").default("https://cameraconvista.resos.com/booking"),
  visibilityMode: text("visibility_mode").notNull().default("ACTIVE_ONLY"),
  visibilityDaysAfter: integer("visibility_days_after"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  vegetarian: boolean("vegetarian").notNull().default(false),
  glutenFree: boolean("gluten_free").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertCocktailSchema = createInsertSchema(cocktails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCocktail = z.infer<typeof insertCocktailSchema>;
export type Cocktail = typeof cocktails.$inferSelect;

// ============================================================================
// CCV COLLI MENU (Dedicated namespace, separate from Google Sheets CCV flows)
// ============================================================================
export const colliSections = pgTable(
  "colli_sections",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id"),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en").notNull().default(""),
    subtitleIt: text("subtitle_it"),
    subtitleEn: text("subtitle_en"),
    type: text("type"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_sections_source_id_idx").on(table.sourceId),
    index("colli_sections_sort_order_idx").on(table.sortOrder),
  ],
);

export const colliCategories = pgTable(
  "colli_categories",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id"),
    sectionId: integer("section_id")
      .notNull()
      .references(() => colliSections.id, { onDelete: "cascade" }),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_categories_source_id_idx").on(table.sourceId),
    index("colli_categories_section_id_idx").on(table.sectionId),
    index("colli_categories_sort_order_idx").on(table.sortOrder),
  ],
);

export const colliItems = pgTable(
  "colli_items",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => colliCategories.id, { onDelete: "cascade" }),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en").notNull().default(""),
    subtitleIt: text("subtitle_it"),
    subtitleEn: text("subtitle_en"),
    descriptionIt: text("description_it"),
    descriptionEn: text("description_en"),
    extraInfo: text("extra_info"),
    price: numeric("price", { precision: 10, scale: 2 }),
    vegetarian: boolean("vegetarian").notNull().default(false),
    glutenFree: boolean("gluten_free").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_items_source_id_idx").on(table.sourceId),
    index("colli_items_category_id_idx").on(table.categoryId),
    index("colli_items_sort_order_idx").on(table.sortOrder),
  ],
);

export const colliAllergens = pgTable(
  "colli_allergens",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id"),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_allergens_source_id_idx").on(table.sourceId),
    index("colli_allergens_sort_order_idx").on(table.sortOrder),
  ],
);

export const colliItemAllergens = pgTable(
  "colli_item_allergens",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => colliItems.id, { onDelete: "cascade" }),
    allergenId: integer("allergen_id")
      .notNull()
      .references(() => colliAllergens.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_item_allergens_unique_idx").on(table.itemId, table.allergenId),
    index("colli_item_allergens_item_id_idx").on(table.itemId),
    index("colli_item_allergens_allergen_id_idx").on(table.allergenId),
  ],
);

export const colliWineCategories = pgTable(
  "colli_wine_categories",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id"),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_wine_categories_source_id_idx").on(table.sourceId),
    index("colli_wine_categories_sort_order_idx").on(table.sortOrder),
  ],
);

export const colliWines = pgTable(
  "colli_wines",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id"),
    wineCategoryId: integer("wine_category_id")
      .notNull()
      .references(() => colliWineCategories.id, { onDelete: "cascade" }),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en").notNull().default(""),
    producer: text("producer"),
    origin: text("origin"),
    abv: numeric("abv", { precision: 5, scale: 2 }),
    priceGlass: numeric("price_glass", { precision: 10, scale: 2 }),
    priceBottle: numeric("price_bottle", { precision: 10, scale: 2 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("colli_wines_source_id_idx").on(table.sourceId),
    index("colli_wines_wine_category_id_idx").on(table.wineCategoryId),
    index("colli_wines_sort_order_idx").on(table.sortOrder),
  ],
);

export const colliSettings = pgTable("colli_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const colliMenuSnapshots = pgTable(
  "colli_menu_snapshots",
  {
    id: serial("id").primaryKey(),
    status: text("status").notNull().default("active"),
    snapshot: jsonb("snapshot").notNull(),
    counts: jsonb("counts"),
    sourceChecksum: text("source_checksum"),
    publishedBy: text("published_by"),
    publishedAt: timestamp("published_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("colli_menu_snapshots_status_idx").on(table.status),
    index("colli_menu_snapshots_published_at_idx").on(table.publishedAt),
  ],
);

export const colliSectionsRelations = relations(colliSections, ({ many }) => ({
  categories: many(colliCategories),
}));

export const colliCategoriesRelations = relations(colliCategories, ({ one, many }) => ({
  section: one(colliSections, {
    fields: [colliCategories.sectionId],
    references: [colliSections.id],
  }),
  items: many(colliItems),
}));

export const colliItemsRelations = relations(colliItems, ({ one, many }) => ({
  category: one(colliCategories, {
    fields: [colliItems.categoryId],
    references: [colliCategories.id],
  }),
  allergens: many(colliItemAllergens),
}));

export const colliAllergensRelations = relations(colliAllergens, ({ many }) => ({
  items: many(colliItemAllergens),
}));

export const colliItemAllergensRelations = relations(colliItemAllergens, ({ one }) => ({
  item: one(colliItems, {
    fields: [colliItemAllergens.itemId],
    references: [colliItems.id],
  }),
  allergen: one(colliAllergens, {
    fields: [colliItemAllergens.allergenId],
    references: [colliAllergens.id],
  }),
}));

export const colliWineCategoriesRelations = relations(colliWineCategories, ({ many }) => ({
  wines: many(colliWines),
}));

export const colliWinesRelations = relations(colliWines, ({ one }) => ({
  wineCategory: one(colliWineCategories, {
    fields: [colliWines.wineCategoryId],
    references: [colliWineCategories.id],
  }),
}));

export const insertColliSectionSchema = createInsertSchema(colliSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertColliSection = z.infer<typeof insertColliSectionSchema>;
export type ColliSection = typeof colliSections.$inferSelect;

export const insertColliCategorySchema = createInsertSchema(colliCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertColliCategory = z.infer<typeof insertColliCategorySchema>;
export type ColliCategory = typeof colliCategories.$inferSelect;

export const insertColliItemSchema = createInsertSchema(colliItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertColliItem = z.infer<typeof insertColliItemSchema>;
export type ColliItem = typeof colliItems.$inferSelect;

export const insertColliAllergenSchema = createInsertSchema(colliAllergens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertColliAllergen = z.infer<typeof insertColliAllergenSchema>;
export type ColliAllergen = typeof colliAllergens.$inferSelect;

export const insertColliItemAllergenSchema = createInsertSchema(colliItemAllergens).omit({
  id: true,
  createdAt: true,
});
export type InsertColliItemAllergen = z.infer<typeof insertColliItemAllergenSchema>;
export type ColliItemAllergen = typeof colliItemAllergens.$inferSelect;

export const insertColliWineCategorySchema = createInsertSchema(colliWineCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertColliWineCategory = z.infer<typeof insertColliWineCategorySchema>;
export type ColliWineCategory = typeof colliWineCategories.$inferSelect;

export const insertColliWineSchema = createInsertSchema(colliWines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertColliWine = z.infer<typeof insertColliWineSchema>;
export type ColliWine = typeof colliWines.$inferSelect;

export const insertColliSettingsSchema = createInsertSchema(colliSettings).omit({
  id: true,
  updatedAt: true,
});
export type InsertColliSettings = z.infer<typeof insertColliSettingsSchema>;
export type ColliSettings = typeof colliSettings.$inferSelect;

export const insertColliMenuSnapshotSchema = createInsertSchema(colliMenuSnapshots).omit({
  id: true,
  createdAt: true,
});
export type InsertColliMenuSnapshot = z.infer<typeof insertColliMenuSnapshotSchema>;
export type ColliMenuSnapshot = typeof colliMenuSnapshots.$inferSelect;

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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  galleryId: integer("gallery_id")
    .notNull()
    .references(() => galleries.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  imageZoom: integer("image_zoom").default(100),
  imageOffsetX: integer("image_offset_x").default(0),
  imageOffsetY: integer("image_offset_y").default(0),
  altIt: text("alt_it"),
  altEn: text("alt_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
