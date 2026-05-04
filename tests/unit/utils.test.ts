import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    const shouldHide = false;
    expect(cn("base", shouldHide && "hidden", "active")).toBe("base active");
  });

  it("resolves conflicting Tailwind utility classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
