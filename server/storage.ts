import { 
  type User, type InsertUser,
  type MenuItem, type InsertMenuItem,
  type Wine, type InsertWine,
  type Cocktail, type InsertCocktail,
  type Event, type InsertEvent,
  type Media, type InsertMedia,
  type SiteSettings, type InsertSiteSettings,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  createMedia(media: InsertMedia): Promise<Media>;
  deleteMedia(id: number): Promise<boolean>;
  
  getSiteSettings(): Promise<SiteSettings[]>;
  getSiteSetting(key: string): Promise<SiteSettings | undefined>;
  upsertSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private menuItems: Map<number, MenuItem>;
  private wines: Map<number, Wine>;
  private cocktails: Map<number, Cocktail>;
  private events: Map<number, Event>;
  private media: Map<number, Media>;
  private siteSettings: Map<string, SiteSettings>;
  private nextId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.wines = new Map();
    this.cocktails = new Map();
    this.events = new Map();
    this.media = new Map();
    this.siteSettings = new Map();
    this.nextId = { menuItems: 1, wines: 1, cocktails: 1, events: 1, media: 1, siteSettings: 1 };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: "admin",
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = this.nextId.menuItems++;
    const now = new Date();
    const menuItem: MenuItem = { 
      ...item, 
      id, 
      isAvailable: item.isAvailable ?? true,
      sortOrder: item.sortOrder ?? 0,
      sheetRowIndex: item.sheetRowIndex ?? null,
      descriptionIt: item.descriptionIt ?? null,
      descriptionEn: item.descriptionEn ?? null,
      price: item.price ?? null,
      createdAt: now,
      updatedAt: now 
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existing = this.menuItems.get(id);
    if (!existing) return undefined;
    const updated: MenuItem = { ...existing, ...item, updatedAt: new Date() };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  async getWines(): Promise<Wine[]> {
    return Array.from(this.wines.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getWine(id: number): Promise<Wine | undefined> {
    return this.wines.get(id);
  }

  async createWine(wine: InsertWine): Promise<Wine> {
    const id = this.nextId.wines++;
    const now = new Date();
    const wineItem: Wine = { 
      ...wine, 
      id,
      isAvailable: wine.isAvailable ?? true,
      sortOrder: wine.sortOrder ?? 0,
      sheetRowIndex: wine.sheetRowIndex ?? null,
      region: wine.region ?? null,
      year: wine.year ?? null,
      price: wine.price ?? null,
      descriptionIt: wine.descriptionIt ?? null,
      descriptionEn: wine.descriptionEn ?? null,
      createdAt: now,
      updatedAt: now 
    };
    this.wines.set(id, wineItem);
    return wineItem;
  }

  async updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined> {
    const existing = this.wines.get(id);
    if (!existing) return undefined;
    const updated: Wine = { ...existing, ...wine, updatedAt: new Date() };
    this.wines.set(id, updated);
    return updated;
  }

  async deleteWine(id: number): Promise<boolean> {
    return this.wines.delete(id);
  }

  async getCocktails(): Promise<Cocktail[]> {
    return Array.from(this.cocktails.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getCocktail(id: number): Promise<Cocktail | undefined> {
    return this.cocktails.get(id);
  }

  async createCocktail(cocktail: InsertCocktail): Promise<Cocktail> {
    const id = this.nextId.cocktails++;
    const now = new Date();
    const cocktailItem: Cocktail = { 
      ...cocktail, 
      id,
      isAvailable: cocktail.isAvailable ?? true,
      sortOrder: cocktail.sortOrder ?? 0,
      sheetRowIndex: cocktail.sheetRowIndex ?? null,
      descriptionIt: cocktail.descriptionIt ?? null,
      descriptionEn: cocktail.descriptionEn ?? null,
      price: cocktail.price ?? null,
      createdAt: now,
      updatedAt: now 
    };
    this.cocktails.set(id, cocktailItem);
    return cocktailItem;
  }

  async updateCocktail(id: number, cocktail: Partial<InsertCocktail>): Promise<Cocktail | undefined> {
    const existing = this.cocktails.get(id);
    if (!existing) return undefined;
    const updated: Cocktail = { ...existing, ...cocktail, updatedAt: new Date() };
    this.cocktails.set(id, updated);
    return updated;
  }

  async deleteCocktail(id: number): Promise<boolean> {
    return this.cocktails.delete(id);
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.nextId.events++;
    const now = new Date();
    const eventItem: Event = { 
      ...event, 
      id,
      isVisible: event.isVisible ?? true,
      isDraft: event.isDraft ?? true,
      sortOrder: event.sortOrder ?? 0,
      descriptionIt: event.descriptionIt ?? null,
      descriptionEn: event.descriptionEn ?? null,
      imageUrl: event.imageUrl ?? null,
      eventDate: event.eventDate ?? null,
      createdAt: now,
      updatedAt: now 
    };
    this.events.set(id, eventItem);
    return eventItem;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated: Event = { ...existing, ...event, updatedAt: new Date() };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  async getMedia(): Promise<Media[]> {
    return Array.from(this.media.values());
  }

  async getMediaItem(id: number): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async createMedia(media: InsertMedia): Promise<Media> {
    const id = this.nextId.media++;
    const now = new Date();
    const mediaItem: Media = { 
      ...media, 
      id,
      width: media.width ?? null,
      height: media.height ?? null,
      altIt: media.altIt ?? null,
      altEn: media.altEn ?? null,
      category: media.category ?? null,
      tags: media.tags ?? null,
      createdAt: now 
    };
    this.media.set(id, mediaItem);
    return mediaItem;
  }

  async deleteMedia(id: number): Promise<boolean> {
    return this.media.delete(id);
  }

  async getSiteSettings(): Promise<SiteSettings[]> {
    return Array.from(this.siteSettings.values());
  }

  async getSiteSetting(key: string): Promise<SiteSettings | undefined> {
    return this.siteSettings.get(key);
  }

  async upsertSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings> {
    const existing = this.siteSettings.get(setting.key);
    const now = new Date();
    const settingItem: SiteSettings = { 
      id: existing?.id ?? this.nextId.siteSettings++,
      key: setting.key,
      valueIt: setting.valueIt ?? null,
      valueEn: setting.valueEn ?? null,
      updatedAt: now 
    };
    this.siteSettings.set(setting.key, settingItem);
    return settingItem;
  }
}

export const storage = new MemStorage();
