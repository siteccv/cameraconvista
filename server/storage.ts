import { 
  type User, type InsertUser,
  type Page, type InsertPage,
  type PageBlock, type InsertPageBlock,
  type MenuItem, type InsertMenuItem,
  type Wine, type InsertWine,
  type Cocktail, type InsertCocktail,
  type Event, type InsertEvent,
  type Media, type InsertMedia,
  type MediaCategory, type InsertMediaCategory,
  type Gallery, type InsertGallery,
  type GalleryImage, type InsertGalleryImage,
  type SiteSettings, type InsertSiteSettings,
  type AdminSession, type InsertAdminSession,
  users,
  pages,
  pageBlocks,
  menuItems,
  wines,
  cocktails,
  events,
  media,
  mediaCategories,
  galleries,
  galleryImages,
  siteSettings,
  adminSessions,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPages(): Promise<Page[]>;
  getPage(id: number): Promise<Page | undefined>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: number): Promise<boolean>;
  
  getPageBlocks(pageId: number): Promise<PageBlock[]>;
  getPageBlock(id: number): Promise<PageBlock | undefined>;
  createPageBlock(block: InsertPageBlock): Promise<PageBlock>;
  updatePageBlock(id: number, block: Partial<InsertPageBlock>): Promise<PageBlock | undefined>;
  deletePageBlock(id: number): Promise<boolean>;
  
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  getWines(): Promise<Wine[]>;
  getWine(id: number): Promise<Wine | undefined>;
  createWine(wine: InsertWine): Promise<Wine>;
  updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined>;
  deleteWine(id: number): Promise<boolean>;
  
  getCocktails(): Promise<Cocktail[]>;
  getCocktail(id: number): Promise<Cocktail | undefined>;
  createCocktail(cocktail: InsertCocktail): Promise<Cocktail>;
  updateCocktail(id: number, cocktail: Partial<InsertCocktail>): Promise<Cocktail | undefined>;
  deleteCocktail(id: number): Promise<boolean>;
  
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  getMedia(): Promise<Media[]>;
  getMediaItem(id: number): Promise<Media | undefined>;
  createMedia(mediaItem: InsertMedia): Promise<Media>;
  updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  
  getMediaCategories(): Promise<MediaCategory[]>;
  getMediaCategory(id: number): Promise<MediaCategory | undefined>;
  createMediaCategory(category: InsertMediaCategory): Promise<MediaCategory>;
  updateMediaCategory(id: number, category: Partial<InsertMediaCategory>): Promise<MediaCategory | undefined>;
  deleteMediaCategory(id: number): Promise<boolean>;
  
  getGalleries(): Promise<Gallery[]>;
  getGallery(id: number): Promise<Gallery | undefined>;
  createGallery(gallery: InsertGallery): Promise<Gallery>;
  updateGallery(id: number, gallery: Partial<InsertGallery>): Promise<Gallery | undefined>;
  deleteGallery(id: number): Promise<boolean>;
  
  getGalleryImages(galleryId: number): Promise<GalleryImage[]>;
  getGalleryImage(id: number): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: number): Promise<boolean>;
  
  getSiteSettings(): Promise<SiteSettings[]>;
  getSiteSetting(key: string): Promise<SiteSettings | undefined>;
  upsertSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings>;
  
  getAdminSession(id: string): Promise<AdminSession | undefined>;
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  deleteAdminSession(id: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<void>;
  
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getPages(): Promise<Page[]> {
    return db.select().from(pages).orderBy(asc(pages.sortOrder));
  }

  async getPage(id: number): Promise<Page | undefined> {
    const result = await db.select().from(pages).where(eq(pages.id, id));
    return result[0];
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const result = await db.select().from(pages).where(eq(pages.slug, slug));
    return result[0];
  }

  async createPage(page: InsertPage): Promise<Page> {
    const result = await db.insert(pages).values(page).returning();
    return result[0];
  }

  async updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined> {
    const result = await db.update(pages).set({ ...page, updatedAt: new Date() }).where(eq(pages.id, id)).returning();
    return result[0];
  }

  async deletePage(id: number): Promise<boolean> {
    const result = await db.delete(pages).where(eq(pages.id, id)).returning();
    return result.length > 0;
  }

  async getPageBlocks(pageId: number): Promise<PageBlock[]> {
    return db.select().from(pageBlocks).where(eq(pageBlocks.pageId, pageId)).orderBy(asc(pageBlocks.sortOrder));
  }

  async getPageBlock(id: number): Promise<PageBlock | undefined> {
    const result = await db.select().from(pageBlocks).where(eq(pageBlocks.id, id));
    return result[0];
  }

  async createPageBlock(block: InsertPageBlock): Promise<PageBlock> {
    const result = await db.insert(pageBlocks).values(block).returning();
    return result[0];
  }

  async updatePageBlock(id: number, block: Partial<InsertPageBlock>): Promise<PageBlock | undefined> {
    const result = await db.update(pageBlocks).set({ ...block, updatedAt: new Date() }).where(eq(pageBlocks.id, id)).returning();
    return result[0];
  }

  async deletePageBlock(id: number): Promise<boolean> {
    const result = await db.delete(pageBlocks).where(eq(pageBlocks.id, id)).returning();
    return result.length > 0;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems).orderBy(asc(menuItems.sortOrder));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const result = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return result[0];
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const result = await db.insert(menuItems).values(item).returning();
    return result[0];
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const result = await db.update(menuItems).set({ ...item, updatedAt: new Date() }).where(eq(menuItems.id, id)).returning();
    return result[0];
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    return result.length > 0;
  }

  async getWines(): Promise<Wine[]> {
    return db.select().from(wines).orderBy(asc(wines.sortOrder));
  }

  async getWine(id: number): Promise<Wine | undefined> {
    const result = await db.select().from(wines).where(eq(wines.id, id));
    return result[0];
  }

  async createWine(wine: InsertWine): Promise<Wine> {
    const result = await db.insert(wines).values(wine).returning();
    return result[0];
  }

  async updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined> {
    const result = await db.update(wines).set({ ...wine, updatedAt: new Date() }).where(eq(wines.id, id)).returning();
    return result[0];
  }

  async deleteWine(id: number): Promise<boolean> {
    const result = await db.delete(wines).where(eq(wines.id, id)).returning();
    return result.length > 0;
  }

  async getCocktails(): Promise<Cocktail[]> {
    return db.select().from(cocktails).orderBy(asc(cocktails.sortOrder));
  }

  async getCocktail(id: number): Promise<Cocktail | undefined> {
    const result = await db.select().from(cocktails).where(eq(cocktails.id, id));
    return result[0];
  }

  async createCocktail(cocktail: InsertCocktail): Promise<Cocktail> {
    const result = await db.insert(cocktails).values(cocktail).returning();
    return result[0];
  }

  async updateCocktail(id: number, cocktail: Partial<InsertCocktail>): Promise<Cocktail | undefined> {
    const result = await db.update(cocktails).set({ ...cocktail, updatedAt: new Date() }).where(eq(cocktails.id, id)).returning();
    return result[0];
  }

  async deleteCocktail(id: number): Promise<boolean> {
    const result = await db.delete(cocktails).where(eq(cocktails.id, id)).returning();
    return result.length > 0;
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(asc(events.sortOrder));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set({ ...event, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async getMedia(): Promise<Media[]> {
    return db.select().from(media);
  }

  async getMediaItem(id: number): Promise<Media | undefined> {
    const result = await db.select().from(media).where(eq(media.id, id));
    return result[0];
  }

  async createMedia(mediaItem: InsertMedia): Promise<Media> {
    const result = await db.insert(media).values(mediaItem).returning();
    return result[0];
  }

  async updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media | undefined> {
    const result = await db.update(media).set(mediaItem).where(eq(media.id, id)).returning();
    return result[0];
  }

  async deleteMedia(id: number): Promise<boolean> {
    const result = await db.delete(media).where(eq(media.id, id)).returning();
    return result.length > 0;
  }

  async getMediaCategories(): Promise<MediaCategory[]> {
    return db.select().from(mediaCategories).orderBy(asc(mediaCategories.sortOrder));
  }

  async getMediaCategory(id: number): Promise<MediaCategory | undefined> {
    const result = await db.select().from(mediaCategories).where(eq(mediaCategories.id, id));
    return result[0];
  }

  async createMediaCategory(category: InsertMediaCategory): Promise<MediaCategory> {
    const result = await db.insert(mediaCategories).values(category).returning();
    return result[0];
  }

  async updateMediaCategory(id: number, category: Partial<InsertMediaCategory>): Promise<MediaCategory | undefined> {
    const result = await db.update(mediaCategories).set(category).where(eq(mediaCategories.id, id)).returning();
    return result[0];
  }

  async deleteMediaCategory(id: number): Promise<boolean> {
    const result = await db.delete(mediaCategories).where(eq(mediaCategories.id, id)).returning();
    return result.length > 0;
  }

  async getGalleries(): Promise<Gallery[]> {
    return db.select().from(galleries).orderBy(asc(galleries.sortOrder));
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    const result = await db.select().from(galleries).where(eq(galleries.id, id));
    return result[0];
  }

  async createGallery(gallery: InsertGallery): Promise<Gallery> {
    const result = await db.insert(galleries).values(gallery).returning();
    return result[0];
  }

  async updateGallery(id: number, gallery: Partial<InsertGallery>): Promise<Gallery | undefined> {
    const result = await db.update(galleries).set({ ...gallery, updatedAt: new Date() }).where(eq(galleries.id, id)).returning();
    return result[0];
  }

  async deleteGallery(id: number): Promise<boolean> {
    const result = await db.delete(galleries).where(eq(galleries.id, id)).returning();
    return result.length > 0;
  }

  async getGalleryImages(galleryId: number): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).where(eq(galleryImages.galleryId, galleryId)).orderBy(asc(galleryImages.sortOrder));
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    const result = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return result[0];
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const result = await db.insert(galleryImages).values(image).returning();
    return result[0];
  }

  async updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const result = await db.update(galleryImages).set(image).where(eq(galleryImages.id, id)).returning();
    return result[0];
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const result = await db.delete(galleryImages).where(eq(galleryImages.id, id)).returning();
    return result.length > 0;
  }

  async getSiteSettings(): Promise<SiteSettings[]> {
    return db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSettings | undefined> {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return result[0];
  }

  async upsertSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSetting(setting.key);
    if (existing) {
      const result = await db.update(siteSettings)
        .set({ valueIt: setting.valueIt, valueEn: setting.valueEn, updatedAt: new Date() })
        .where(eq(siteSettings.key, setting.key))
        .returning();
      return result[0];
    }
    const result = await db.insert(siteSettings).values(setting).returning();
    return result[0];
  }

  async getAdminSession(id: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions).where(eq(adminSessions.id, id));
    if (result[0] && new Date(result[0].expiresAt) < new Date()) {
      await this.deleteAdminSession(id);
      return undefined;
    }
    return result[0];
  }

  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const result = await db.insert(adminSessions).values(session).returning();
    return result[0];
  }

  async deleteAdminSession(id: string): Promise<boolean> {
    const result = await db.delete(adminSessions).where(eq(adminSessions.id, id)).returning();
    return result.length > 0;
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  }

  async seedInitialData(): Promise<void> {
    const existingPages = await this.getPages();
    if (existingPages.length > 0) {
      return;
    }

    const seedPages: InsertPage[] = [
      { slug: "home", titleIt: "Home", titleEn: "Home", isVisible: true, isDraft: false, sortOrder: 0 },
      { slug: "menu", titleIt: "Menu", titleEn: "Menu", isVisible: true, isDraft: false, sortOrder: 1 },
      { slug: "carta-vini", titleIt: "Carta dei Vini", titleEn: "Wine List", isVisible: true, isDraft: false, sortOrder: 2 },
      { slug: "cocktail-bar", titleIt: "Cocktail Bar", titleEn: "Cocktail Bar", isVisible: true, isDraft: false, sortOrder: 3 },
      { slug: "eventi", titleIt: "Eventi", titleEn: "Events", isVisible: true, isDraft: false, sortOrder: 4 },
      { slug: "eventi-privati", titleIt: "Eventi Privati", titleEn: "Private Events", isVisible: true, isDraft: false, sortOrder: 5 },
      { slug: "galleria", titleIt: "Galleria", titleEn: "Gallery", isVisible: true, isDraft: false, sortOrder: 6 },
      { slug: "contatti", titleIt: "Contatti", titleEn: "Contacts", isVisible: true, isDraft: false, sortOrder: 7 },
    ];

    for (const page of seedPages) {
      await this.createPage(page);
    }

    const seedMenuItems: InsertMenuItem[] = [
      { category: "Antipasti", nameIt: "Tartare di Manzo", nameEn: "Beef Tartare", descriptionIt: "Con tuorlo d'uovo, capperi e senape", descriptionEn: "With egg yolk, capers and mustard", price: "18", sortOrder: 1 },
      { category: "Antipasti", nameIt: "Burrata Pugliese", nameEn: "Apulian Burrata", descriptionIt: "Con pomodorini e basilico fresco", descriptionEn: "With cherry tomatoes and fresh basil", price: "16", sortOrder: 2 },
      { category: "Primi", nameIt: "Tagliatelle al Ragù", nameEn: "Tagliatelle with Ragù", descriptionIt: "Pasta fresca con ragù bolognese tradizionale", descriptionEn: "Fresh pasta with traditional Bolognese ragù", price: "16", sortOrder: 3 },
      { category: "Primi", nameIt: "Tortellini in Brodo", nameEn: "Tortellini in Broth", descriptionIt: "Tortellini fatti a mano in brodo di cappone", descriptionEn: "Handmade tortellini in capon broth", price: "18", sortOrder: 4 },
      { category: "Secondi", nameIt: "Filetto di Manzo", nameEn: "Beef Fillet", descriptionIt: "Con riduzione al Sangiovese", descriptionEn: "With Sangiovese reduction", price: "32", sortOrder: 5 },
      { category: "Secondi", nameIt: "Branzino al Forno", nameEn: "Baked Sea Bass", descriptionIt: "Con patate e olive taggiasche", descriptionEn: "With potatoes and Taggiasca olives", price: "28", sortOrder: 6 },
      { category: "Dolci", nameIt: "Tiramisù", nameEn: "Tiramisù", descriptionIt: "Ricetta tradizionale della casa", descriptionEn: "Traditional house recipe", price: "10", sortOrder: 7 },
      { category: "Dolci", nameIt: "Panna Cotta", nameEn: "Panna Cotta", descriptionIt: "Con coulis di frutti di bosco", descriptionEn: "With berry coulis", price: "9", sortOrder: 8 },
    ];

    for (const item of seedMenuItems) {
      await this.createMenuItem(item);
    }

    const seedWines: InsertWine[] = [
      { category: "Bollicine", nameIt: "Franciacorta Brut", nameEn: "Franciacorta Brut", region: "Lombardia", year: "NV", price: "45", sortOrder: 1 },
      { category: "Bollicine", nameIt: "Champagne Veuve Clicquot", nameEn: "Champagne Veuve Clicquot", region: "Champagne", year: "NV", price: "85", sortOrder: 2 },
      { category: "Bianchi", nameIt: "Pignoletto Classico", nameEn: "Pignoletto Classico", region: "Emilia-Romagna", year: "2022", price: "28", sortOrder: 3 },
      { category: "Bianchi", nameIt: "Verdicchio dei Castelli di Jesi", nameEn: "Verdicchio dei Castelli di Jesi", region: "Marche", year: "2021", price: "32", sortOrder: 4 },
      { category: "Rossi", nameIt: "Sangiovese di Romagna Superiore", nameEn: "Sangiovese di Romagna Superiore", region: "Emilia-Romagna", year: "2020", price: "30", sortOrder: 5 },
      { category: "Rossi", nameIt: "Brunello di Montalcino", nameEn: "Brunello di Montalcino", region: "Toscana", year: "2018", price: "95", sortOrder: 6 },
      { category: "Rossi", nameIt: "Barolo DOCG", nameEn: "Barolo DOCG", region: "Piemonte", year: "2017", price: "120", sortOrder: 7 },
    ];

    for (const wine of seedWines) {
      await this.createWine(wine);
    }

    const seedCocktails: InsertCocktail[] = [
      { category: "Signature", nameIt: "Vista Sunset", nameEn: "Vista Sunset", descriptionIt: "Aperol, prosecco, succo d'arancia, soda", descriptionEn: "Aperol, prosecco, orange juice, soda", price: "12", sortOrder: 1 },
      { category: "Signature", nameIt: "Bologna Negroni", nameEn: "Bologna Negroni", descriptionIt: "Gin, Campari, Vermouth rosso, scorza d'arancia", descriptionEn: "Gin, Campari, red Vermouth, orange peel", price: "14", sortOrder: 2 },
      { category: "Classici", nameIt: "Martini Dry", nameEn: "Dry Martini", descriptionIt: "Gin, Vermouth dry, oliva", descriptionEn: "Gin, dry Vermouth, olive", price: "12", sortOrder: 3 },
      { category: "Classici", nameIt: "Old Fashioned", nameEn: "Old Fashioned", descriptionIt: "Bourbon, zucchero, Angostura, scorza d'arancia", descriptionEn: "Bourbon, sugar, Angostura, orange peel", price: "13", sortOrder: 4 },
      { category: "Classici", nameIt: "Mojito", nameEn: "Mojito", descriptionIt: "Rum bianco, lime, menta, zucchero, soda", descriptionEn: "White rum, lime, mint, sugar, soda", price: "11", sortOrder: 5 },
      { category: "Analcolici", nameIt: "Virgin Mojito", nameEn: "Virgin Mojito", descriptionIt: "Lime, menta, zucchero, soda", descriptionEn: "Lime, mint, sugar, soda", price: "8", sortOrder: 6 },
    ];

    for (const cocktail of seedCocktails) {
      await this.createCocktail(cocktail);
    }

    const seedEvents: InsertEvent[] = [
      { titleIt: "Jazz Night", titleEn: "Jazz Night", descriptionIt: "Serata di musica jazz dal vivo con aperitivo", descriptionEn: "Live jazz music evening with aperitif", startAt: new Date("2026-02-14T19:00:00"), active: true, sortOrder: 1 },
      { titleIt: "Degustazione Vini Emiliani", titleEn: "Emilian Wine Tasting", descriptionIt: "Scopri i migliori vini della nostra regione", descriptionEn: "Discover the best wines of our region", startAt: new Date("2026-02-21T18:00:00"), active: true, sortOrder: 2 },
    ];

    for (const event of seedEvents) {
      await this.createEvent(event);
    }

    console.log("Database seeded with initial Camera con Vista data");
  }
}

import { SupabaseStorage } from './supabase-storage';

const HAS_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const HAS_DATABASE_URL = !!process.env.DATABASE_URL;

let storage: IStorage;

if (HAS_SUPABASE) {
  storage = new SupabaseStorage();
  console.log('Using Supabase as database backend');
} else if (HAS_DATABASE_URL) {
  storage = new DatabaseStorage();
  console.log('Using PostgreSQL (Drizzle) as database backend');
} else {
  throw new Error(
    'No database configured. Set either SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL.'
  );
}

export { storage };
