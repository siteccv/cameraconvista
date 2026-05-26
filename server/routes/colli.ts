import { Router } from "express";
import {
  collectColliCountMismatches,
  EXPECTED_COLLI_MENU_COUNTS,
  getColliMenuCounts,
  type ColliMenuCounts,
} from "@shared/colli";
import { pool } from "../db";
import { fetchColliSnapshotFromSupabaseRest } from "../colli-supabase-adapter";
import { getColliAdminSettings } from "../colli-settings";
import { isSupabaseAdminConfigured } from "../supabase";
import {
  buildColliMenuResponse,
  normalizeColliMenuSnapshot,
  type ColliMenuResponse,
} from "../colli-menu-response";

const COLLI_MENU_SOURCE_URL =
  process.env.COLLI_MENU_SOURCE_URL || "https://ccvcolli-ghxg.onrender.com/api/menu/draft";
const COLLI_MENU_ALLOW_BRIDGE_FALLBACK = process.env.COLLI_MENU_ALLOW_BRIDGE_FALLBACK === "true";

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

  const internalSnapshot = await fetchColliMenuFromInternalSources();

  if (internalSnapshot) return attachSettings(internalSnapshot);

  if (!COLLI_MENU_ALLOW_BRIDGE_FALLBACK) {
    throw new Error("Colli internal snapshot unavailable and external bridge fallback is disabled");
  }

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

    const snapshot = normalizeColliMenuSnapshot(row.snapshot);
    return buildColliMenuResponse(snapshot, {
      source: "siteccv-supabase-snapshot",
      sourceUrl: "colli_menu_snapshots",
      sourceChecksum: row.source_checksum,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    });
  } catch (error) {
    console.warn("[colli] Internal DB snapshot read failed:", error);
    return null;
  }
}

async function fetchColliMenuFromInternalSources(): Promise<ColliMenuResponse | null> {
  const dbSnapshot = await withTimeout(
    fetchColliMenuFromDatabase(),
    COLLI_MENU_DB_TIMEOUT_MS,
    "Colli DB snapshot read timed out",
  ).catch((error) => {
    console.warn("[colli] Internal DB snapshot timed out:", error);
    return null;
  });
  if (dbSnapshot) return dbSnapshot;

  if (!isSupabaseAdminConfigured) return null;

  const supabaseSnapshot = await withTimeout(
    fetchColliSnapshotFromSupabaseRest(),
    COLLI_MENU_FETCH_TIMEOUT_MS,
    "Colli Supabase REST snapshot read timed out",
  ).catch((error) => {
    console.warn("[colli] Internal Supabase REST snapshot failed:", error);
    return null;
  });

  return supabaseSnapshot;
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
    const snapshot = normalizeColliMenuSnapshot(payload);
    const mismatches = collectColliCountMismatches(
      getColliMenuCounts(snapshot),
      EXPECTED_COLLI_MENU_COUNTS,
    );
    if (mismatches.length > 0) {
      throw new Error(`Colli bridge snapshot rejected: ${mismatches.join(", ")}`);
    }

    return buildColliMenuResponse(snapshot, {
      source: "ccv-colli-render-bridge",
      sourceUrl: COLLI_MENU_SOURCE_URL,
    });
  } finally {
    clearTimeout(timeout);
  }
}
