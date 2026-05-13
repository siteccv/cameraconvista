import pg from "pg";
import {
  COLLI_BOOKING_SETTINGS_KEY,
  DEFAULT_COLLI_BOOKING_SETTINGS,
  EXPECTED_COLLI_MENU_COUNTS,
  getColliMenuCounts,
  normalizeColliBookingPhone,
  validateColliMenuPayload,
  type ColliMenuCounts,
} from "../shared/colli";

const DEFAULT_COLLI_SOURCE_URL = "https://ccvcolli-ghxg.onrender.com/api/menu/draft";

const COLLI_TABLES = [
  "colli_sections",
  "colli_categories",
  "colli_items",
  "colli_allergens",
  "colli_item_allergens",
  "colli_wine_categories",
  "colli_wines",
  "colli_settings",
  "colli_menu_snapshots",
] as const;

interface TableStatus {
  exists: boolean;
  count: number | null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the read-only Colli DB check");
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const [cms, colliTables, sourceSnapshot] = await Promise.all([
      readCmsStatus(pool),
      readColliTableStatus(pool),
      readSourceSnapshot(),
    ]);

    console.log(
      JSON.stringify(
        {
          mode: "read-only",
          writesPerformed: false,
          database: describeDatabase(databaseUrl),
          cms,
          colliTables,
          sourceSnapshot,
          nextRequiredAction: getNextRequiredAction(cms.pageExists, colliTables),
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

async function readCmsStatus(pool: pg.Pool) {
  const pagesResult = await pool.query(
    "select id, slug, title_it, is_visible, is_draft from pages where slug = 'colli' order by id",
  );
  const pageRows = pagesResult.rows;
  const pageIds = pageRows.map((row) => row.id);

  let blocks: Array<{ pageId: number; blockType: string; id: number }> = [];
  if (pageIds.length > 0) {
    const blocksResult = await pool.query(
      "select id, page_id, block_type from page_blocks where page_id = any($1::int[]) order by page_id, sort_order, id",
      [pageIds],
    );
    blocks = blocksResult.rows.map((row) => ({
      id: row.id,
      pageId: row.page_id,
      blockType: row.block_type,
    }));
  }

  const bookingResult = await pool.query(
    "select value_it from site_settings where key = $1 limit 1",
    [COLLI_BOOKING_SETTINGS_KEY],
  );
  const bookingSettings = readBookingSettings(bookingResult.rows[0]?.value_it);

  return {
    pageExists: pageRows.length > 0,
    pages: pageRows,
    blocksCount: blocks.length,
    blockTypes: blocks.map((block) => block.blockType),
    bookingSettings,
  };
}

function readBookingSettings(value: string | undefined) {
  if (!value) {
    return {
      exists: false,
      phoneNumber: DEFAULT_COLLI_BOOKING_SETTINGS.phoneNumber,
    };
  }

  try {
    const parsed = JSON.parse(value) as { phoneNumber?: string };
    return {
      exists: true,
      phoneNumber: normalizeColliBookingPhone(
        parsed.phoneNumber || DEFAULT_COLLI_BOOKING_SETTINGS.phoneNumber,
      ),
    };
  } catch {
    return {
      exists: true,
      phoneNumber: DEFAULT_COLLI_BOOKING_SETTINGS.phoneNumber,
    };
  }
}

async function readColliTableStatus(pool: pg.Pool): Promise<Record<string, TableStatus>> {
  const statuses: Record<string, TableStatus> = {};

  for (const table of COLLI_TABLES) {
    const existsResult = await pool.query("select to_regclass($1) as regclass", [
      `public.${table}`,
    ]);
    const exists = Boolean(existsResult.rows[0]?.regclass);

    statuses[table] = {
      exists,
      count: exists ? await countRows(pool, table) : null,
    };
  }

  return statuses;
}

async function countRows(pool: pg.Pool, table: string): Promise<number> {
  const result = await pool.query(`select count(*)::int as count from ${table}`);
  return result.rows[0]?.count ?? 0;
}

async function readSourceSnapshot(): Promise<{
  source: string;
  reachable: boolean;
  counts: ColliMenuCounts | null;
  error: string | null;
}> {
  const source =
    getCliValue("--source") || process.env.COLLI_MENU_SOURCE_URL || DEFAULT_COLLI_SOURCE_URL;

  try {
    const response = await fetch(source, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`source returned ${response.status}`);
    }

    const payload = await response.json();
    const menu = validateColliMenuPayload(extractMenuPayload(payload));

    return {
      source,
      reachable: true,
      counts: getColliMenuCounts(menu),
      error: null,
    };
  } catch (error) {
    return {
      source,
      reachable: false,
      counts: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractMenuPayload(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "menu" in payload) {
    return (payload as { menu: unknown }).menu;
  }

  return payload;
}

function getCliValue(name: string): string | undefined {
  const equalsArg = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (equalsArg) return equalsArg.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];

  return undefined;
}

function describeDatabase(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    database: url.pathname.replace(/^\//, ""),
  };
}

function getNextRequiredAction(
  pageExists: boolean,
  tableStatuses: Record<string, TableStatus>,
): string {
  const missingTables = Object.entries(tableStatuses)
    .filter(([, status]) => !status.exists)
    .map(([table]) => table);

  if (!pageExists) {
    return "Apply the reviewed CMS migration for page /colli before editing Colli showcase content from admin.";
  }

  if (missingTables.length > 0) {
    return "Apply the reviewed Colli table migration before importing Colli menu data into SITE-CCV Supabase.";
  }

  const hasSnapshot = (tableStatuses.colli_menu_snapshots?.count ?? 0) > 0;
  const coreCountsMatch =
    tableStatuses.colli_sections.count === EXPECTED_COLLI_MENU_COUNTS.sections &&
    tableStatuses.colli_categories.count === EXPECTED_COLLI_MENU_COUNTS.categories &&
    tableStatuses.colli_items.count === EXPECTED_COLLI_MENU_COUNTS.dishes &&
    tableStatuses.colli_wine_categories.count === EXPECTED_COLLI_MENU_COUNTS.wineCategories &&
    tableStatuses.colli_wines.count === EXPECTED_COLLI_MENU_COUNTS.wines &&
    tableStatuses.colli_allergens.count === EXPECTED_COLLI_MENU_COUNTS.allergens;

  if (!hasSnapshot || !coreCountsMatch) {
    return "Run a controlled Colli data import and compare counts before switching /api/colli/menu away from the Render bridge.";
  }

  return "Colli DB is ready: /api/colli/menu can read the SITE-CCV Supabase snapshot, and Colli admin can operate on dedicated colli_* tables.";
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
