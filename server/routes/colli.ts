import { Router } from "express";
import {
  getColliMenuCounts,
  sanitizeColliMenuDietaryFlags,
  validateColliMenuPayload,
  type ColliMenuCounts,
  type ColliMenuPayload,
} from "@shared/colli";
import { pool } from "../db";
import {
  fetchColliSnapshotFromSupabaseRest,
  shouldPreferSupabaseColliAdapter,
} from "../colli-supabase-adapter";
import { getColliAdminSettings } from "../colli-settings";

interface ColliSectionSummary {
  id: string | number | null;
  nameIt: string | null;
  nameEn: string | null;
  slug: string | null;
  order: number | null;
}

interface ColliMenuResponse extends ColliMenuPayload {
  metadata: {
    source: "siteccv-supabase-snapshot" | "ccv-colli-render-bridge";
    sourceUrl: string;
    fetchedAt: string;
    counts: ColliMenuCounts;
    sections: ColliSectionSummary[];
    stale: boolean;
    englishEnabled: boolean;
    sourceChecksum?: string | null;
    publishedAt?: string | null;
  };
}

const COLLI_MENU_SOURCE_URL =
  process.env.COLLI_MENU_SOURCE_URL || "https://ccvcolli-ghxg.onrender.com/api/menu/draft";

const COLLI_MENU_CACHE_TTL_MS = 60_000;
const COLLI_MENU_DB_TIMEOUT_MS = 2_500;
const COLLI_MENU_FETCH_TIMEOUT_MS = 8_000;

let cachedMenu: ColliMenuResponse | null = null;
let cachedMenuExpiresAt = 0;

export const publicColliRouter = Router();

export function invalidateColliMenuCache() {
  cachedMenu = null;
  cachedMenuExpiresAt = 0;
}

publicColliRouter.get("/menu", async (_req, res) => {
  try {
    const menu = await getColliMenu();
    res.set("Cache-Control", "no-store, max-age=0");
    res.json(menu);
  } catch (error) {
    console.error("[colli] Failed to fetch public menu:", error);
    res.status(502).json({ error: "Failed to fetch Colli menu" });
  }
});

async function getColliMenu(): Promise<ColliMenuResponse> {
  const now = Date.now();

  if (cachedMenu && cachedMenuExpiresAt > now) {
    return cachedMenu;
  }

  try {
    const freshMenu = await fetchColliMenu();
    cachedMenu = freshMenu;
    cachedMenuExpiresAt = now + COLLI_MENU_CACHE_TTL_MS;
    return freshMenu;
  } catch (error) {
    if (cachedMenu) {
      console.warn("[colli] Using stale cached menu after upstream fetch failure:", error);
      return {
        ...cachedMenu,
        metadata: {
          ...cachedMenu.metadata,
          stale: true,
        },
      };
    }

    throw error;
  }
}

async function fetchColliMenu(): Promise<ColliMenuResponse> {
  const attachSettings = async (menu: ColliMenuResponse) => ({
    ...menu,
    metadata: {
      ...menu.metadata,
      englishEnabled: (await getColliAdminSettings()).englishEnabled,
    },
  });

  if (shouldPreferSupabaseColliAdapter()) {
    const supabaseSnapshot = await fetchColliSnapshotFromSupabaseRest();
    if (supabaseSnapshot) return attachSettings(supabaseSnapshot);
  }

  const internalSnapshot = await withTimeout(
    fetchColliMenuFromDatabase(),
    COLLI_MENU_DB_TIMEOUT_MS,
    "Colli DB snapshot read timed out",
  ).catch((error) => {
    console.warn("[colli] Falling back to Render bridge after DB timeout:", error);
    return null;
  });

  if (internalSnapshot) return attachSettings(internalSnapshot);

  return attachSettings(await fetchColliMenuFromBridge());
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fetchColliMenuFromDatabase(): Promise<ColliMenuResponse | null> {
  if (!pool) return null;

  try {
    const result = await pool.query<{
      snapshot: unknown;
      source_checksum: string | null;
      published_at: Date | string | null;
    }>(
      `select snapshot, source_checksum, published_at
       from colli_menu_snapshots
       where status = 'active'
       order by published_at desc, id desc
       limit 1`,
    );

    const row = result.rows[0];
    if (!row) return null;

    const snapshot = sanitizeColliMenuDietaryFlags(validateColliMenuPayload(row.snapshot));
    return {
      ...snapshot,
      metadata: buildMetadata(snapshot, {
        source: "siteccv-supabase-snapshot",
        sourceUrl: "colli_menu_snapshots",
        sourceChecksum: row.source_checksum,
        publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
      }),
    };
  } catch (error) {
    console.warn("[colli] Falling back to Render bridge after DB snapshot read failed:", error);
    return null;
  }
}

async function fetchColliMenuFromBridge(): Promise<ColliMenuResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COLLI_MENU_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(COLLI_MENU_SOURCE_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Colli source returned ${response.status}`);
    }

    const payload = await response.json();
    const snapshot = sanitizeColliMenuDietaryFlags(validateColliMenuPayload(payload));
    return {
      ...snapshot,
      metadata: buildMetadata(snapshot, {
        source: "ccv-colli-render-bridge",
        sourceUrl: COLLI_MENU_SOURCE_URL,
      }),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildMetadata(
  snapshot: ColliMenuPayload,
  options: Pick<ColliMenuResponse["metadata"], "source" | "sourceUrl"> &
    Partial<Pick<ColliMenuResponse["metadata"], "sourceChecksum" | "publishedAt">>,
): ColliMenuResponse["metadata"] {
  return {
    source: options.source,
    sourceUrl: options.sourceUrl,
    fetchedAt: new Date().toISOString(),
    counts: getColliMenuCounts(snapshot),
    sections: snapshot.sections.map(toSectionSummary),
    stale: false,
    englishEnabled: true,
    sourceChecksum: options.sourceChecksum,
    publishedAt: options.publishedAt,
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
