import { describe, expect, it } from "vitest";
import { calculateImageMath } from "@/lib/image-math";

describe("image math", () => {
  it("returns a stable empty result for invalid dimensions", () => {
    expect(calculateImageMath(0, 100, 200, 100, 100, 0, 0)).toEqual({
      imgW: 0,
      imgH: 0,
      imgLeft: 0,
      imgTop: 0,
      overflowX: 0,
      overflowY: 0,
      minZoom: 100,
    });
  });

  it("enforces minimum zoom to cover container height", () => {
    expect(calculateImageMath(100, 100, 200, 100, 100, 50, 100)).toEqual({
      imgW: 200,
      imgH: 100,
      imgLeft: -25,
      imgTop: 0,
      overflowX: 100,
      overflowY: 0,
      minZoom: 200,
    });
  });

  it("uses reference width for desktop framing", () => {
    expect(calculateImageMath(100, 100, 100, 100, 100, 0, 0, 200)).toEqual({
      imgW: 200,
      imgH: 200,
      imgLeft: -50,
      imgTop: -50,
      overflowX: 100,
      overflowY: 100,
      minZoom: 100,
    });
  });
});
