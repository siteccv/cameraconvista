import { describe, expect, it } from "vitest";
import { formatDecimal, formatPrice, formatProducer } from "@/lib/colli-menu-format";

describe("colli menu format", () => {
  it("formats public menu prices with the Colli euro style", () => {
    expect(formatPrice(5)).toBe("€ 5");
    expect(formatPrice(4.5)).toBe("€ 4,5");
  });

  it("formats wine decimals with Italian decimal separators", () => {
    expect(formatDecimal(12)).toBe("12");
    expect(formatDecimal(12.5)).toBe("12,5");
  });

  it("normalizes optional producer names", () => {
    expect(formatProducer("CANTINA ROSSI")).toBe("Cantina rossi");
    expect(formatProducer(null)).toBeNull();
    expect(formatProducer(undefined)).toBeNull();
  });
});
