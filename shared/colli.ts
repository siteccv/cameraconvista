export type ColliLanguage = "it" | "en";

export type ColliMenuArrayKey =
  | "sections"
  | "categories"
  | "dishes"
  | "wineCategories"
  | "wines"
  | "allergens";

export type ColliMenuCounts = Record<ColliMenuArrayKey, number>;

export interface ColliSection {
  id: string;
  name_it: string;
  name_en?: string | null;
  subtitle_it?: string | null;
  subtitle_en?: string | null;
  order?: number | null;
  type?: string | null;
}

export interface ColliCategory {
  id: string;
  section_id: string;
  name_it: string;
  name_en?: string | null;
  order?: number | null;
}

export interface ColliDish {
  id: string;
  category_id: string;
  name_it: string;
  name_en?: string | null;
  subtitle_it?: string | null;
  subtitle_en?: string | null;
  description_it?: string | null;
  description_en?: string | null;
  price?: number | null;
  vegetarian?: boolean | null;
  gluten_free?: boolean | null;
  allergens?: string[] | null;
  extra_info?: string | null;
  order?: number | null;
}

export interface ColliWineCategory {
  id: string;
  name_it: string;
  name_en?: string | null;
  order?: number | null;
}

export interface ColliWine {
  id: string;
  wine_category_id: string;
  name_it: string;
  name_en?: string | null;
  producer?: string | null;
  origin?: string | null;
  abv?: number | null;
  price_glass?: number | null;
  price_bottle?: number | null;
  order?: number | null;
}

export interface ColliAllergen {
  id: string;
  name_it: string;
  name_en?: string | null;
}

export interface ColliMenuPayload {
  sections: ColliSection[];
  categories: ColliCategory[];
  dishes: ColliDish[];
  wineCategories: ColliWineCategory[];
  wines: ColliWine[];
  allergens: ColliAllergen[];
  metadata?: {
    englishEnabled?: boolean;
    [key: string]: unknown;
  };
}

export interface ColliBookingSettings {
  phoneNumber: string;
}

export interface ColliAdminSettings {
  englishEnabled: boolean;
}

export const COLLI_MENU_ARRAY_KEYS = [
  "sections",
  "categories",
  "dishes",
  "wineCategories",
  "wines",
  "allergens",
] as const satisfies readonly ColliMenuArrayKey[];

export const EXPECTED_COLLI_MENU_COUNTS: ColliMenuCounts = {
  sections: 3,
  categories: 14,
  dishes: 120,
  wineCategories: 5,
  wines: 11,
  allergens: 14,
};

export const COLLI_BOOKING_SETTINGS_KEY = "colli_booking_settings";
export const DEFAULT_COLLI_BOOKING_SETTINGS: ColliBookingSettings = {
  phoneNumber: "+393335345751",
};
export const COLLI_ENGLISH_ENABLED_SETTINGS_KEY = "english_enabled";
export const DEFAULT_COLLI_ADMIN_SETTINGS: ColliAdminSettings = {
  englishEnabled: true,
};
export const COLLI_BOOKING_MESSAGE = "Ciao, vorrei prenotare da Camera con Vista Colli.";

export function normalizeColliBookingPhone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function getColliBookingWhatsappNumber(phoneNumber: string): string {
  return normalizeColliBookingPhone(phoneNumber).replace(/\D/g, "");
}

export function buildColliBookingUrl(phoneNumber: string): string {
  const whatsappNumber =
    getColliBookingWhatsappNumber(phoneNumber) ||
    getColliBookingWhatsappNumber(DEFAULT_COLLI_BOOKING_SETTINGS.phoneNumber);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(COLLI_BOOKING_MESSAGE)}`;
}

export function validateColliMenuPayload(payload: unknown): ColliMenuPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Colli menu payload is not an object");
  }

  const record = payload as Record<string, unknown>;
  const missingKeys = COLLI_MENU_ARRAY_KEYS.filter((key) => !Array.isArray(record[key]));

  if (missingKeys.length > 0) {
    throw new Error(`Colli menu payload is missing arrays: ${missingKeys.join(", ")}`);
  }

  return record as unknown as ColliMenuPayload;
}

export function getColliMenuCounts(menu: ColliMenuPayload): ColliMenuCounts {
  return {
    sections: menu.sections.length,
    categories: menu.categories.length,
    dishes: menu.dishes.length,
    wineCategories: menu.wineCategories.length,
    wines: menu.wines.length,
    allergens: menu.allergens.length,
  };
}

export function sortColliByOrder<T extends { order?: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

interface ColliAllergenLike {
  id: string | number;
  name_it: string;
  name_en?: string | null;
}

export function isColliGlutenAllergen(
  allergen: Pick<ColliAllergenLike, "name_it" | "name_en">,
): boolean {
  const normalized = `${allergen.name_it} ${allergen.name_en ?? ""}`.toLowerCase();
  return normalized.includes("glutine") || normalized.includes("gluten");
}

export function getColliGlutenAllergenIds(allergens: readonly ColliAllergenLike[]): string[] {
  return allergens.filter(isColliGlutenAllergen).map((allergen) => String(allergen.id));
}

export function sanitizeColliMenuDietaryFlags(menu: ColliMenuPayload): ColliMenuPayload {
  const glutenAllergenIds = new Set(getColliGlutenAllergenIds(menu.allergens));
  if (glutenAllergenIds.size === 0) return menu;

  return {
    ...menu,
    dishes: menu.dishes.map((dish) => {
      if (!dish.gluten_free || !dish.allergens?.length) return dish;

      const hasGlutenAllergen = dish.allergens.some((allergenId) =>
        glutenAllergenIds.has(String(allergenId)),
      );
      if (!hasGlutenAllergen) return dish;

      return {
        ...dish,
        gluten_free: false,
      };
    }),
  };
}

export function localizedColliText(
  language: ColliLanguage,
  it?: string | null,
  en?: string | null,
): string {
  if (language === "en") return en || it || "";
  return it || en || "";
}
