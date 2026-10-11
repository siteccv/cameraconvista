import sharp from "sharp";

// Le foto pubbliche devono restare sotto ~400 KB: oltre consumano il traffico
// gratuito di Supabase (5 GB/mese) senza un guadagno visibile a schermo.
export const MAX_IMAGE_BYTES = 400 * 1024;

// I file caricati hanno sempre un nome nuovo (timestamp), quindi non cambiano mai
// allo stesso indirizzo: il browser puo tenerli un anno senza riscaricarli.
export const MEDIA_CACHE_CONTROL = "31536000";

// Tentativi in ordine: prima la qualita storica (1920px, q80), poi si scende
// finche il file non sta sotto il limite.
const WEBP_STEPS: Array<[number, number]> = [
  [1920, 80],
  [1920, 72],
  [1600, 72],
  [1440, 68],
  [1280, 65],
];

export interface OptimizedImage {
  buffer: Buffer;
  width: number | null;
  height: number | null;
}

export async function optimizeToWebp(
  input: Buffer,
  options: { rotate?: number; maxBytes?: number } = {},
): Promise<OptimizedImage> {
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;
  const source = options.rotate ? await sharp(input).rotate(options.rotate).toBuffer() : input;

  let buffer = source;
  for (const [maxDimension, quality] of WEBP_STEPS) {
    buffer = await sharp(source)
      .resize(maxDimension, maxDimension, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (buffer.length <= maxBytes) break;
  }

  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width ?? null, height: meta.height ?? null };
}
