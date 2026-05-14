import { describe, expect, it } from "vitest";
import {
  HttpError,
  isBcryptHash,
  optionalText,
  parseId,
  parseIds,
  requiredText,
  toNumberOrNull,
} from "../../server/routes/colli-admin-utils";

describe("colli admin route utils", () => {
  it("parses positive integer ids and rejects invalid values", () => {
    expect(parseId("42")).toBe(42);
    expect(parseIds(["1", 2])).toEqual([1, 2]);

    expect(() => parseId("0")).toThrow(HttpError);
    expect(() => parseIds("1")).toThrow(HttpError);
  });

  it("normalizes optional and required text fields", () => {
    expect(optionalText("  Focacce  ")).toBe("Focacce");
    expect(optionalText("   ")).toBeNull();
    expect(optionalText(12)).toBeNull();
    expect(requiredText("  Nome  ", "name_it")).toBe("Nome");

    try {
      requiredText("", "name_it");
      throw new Error("requiredText did not throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(400);
    }
  });

  it("converts numeric payload fields without accepting invalid numbers", () => {
    expect(toNumberOrNull("4,5")).toBe(4.5);
    expect(toNumberOrNull(" 6.25 ")).toBe(6.25);
    expect(toNumberOrNull(7)).toBe(7);
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull("abc")).toBeNull();
    expect(toNumberOrNull({})).toBeNull();
  });

  it("detects bcrypt hash prefixes used by supported bcrypt variants", () => {
    expect(isBcryptHash("$2a$10$abcdefghijklmnopqrstuu")).toBe(true);
    expect(isBcryptHash("$2b$10$abcdefghijklmnopqrstuu")).toBe(true);
    expect(isBcryptHash("$2y$10$abcdefghijklmnopqrstuu")).toBe(true);
    expect(isBcryptHash("plain-password")).toBe(false);
  });
});
