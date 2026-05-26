import {
  getColliMenuCounts,
  sanitizeColliMenuDietaryFlags,
  validateColliMenuPayload,
  type ColliMenuCounts,
  type ColliMenuPayload,
} from "@shared/colli";

export interface ColliSectionSummary {
  id: string | number | null;
  nameIt: string | null;
  nameEn: string | null;
  slug: string | null;
  order: number | null;
}

export interface ColliMenuMetadata {
  [key: string]: unknown;
  source: "siteccv-supabase-snapshot" | "ccv-colli-render-bridge";
  sourceUrl: string;
  fetchedAt: string;
  counts: ColliMenuCounts;
  sections: ColliSectionSummary[];
  stale: boolean;
  englishEnabled: boolean;
  sourceChecksum?: string | null;
  publishedAt?: string | null;
}

export interface ColliMenuResponse extends ColliMenuPayload {
  metadata: ColliMenuMetadata;
}

export function normalizeColliMenuSnapshot(payload: unknown): ColliMenuPayload {
  return sanitizeColliMenuDietaryFlags(validateColliMenuPayload(payload));
}

export function buildColliMenuResponse(
  snapshot: ColliMenuPayload,
  options: Pick<ColliMenuMetadata, "source" | "sourceUrl"> &
    Partial<
      Pick<
        ColliMenuMetadata,
        "englishEnabled" | "fetchedAt" | "publishedAt" | "sourceChecksum" | "stale"
      >
    >,
): ColliMenuResponse {
  return {
    ...snapshot,
    metadata: {
      source: options.source,
      sourceUrl: options.sourceUrl,
      fetchedAt: options.fetchedAt ?? new Date().toISOString(),
      counts: getColliMenuCounts(snapshot),
      sections: snapshot.sections.map(toSectionSummary),
      stale: options.stale ?? false,
      englishEnabled: options.englishEnabled ?? true,
      sourceChecksum: options.sourceChecksum,
      publishedAt: options.publishedAt,
    },
  };
}

function toSectionSummary(section: unknown): ColliSectionSummary {
  const record = section && typeof section === "object" ? (section as Record<string, unknown>) : {};

  return {
    id: toNullableId(record.id),
    nameIt: toNullableString(record.name_it ?? record.nameIt ?? record.title),
    nameEn: toNullableString(record.name_en ?? record.nameEn),
    slug: toNullableString(record.slug ?? record.key),
    order: toNullableNumber(record.order ?? record.sort_order ?? record.sortOrder),
  };
}

function toNullableId(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
