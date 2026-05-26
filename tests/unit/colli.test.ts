import { describe, expect, it } from "vitest";
import {
  buildColliBookingUrl,
  collectColliCountMismatches,
  EXPECTED_COLLI_MENU_COUNTS,
  getColliMenuCounts,
  getColliBookingWhatsappNumber,
  localizedColliText,
  normalizeColliBookingPhone,
  sanitizeColliMenuDietaryFlags,
  validateColliMenuPayload,
  type ColliMenuPayload,
} from "@shared/colli";

const emptyMenu: ColliMenuPayload = {
  sections: [],
  categories: [],
  dishes: [],
  wineCategories: [],
  wines: [],
  allergens: [],
};

describe("colli menu helpers", () => {
  it("validates the required menu arrays", () => {
    expect(validateColliMenuPayload(emptyMenu)).toBe(emptyMenu);
    expect(() => validateColliMenuPayload({ sections: [] })).toThrow(/missing arrays/i);
  });

  it("counts menu entities with the expected keys", () => {
    expect(Object.keys(getColliMenuCounts(emptyMenu))).toEqual(
      Object.keys(EXPECTED_COLLI_MENU_COUNTS),
    );
  });

  it("reports count mismatches against the canonical Colli baseline", () => {
    expect(
      collectColliCountMismatches({
        sections: 3,
        categories: 14,
        dishes: 120,
        wineCategories: 5,
        wines: 11,
        allergens: 14,
      }),
    ).toEqual(["wines: expected 13, found 11"]);
  });

  it("falls back to Italian text when English is empty", () => {
    expect(localizedColliText("en", "Food", "")).toBe("Food");
    expect(localizedColliText("it", "Vini", "Wines")).toBe("Vini");
  });

  it("normalizes Colli booking phone numbers for WhatsApp links", () => {
    expect(normalizeColliBookingPhone("+39 333 534 5751")).toBe("+393335345751");
    expect(getColliBookingWhatsappNumber("+39 333 534 5751")).toBe("393335345751");
    expect(buildColliBookingUrl("+39 333 534 5751")).toContain("wa.me/393335345751");
  });

  it("gives precedence to the gluten allergen over the gluten-free flag", () => {
    const normalized = sanitizeColliMenuDietaryFlags({
      ...emptyMenu,
      allergens: [{ id: "1", name_it: "Glutine", name_en: "Gluten" }],
      dishes: [
        {
          id: "10",
          category_id: "5",
          name_it: "Test",
          gluten_free: true,
          allergens: ["1"],
        },
      ],
    });

    expect(normalized.dishes[0].gluten_free).toBe(false);
    expect(normalized.dishes[0].allergens).toEqual(["1"]);
  });
});
