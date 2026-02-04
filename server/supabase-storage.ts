import { supabaseAdmin } from './supabase';
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
} from "@shared/schema";
import type { IStorage } from "./storage";

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray<T>(arr: Record<string, any>[]): T[] {
  return arr.map(item => toCamelCase(item) as T);
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as User : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabaseAdmin.from('users').select('*').eq('username', username).single();
    return data ? toCamelCase(data) as User : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin.from('users').insert(toSnakeCase(user)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as User;
  }

  async getPages(): Promise<Page[]> {
    const { data } = await supabaseAdmin.from('pages').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<Page>(data || []);
  }

  async getPage(id: number): Promise<Page | undefined> {
    const { data } = await supabaseAdmin.from('pages').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as Page : undefined;
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const { data } = await supabaseAdmin.from('pages').select('*').eq('slug', slug).single();
    return data ? toCamelCase(data) as Page : undefined;
  }

  async createPage(page: InsertPage): Promise<Page> {
    const { data, error } = await supabaseAdmin.from('pages').insert(toSnakeCase(page)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as Page;
  }

  async updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined> {
    const updateData = { ...toSnakeCase(page), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('pages').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as Page : undefined;
  }

  async deletePage(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('pages').delete().eq('id', id);
    return !error;
  }

  async getPageBlocks(pageId: number): Promise<PageBlock[]> {
    const { data } = await supabaseAdmin.from('page_blocks').select('*').eq('page_id', pageId).order('sort_order', { ascending: true });
    return toCamelCaseArray<PageBlock>(data || []);
  }

  async getPageBlock(id: number): Promise<PageBlock | undefined> {
    const { data } = await supabaseAdmin.from('page_blocks').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as PageBlock : undefined;
  }

  async createPageBlock(block: InsertPageBlock): Promise<PageBlock> {
    const { data, error } = await supabaseAdmin.from('page_blocks').insert(toSnakeCase(block)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as PageBlock;
  }

  async updatePageBlock(id: number, block: Partial<InsertPageBlock>): Promise<PageBlock | undefined> {
    const updateData = { ...toSnakeCase(block), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('page_blocks').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as PageBlock : undefined;
  }

  async deletePageBlock(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('page_blocks').delete().eq('id', id);
    return !error;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    const { data } = await supabaseAdmin.from('menu_items').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<MenuItem>(data || []);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const { data } = await supabaseAdmin.from('menu_items').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as MenuItem : undefined;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const { data, error } = await supabaseAdmin.from('menu_items').insert(toSnakeCase(item)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as MenuItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const updateData = { ...toSnakeCase(item), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('menu_items').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as MenuItem : undefined;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('menu_items').delete().eq('id', id);
    return !error;
  }

  async getWines(): Promise<Wine[]> {
    const { data } = await supabaseAdmin.from('wines').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<Wine>(data || []);
  }

  async getWine(id: number): Promise<Wine | undefined> {
    const { data } = await supabaseAdmin.from('wines').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as Wine : undefined;
  }

  async createWine(wine: InsertWine): Promise<Wine> {
    const { data, error } = await supabaseAdmin.from('wines').insert(toSnakeCase(wine)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as Wine;
  }

  async updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined> {
    const updateData = { ...toSnakeCase(wine), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('wines').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as Wine : undefined;
  }

  async deleteWine(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('wines').delete().eq('id', id);
    return !error;
  }

  async getCocktails(): Promise<Cocktail[]> {
    const { data } = await supabaseAdmin.from('cocktails').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<Cocktail>(data || []);
  }

  async getCocktail(id: number): Promise<Cocktail | undefined> {
    const { data } = await supabaseAdmin.from('cocktails').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as Cocktail : undefined;
  }

  async createCocktail(cocktail: InsertCocktail): Promise<Cocktail> {
    const { data, error } = await supabaseAdmin.from('cocktails').insert(toSnakeCase(cocktail)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as Cocktail;
  }

  async updateCocktail(id: number, cocktail: Partial<InsertCocktail>): Promise<Cocktail | undefined> {
    const updateData = { ...toSnakeCase(cocktail), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('cocktails').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as Cocktail : undefined;
  }

  async deleteCocktail(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('cocktails').delete().eq('id', id);
    return !error;
  }

  async getEvents(): Promise<Event[]> {
    const { data } = await supabaseAdmin.from('events').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<Event>(data || []);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const { data } = await supabaseAdmin.from('events').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as Event : undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const { data, error } = await supabaseAdmin.from('events').insert(toSnakeCase(event)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as Event;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const updateData = { ...toSnakeCase(event), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('events').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as Event : undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
    return !error;
  }

  async getMedia(): Promise<Media[]> {
    const { data } = await supabaseAdmin.from('media').select('*').order('created_at', { ascending: false });
    return toCamelCaseArray<Media>(data || []);
  }

  async getMediaItem(id: number): Promise<Media | undefined> {
    const { data } = await supabaseAdmin.from('media').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as Media : undefined;
  }

  async createMedia(mediaItem: InsertMedia): Promise<Media> {
    const { data, error } = await supabaseAdmin.from('media').insert(toSnakeCase(mediaItem)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as Media;
  }

  async updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media | undefined> {
    const { data, error } = await supabaseAdmin.from('media').update(toSnakeCase(mediaItem)).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as Media : undefined;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('media').delete().eq('id', id);
    return !error;
  }

  async getMediaCategories(): Promise<MediaCategory[]> {
    const { data } = await supabaseAdmin.from('media_categories').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<MediaCategory>(data || []);
  }

  async getMediaCategory(id: number): Promise<MediaCategory | undefined> {
    const { data } = await supabaseAdmin.from('media_categories').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as MediaCategory : undefined;
  }

  async createMediaCategory(category: InsertMediaCategory): Promise<MediaCategory> {
    const { data, error } = await supabaseAdmin.from('media_categories').insert(toSnakeCase(category)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as MediaCategory;
  }

  async updateMediaCategory(id: number, category: Partial<InsertMediaCategory>): Promise<MediaCategory | undefined> {
    const { data, error } = await supabaseAdmin.from('media_categories').update(toSnakeCase(category)).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as MediaCategory : undefined;
  }

  async deleteMediaCategory(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('media_categories').delete().eq('id', id);
    return !error;
  }

  async getGalleries(): Promise<Gallery[]> {
    const { data } = await supabaseAdmin.from('galleries').select('*').order('sort_order', { ascending: true });
    return toCamelCaseArray<Gallery>(data || []);
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    const { data } = await supabaseAdmin.from('galleries').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as Gallery : undefined;
  }

  async createGallery(gallery: InsertGallery): Promise<Gallery> {
    const { data, error } = await supabaseAdmin.from('galleries').insert(toSnakeCase(gallery)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as Gallery;
  }

  async updateGallery(id: number, gallery: Partial<InsertGallery>): Promise<Gallery | undefined> {
    const updateData = { ...toSnakeCase(gallery), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('galleries').update(updateData).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as Gallery : undefined;
  }

  async deleteGallery(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('galleries').delete().eq('id', id);
    return !error;
  }

  async getGalleryImages(galleryId: number): Promise<GalleryImage[]> {
    const { data } = await supabaseAdmin.from('gallery_images').select('*').eq('gallery_id', galleryId).order('sort_order', { ascending: true });
    return toCamelCaseArray<GalleryImage>(data || []);
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    const { data } = await supabaseAdmin.from('gallery_images').select('*').eq('id', id).single();
    return data ? toCamelCase(data) as GalleryImage : undefined;
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const { data, error } = await supabaseAdmin.from('gallery_images').insert(toSnakeCase(image)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as GalleryImage;
  }

  async updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const { data, error } = await supabaseAdmin.from('gallery_images').update(toSnakeCase(image)).eq('id', id).select().single();
    if (error) return undefined;
    return data ? toCamelCase(data) as GalleryImage : undefined;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('gallery_images').delete().eq('id', id);
    return !error;
  }

  async getSiteSettings(): Promise<SiteSettings[]> {
    const { data } = await supabaseAdmin.from('site_settings').select('*');
    return toCamelCaseArray<SiteSettings>(data || []);
  }

  async getSiteSetting(key: string): Promise<SiteSettings | undefined> {
    const { data } = await supabaseAdmin.from('site_settings').select('*').eq('key', key).single();
    return data ? toCamelCase(data) as SiteSettings : undefined;
  }

  async upsertSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings> {
    const snakeSetting = toSnakeCase(setting);
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ ...snakeSetting, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as SiteSettings;
  }

  async getAdminSession(id: string): Promise<AdminSession | undefined> {
    const { data } = await supabaseAdmin.from('admin_sessions').select('*').eq('id', id).single();
    if (!data) return undefined;
    const session = toCamelCase(data) as AdminSession;
    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteAdminSession(id);
      return undefined;
    }
    return session;
  }

  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const { data, error } = await supabaseAdmin.from('admin_sessions').insert(toSnakeCase(session)).select().single();
    if (error) throw new Error(error.message);
    return toCamelCase(data) as AdminSession;
  }

  async deleteAdminSession(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('admin_sessions').delete().eq('id', id);
    return !error;
  }

  async cleanupExpiredSessions(): Promise<void> {
    await supabaseAdmin.from('admin_sessions').delete().lt('expires_at', new Date().toISOString());
  }

  async seedInitialData(): Promise<void> {
    const pages = await this.getPages();
    if (pages.length > 0) {
      console.log("Supabase already has data, skipping seed");
      return;
    }
    console.log("Supabase database connected - data already migrated");
  }
}

export const supabaseStorage = new SupabaseStorage();
