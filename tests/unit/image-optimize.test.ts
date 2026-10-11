import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, optimizeToWebp } from "../../server/image-optimize";

// Rumore leggermente sfocato: si comporta come una foto molto dettagliata, che a
// 1920px/q80 supera il limite e costringe a scendere di qualita e dimensione.
async function detailedPhoto(width: number, height: number): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixels.length; i++) pixels[i] = Math.floor(Math.random() * 256);
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .blur(1.5)
    .png()
    .toBuffer();
}

describe("optimizeToWebp", () => {
  it("brings a heavy photo under the size limit and within 1920px", async () => {
    const input = await detailedPhoto(3000, 2000);
    const result = await optimizeToWebp(input);
    const meta = await sharp(result.buffer).metadata();

    expect(meta.format).toBe("webp");
    expect(result.buffer.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(1920);
    expect(result.width).toBe(meta.width);
  }, 30000);

  it("keeps a small image at its size and under the default limit", async () => {
    const input = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#336699" },
    })
      .jpeg()
      .toBuffer();
    const result = await optimizeToWebp(input);

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.buffer.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it("rotates when asked", async () => {
    const input = await sharp({
      create: { width: 400, height: 200, channels: 3, background: "#000000" },
    })
      .png()
      .toBuffer();
    const result = await optimizeToWebp(input, { rotate: 90 });

    expect(result.width).toBe(200);
    expect(result.height).toBe(400);
  });
});
