import { describe, expect, it } from "vitest";
import {
  buildColliBookingUrl,
  EXPECTED_COLLI_MENU_COUNTS,
  getColliMenuCounts,
  getColliBookingWhatsappNumber,
  localizedColliText,
  normalizeColliBookingPhone,
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

  it("falls back to Italian text when English is empty", () => {
    expect(localizedColliText("en", "Food", "")).toBe("Food");
    expect(localizedColliText("it", "Vini", "Wines")).toBe("Vini");
  });

  it("normalizes Colli booking phone numbers for WhatsApp links", () => {
    expect(normalizeColliBookingPhone("+39 333 534 5751")).toBe("+393335345751");
    expect(getColliBookingWhatsappNumber("+39 333 534 5751")).toBe("393335345751");
    expect(buildColliBookingUrl("+39 333 534 5751")).toContain("wa.me/393335345751");
  });
});
