import { describe, expect, it } from "vitest";
import {
  formatInputPrice,
  formatPrice,
  getDialogTitle,
  getSaveRequest,
  parsePrice,
  sanitizePrice,
  sortByOrder,
} from "@/lib/colli-admin-utils";

describe("colli admin utils", () => {
  it("sorts by order without mutating the source array", () => {
    const source = [
      { id: "a", order: 2 },
      { id: "b", order: null },
      { id: "c", order: 1 },
    ];

    expect(sortByOrder(source).map((item) => item.id)).toEqual(["b", "c", "a"]);
    expect(source.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("formats integer and decimal prices for Colli admin fields", () => {
    expect(formatPrice(5)).toBe("5");
    expect(formatPrice(4.5)).toBe("4,5");
    expect(formatInputPrice(null)).toBe("");
    expect(formatInputPrice(undefined)).toBe("");
  });

  it("sanitizes price input with one decimal digit", () => {
    expect(sanitizePrice("€ 4.50")).toBe("4,5");
    expect(sanitizePrice("6,,25abc")).toBe("6,2");
    expect(sanitizePrice("12")).toBe("12");
  });

  it("parses sanitized price input", () => {
    expect(parsePrice("4,5")).toBe(4.5);
    expect(parsePrice("6")).toBe(6);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });

  it("builds create and update endpoints for Colli admin edit targets", () => {
    expect(getSaveRequest({ type: "section" })).toEqual({
      method: "POST",
      endpoint: "/api/colli/admin/sections",
    });
    expect(getSaveRequest({ type: "item", item: { id: "42" } })).toEqual({
      method: "PUT",
      endpoint: "/api/colli/admin/items/42",
    });
    expect(getSaveRequest({ type: "wine_category" })).toEqual({
      method: "POST",
      endpoint: "/api/colli/admin/wine-categories",
    });
    expect(getSaveRequest({ type: "allergen", item: { id: 7 } })).toEqual({
      method: "PUT",
      endpoint: "/api/colli/admin/allergens/7",
    });
  });

  it("builds Colli admin dialog titles", () => {
    expect(getDialogTitle({ type: "category" }, false)).toBe("Aggiungi Categoria");
    expect(getDialogTitle({ type: "wine" }, true)).toBe("Modifica Vino");
    expect(getDialogTitle({ type: "wine_category" }, false)).toBe("Aggiungi Categoria Vino");
  });
});
