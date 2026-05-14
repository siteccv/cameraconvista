import type {
  ColliAllergen,
  ColliCategory,
  ColliDish,
  ColliSection,
  ColliWine,
  ColliWineCategory,
} from "@shared/colli";

export interface ColliAdminSession {
  authenticated: boolean;
}

export type EditTarget =
  | { type: "section"; item?: ColliSection }
  | { type: "category"; sectionId: string; item?: ColliCategory }
  | {
      type: "item";
      categoryId: string;
      item?: ColliDish;
      sectionType?: string | null;
      sectionNameEn?: string | null;
    }
  | { type: "wine_category"; item?: ColliWineCategory }
  | { type: "wine"; wineCategoryId: string; item?: ColliWine }
  | { type: "allergen"; item?: ColliAllergen };
