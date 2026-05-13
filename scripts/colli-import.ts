import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import {
  getColliMenuCounts,
  validateColliMenuPayload,
  type ColliAllergen,
  type ColliCategory,
  type ColliDish,
  type ColliMenuPayload,
  type ColliSection,
  type ColliWine,
  type ColliWineCategory,
} from "../shared/colli";

const DEFAULT_COLLI_SOURCE_URL = "https://ccvcolli-ghxg.onrender.com/api/menu/draft";

const DEDICATED_TABLES = [
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Colli import");
  }

  const source =
    getCliValue("--source") || process.env.COLLI_IMPORT_SOURCE || DEFAULT_COLLI_SOURCE_URL;
  const replace = process.argv.includes("--replace");
  const raw = await readSource(source);
  const menu = validateColliMenuPayload(extractMenuPayload(JSON.parse(raw)));
  const checksum = createHash("sha256").update(raw).digest("hex");
  const counts = getColliMenuCounts(menu);

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");

    const existingCounts = await readExistingCounts(client);
    const hasExistingData = Object.values(existingCounts).some((count) => count > 0);
    if (hasExistingData && !replace) {
      throw new Error(
        "Colli tables already contain data. Re-run with --replace to refresh dedicated Colli tables.",
      );
    }

    if (replace) {
      await client.query(
        "TRUNCATE colli_sections, colli_categories, colli_items, colli_allergens, colli_item_allergens, colli_wine_categories, colli_wines, colli_settings, colli_menu_snapshots RESTART IDENTITY CASCADE",
      );
    }

    const sectionIds = await insertSections(client, menu.sections);
    const categoryIds = await insertCategories(client, menu.categories, sectionIds);
    const allergenIds = await insertAllergens(client, menu.allergens);
    const itemIds = await insertItems(client, menu.dishes, categoryIds);
    await insertItemAllergens(client, menu.dishes, itemIds, allergenIds);
    const wineCategoryIds = await insertWineCategories(client, menu.wineCategories);
    await insertWines(client, menu.wines, wineCategoryIds);
    await insertSnapshotAndSettings(client, source, checksum, counts, menu);

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          mode: "import",
          writesPerformed: true,
          source,
          checksum,
          counts,
          replacedExistingData: replace,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function readSource(source: string): Promise<string> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Colli source returned ${response.status}`);
    }
    return response.text();
  }

  return readFile(source, "utf8");
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

async function readExistingCounts(client: pg.PoolClient): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const table of DEDICATED_TABLES) {
    const result = await client.query(`select count(*)::int as count from ${table}`);
    counts[table] = result.rows[0]?.count ?? 0;
  }

  return counts;
}

async function insertSections(client: pg.PoolClient, sections: ColliSection[]) {
  const ids = new Map<string, number>();

  for (const section of ordered(sections)) {
    const result = await client.query(
      `insert into colli_sections (
        source_id, name_it, name_en, subtitle_it, subtitle_en, type, sort_order, is_active
      ) values ($1, $2, $3, $4, $5, $6, $7, true) returning id`,
      [
        section.id,
        section.name_it,
        section.name_en ?? "",
        section.subtitle_it ?? null,
        section.subtitle_en ?? null,
        section.type ?? null,
        sortOrder(section),
      ],
    );
    ids.set(section.id, result.rows[0].id);
  }

  return ids;
}

async function insertCategories(
  client: pg.PoolClient,
  categories: ColliCategory[],
  sectionIds: Map<string, number>,
) {
  const ids = new Map<string, number>();

  for (const category of ordered(categories)) {
    const sectionId = requireMappedId(sectionIds, category.section_id, "section", category.id);
    const result = await client.query(
      `insert into colli_categories (
        source_id, section_id, name_it, name_en, sort_order, is_active
      ) values ($1, $2, $3, $4, $5, true) returning id`,
      [category.id, sectionId, category.name_it, category.name_en ?? "", sortOrder(category)],
    );
    ids.set(category.id, result.rows[0].id);
  }

  return ids;
}

async function insertAllergens(client: pg.PoolClient, allergens: ColliAllergen[]) {
  const ids = new Map<string, number>();

  for (const allergen of ordered(allergens)) {
    const result = await client.query(
      `insert into colli_allergens (
        source_id, name_it, name_en, sort_order
      ) values ($1, $2, $3, $4) returning id`,
      [allergen.id, allergen.name_it, allergen.name_en ?? "", sortOrder(allergen)],
    );
    ids.set(allergen.id, result.rows[0].id);
  }

  return ids;
}

async function insertItems(
  client: pg.PoolClient,
  dishes: ColliDish[],
  categoryIds: Map<string, number>,
) {
  const ids = new Map<string, number>();

  for (const dish of ordered(dishes)) {
    const categoryId = requireMappedId(categoryIds, dish.category_id, "category", dish.id);
    const result = await client.query(
      `insert into colli_items (
        source_id, category_id, name_it, name_en, subtitle_it, subtitle_en,
        description_it, description_en, extra_info, price, vegetarian, sort_order, is_available
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true) returning id`,
      [
        dish.id,
        categoryId,
        dish.name_it,
        dish.name_en ?? "",
        dish.subtitle_it ?? null,
        dish.subtitle_en ?? null,
        dish.description_it ?? null,
        dish.description_en ?? null,
        dish.extra_info ?? null,
        toNumberOrNull(dish.price),
        Boolean(dish.vegetarian),
        sortOrder(dish),
      ],
    );
    ids.set(dish.id, result.rows[0].id);
  }

  return ids;
}

async function insertItemAllergens(
  client: pg.PoolClient,
  dishes: ColliDish[],
  itemIds: Map<string, number>,
  allergenIds: Map<string, number>,
) {
  for (const dish of dishes) {
    const itemId = requireMappedId(itemIds, dish.id, "item", dish.id);
    const uniqueAllergenIds = [...new Set(dish.allergens ?? [])];

    for (const sourceAllergenId of uniqueAllergenIds) {
      const allergenId = requireMappedId(allergenIds, sourceAllergenId, "allergen", dish.id);
      await client.query(
        `insert into colli_item_allergens (
          item_id, allergen_id
        ) values ($1, $2) on conflict do nothing`,
        [itemId, allergenId],
      );
    }
  }
}

async function insertWineCategories(client: pg.PoolClient, categories: ColliWineCategory[]) {
  const ids = new Map<string, number>();

  for (const category of ordered(categories)) {
    const result = await client.query(
      `insert into colli_wine_categories (
        source_id, name_it, name_en, sort_order, is_active
      ) values ($1, $2, $3, $4, true) returning id`,
      [category.id, category.name_it, category.name_en ?? "", sortOrder(category)],
    );
    ids.set(category.id, result.rows[0].id);
  }

  return ids;
}

async function insertWines(
  client: pg.PoolClient,
  wines: ColliWine[],
  wineCategoryIds: Map<string, number>,
) {
  for (const wine of ordered(wines)) {
    const wineCategoryId = requireMappedId(
      wineCategoryIds,
      wine.wine_category_id,
      "wine category",
      wine.id,
    );
    await client.query(
      `insert into colli_wines (
        source_id, wine_category_id, name_it, name_en, producer, origin, abv,
        price_glass, price_bottle, sort_order, is_available
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [
        wine.id,
        wineCategoryId,
        wine.name_it,
        wine.name_en ?? "",
        wine.producer ?? null,
        wine.origin ?? null,
        toNumberOrNull(wine.abv),
        toNumberOrNull(wine.price_glass),
        toNumberOrNull(wine.price_bottle),
        sortOrder(wine),
      ],
    );
  }
}

async function insertSnapshotAndSettings(
  client: pg.PoolClient,
  source: string,
  checksum: string,
  counts: ReturnType<typeof getColliMenuCounts>,
  menu: ColliMenuPayload,
) {
  await client.query(
    `insert into colli_menu_snapshots (
      status, snapshot, counts, source_checksum, published_by
    ) values ('active', $1, $2, $3, 'migration-script')`,
    [JSON.stringify(menu), JSON.stringify(counts), checksum],
  );

  await client.query(
    `insert into colli_settings (key, value, updated_at)
     values ($1, $2, CURRENT_TIMESTAMP)
     on conflict (key) do update set value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [
      "last_import",
      JSON.stringify({
        source,
        checksum,
        counts,
        importedAt: new Date().toISOString(),
      }),
    ],
  );
}

function ordered<T extends { order?: number | null }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? a.index) - (b.item.order ?? b.index))
    .map(({ item }) => item);
}

function sortOrder(item: { order?: number | null }): number {
  return item.order ?? 0;
}

function requireMappedId(
  ids: Map<string, number>,
  sourceId: string,
  relationName: string,
  ownerId: string,
): number {
  const id = ids.get(sourceId);
  if (!id) {
    throw new Error(`${relationName} ${sourceId} referenced by ${ownerId} was not imported`);
  }

  return id;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
