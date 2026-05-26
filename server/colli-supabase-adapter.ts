import type { QueryResult, QueryResultRow } from "pg";
import {
  getColliMenuCounts,
  sanitizeColliMenuDietaryFlags,
  validateColliMenuPayload,
} from "@shared/colli";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase";

type QueryValues = unknown[];
type SupabaseTable =
  | "colli_sections"
  | "colli_categories"
  | "colli_items"
  | "colli_allergens"
  | "colli_item_allergens"
  | "colli_wine_categories"
  | "colli_wines"
  | "colli_settings"
  | "colli_menu_snapshots";

interface SupabaseQueryResult<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount?: number | null;
}

export function shouldPreferSupabaseColliAdapter() {
  return isSupabaseAdminConfigured && !process.env.SUPABASE_DB_URL;
}

export const supabaseColliPool = {
  async query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: QueryValues,
  ): Promise<QueryResult<T>> {
    return executeSupabaseQuery<T>(queryText, values) as Promise<QueryResult<T>>;
  },
  async connect() {
    return supabaseColliClient;
  },
};

const supabaseColliClient = {
  async query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: QueryValues,
  ): Promise<QueryResult<T>> {
    return executeSupabaseQuery<T>(queryText, values) as Promise<QueryResult<T>>;
  },
  release() {
    // Supabase REST requests are stateless; this keeps the PoolClient surface compatible.
  },
};

export async function fetchColliSnapshotFromSupabaseRest() {
  if (!isSupabaseAdminConfigured) return null;

  const { data, error } = await supabaseAdmin
    .from("colli_menu_snapshots")
    .select("snapshot, source_checksum, published_at")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[colli] Supabase REST snapshot read failed:", error.message);
    return null;
  }

  if (!data?.snapshot) return null;

  const snapshot = sanitizeColliMenuDietaryFlags(validateColliMenuPayload(data.snapshot));
  return {
    ...snapshot,
    metadata: {
      source: "siteccv-supabase-snapshot" as const,
      sourceUrl: "colli_menu_snapshots",
      fetchedAt: new Date().toISOString(),
      counts: getColliMenuCounts(snapshot),
      sections: snapshot.sections.map((section) => ({
        id: section.id,
        nameIt: section.name_it,
        nameEn: section.name_en ?? null,
        slug: null,
        order: section.order ?? null,
      })),
      stale: false,
      englishEnabled: true,
      sourceChecksum: data.source_checksum,
      publishedAt: data.published_at ? new Date(data.published_at).toISOString() : null,
    },
  };
}

async function executeSupabaseQuery<T extends QueryResultRow = QueryResultRow>(
  queryText: string,
  values: QueryValues = [],
): Promise<SupabaseQueryResult<T>> {
  if (!isSupabaseAdminConfigured) {
    throw new Error("Supabase admin client is not configured");
  }

  const query = normalizeQuery(queryText);

  if (
    query === "begin" ||
    query === "commit" ||
    query === "rollback" ||
    query.startsWith("set local ")
  ) {
    return result<T>([]);
  }

  if (query.includes("select value from colli_settings")) {
    const { data, error } = await supabaseAdmin
      .from("colli_settings")
      .select("value")
      .eq("key", values[0])
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return result<T>(data ? [data] : []);
  }

  if (query.includes("(select count(*)::int from colli_sections)")) {
    const [sections, categories, items, wineCategories, wines, allergens, snapshots] =
      await Promise.all([
        countRows("colli_sections"),
        countRows("colli_categories"),
        countRows("colli_items"),
        countRows("colli_wine_categories"),
        countRows("colli_wines"),
        countRows("colli_allergens"),
        countRows("colli_menu_snapshots", "status", "active"),
      ]);

    return result<T>([
      {
        sections,
        categories,
        items,
        wine_categories: wineCategories,
        wines,
        allergens,
        snapshots,
      },
    ]);
  }

  if (
    query.startsWith(
      "select id, name_it, name_en, subtitle_it, subtitle_en, type, sort_order from colli_sections",
    )
  ) {
    return result<T>(
      await selectOrdered(
        "colli_sections",
        "id, name_it, name_en, subtitle_it, subtitle_en, type, sort_order",
      ),
    );
  }

  if (
    query.startsWith("select id, section_id, name_it, name_en, sort_order from colli_categories")
  ) {
    return result<T>(
      await selectOrdered("colli_categories", "id, section_id, name_it, name_en, sort_order"),
    );
  }

  if (query.startsWith("select id, category_id, name_it, name_en, subtitle_it")) {
    return result<T>(
      await selectOrdered(
        "colli_items",
        "id, category_id, name_it, name_en, subtitle_it, subtitle_en, description_it, description_en, extra_info, price, vegetarian, gluten_free, sort_order",
      ),
    );
  }

  if (query.startsWith("select id, name_it, name_en, sort_order from colli_allergens")) {
    return result<T>(await selectOrdered("colli_allergens", "id, name_it, name_en, sort_order"));
  }

  if (query.startsWith("select item_id, allergen_id from colli_item_allergens")) {
    const { data, error } = await supabaseAdmin
      .from("colli_item_allergens")
      .select("item_id, allergen_id")
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);
    return result<T>(data ?? []);
  }

  if (query.startsWith("select id, name_it, name_en, sort_order from colli_wine_categories")) {
    return result<T>(
      await selectOrdered("colli_wine_categories", "id, name_it, name_en, sort_order"),
    );
  }

  if (query.startsWith("select id, wine_category_id, name_it, name_en")) {
    return result<T>(
      await selectOrdered(
        "colli_wines",
        "id, wine_category_id, name_it, name_en, producer, origin, abv, price_glass, price_bottle, sort_order",
      ),
    );
  }

  if (query.startsWith("select type from colli_sections where id = $1")) {
    const { data, error } = await supabaseAdmin
      .from("colli_sections")
      .select("type")
      .eq("id", values[0])
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return result<T>(data ? [data] : []);
  }

  if (query.startsWith("select coalesce(max(sort_order), -1) + 1 as next from ")) {
    return result<T>([{ next: await getNextSortOrder(query, values) }]);
  }

  const writeResult = await executeWriteQuery(query, values);
  if (writeResult) return result<T>(writeResult);

  throw new Error(`Unsupported Supabase Colli query: ${query}`);
}

async function executeWriteQuery(
  query: string,
  values: QueryValues,
): Promise<QueryResultRow[] | null> {
  if (query.startsWith("update colli_sections set sort_order")) {
    await updateById("colli_sections", values[0], { sort_order: values[1], updated_at: now() });
    return [];
  }

  if (query.startsWith("insert into colli_sections")) {
    await insertRow("colli_sections", {
      name_it: values[0],
      name_en: values[1],
      subtitle_it: values[2],
      subtitle_en: values[3],
      type: values[4],
      sort_order: values[5],
      is_active: true,
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("update colli_sections set name_it")) {
    await updateById("colli_sections", values[0], {
      name_it: values[1],
      name_en: values[2],
      subtitle_it: values[3],
      subtitle_en: values[4],
      type: values[5],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("delete from colli_sections")) {
    await deleteById("colli_sections", values[0]);
    return [];
  }

  if (query.startsWith("update colli_categories set sort_order")) {
    await updateById("colli_categories", values[0], { sort_order: values[1], updated_at: now() });
    return [];
  }

  if (query.startsWith("insert into colli_categories")) {
    await insertRow("colli_categories", {
      section_id: values[0],
      name_it: values[1],
      name_en: values[2],
      sort_order: values[3],
      is_active: true,
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("update colli_categories")) {
    await updateById("colli_categories", values[0], {
      name_it: values[1],
      name_en: values[2],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("delete from colli_categories")) {
    await deleteById("colli_categories", values[0]);
    return [];
  }

  if (query.startsWith("update colli_items set sort_order")) {
    await updateById("colli_items", values[0], { sort_order: values[1], updated_at: now() });
    return [];
  }

  if (query.startsWith("update colli_items set name_it")) {
    await updateById("colli_items", values[0], {
      name_it: values[1],
      name_en: values[2],
      subtitle_it: values[3],
      subtitle_en: values[4],
      description_it: values[5],
      description_en: values[6],
      extra_info: values[7],
      price: values[8],
      vegetarian: values[9],
      gluten_free: values[10],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("insert into colli_items")) {
    const row = await insertRow("colli_items", {
      category_id: values[0],
      name_it: values[1],
      name_en: values[2],
      subtitle_it: values[3],
      subtitle_en: values[4],
      description_it: values[5],
      description_en: values[6],
      extra_info: values[7],
      price: values[8],
      vegetarian: values[9],
      gluten_free: values[10],
      sort_order: values[11],
      is_available: true,
      updated_at: now(),
    });
    return [{ id: row.id }];
  }

  if (query.startsWith("delete from colli_items")) {
    await deleteById("colli_items", values[0]);
    return [];
  }

  if (query.startsWith("delete from colli_item_allergens where item_id")) {
    const { error } = await supabaseAdmin
      .from("colli_item_allergens")
      .delete()
      .eq("item_id", values[0]);
    if (error) throw new Error(error.message);
    return [];
  }

  if (query.startsWith("insert into colli_item_allergens")) {
    const { error } = await supabaseAdmin
      .from("colli_item_allergens")
      .upsert(
        { item_id: values[0], allergen_id: values[1] },
        { onConflict: "item_id,allergen_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return [];
  }

  if (query.startsWith("update colli_wine_categories set sort_order")) {
    await updateById("colli_wine_categories", values[0], {
      sort_order: values[1],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("insert into colli_wine_categories")) {
    await insertRow("colli_wine_categories", {
      name_it: values[0],
      name_en: values[1],
      sort_order: values[2],
      is_active: true,
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("update colli_wine_categories")) {
    await updateById("colli_wine_categories", values[0], {
      name_it: values[1],
      name_en: values[2],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("delete from colli_wine_categories")) {
    await deleteById("colli_wine_categories", values[0]);
    return [];
  }

  if (query.startsWith("update colli_wines set sort_order")) {
    await updateById("colli_wines", values[0], { sort_order: values[1], updated_at: now() });
    return [];
  }

  if (query.startsWith("insert into colli_wines")) {
    await insertRow("colli_wines", {
      wine_category_id: values[0],
      name_it: values[1],
      name_en: values[2],
      producer: values[3],
      origin: values[4],
      abv: values[5],
      price_glass: values[6],
      price_bottle: values[7],
      sort_order: values[8],
      is_available: true,
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("update colli_wines")) {
    await updateById("colli_wines", values[0], {
      name_it: values[1],
      name_en: values[2],
      producer: values[3],
      origin: values[4],
      abv: values[5],
      price_glass: values[6],
      price_bottle: values[7],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("delete from colli_wines")) {
    await deleteById("colli_wines", values[0]);
    return [];
  }

  if (query.startsWith("insert into colli_allergens")) {
    await insertRow("colli_allergens", {
      name_it: values[0],
      name_en: values[1],
      sort_order: values[2],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("update colli_allergens")) {
    await updateById("colli_allergens", values[0], {
      name_it: values[1],
      name_en: values[2],
      updated_at: now(),
    });
    return [];
  }

  if (query.startsWith("delete from colli_allergens")) {
    await deleteById("colli_allergens", values[0]);
    return [];
  }

  if (query.startsWith("update colli_menu_snapshots set status = 'archived'")) {
    const { error } = await supabaseAdmin
      .from("colli_menu_snapshots")
      .update({ status: "archived" })
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return [];
  }

  if (query.startsWith("insert into colli_menu_snapshots")) {
    await insertRow("colli_menu_snapshots", {
      status: "active",
      snapshot: parseJson(values[0]),
      counts: parseJson(values[1]),
      source_checksum: values[2],
      published_by: "colli-admin",
    });
    return [];
  }

  return null;
}

async function countRows(table: SupabaseTable, column?: string, value?: unknown) {
  let query = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  if (column) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function selectOrdered(table: SupabaseTable, columns: string) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(columns)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getNextSortOrder(query: string, values: QueryValues) {
  const table = extractTableName(query);
  const parentColumn = query.includes(" where section_id = $1")
    ? "section_id"
    : query.includes(" where category_id = $1")
      ? "category_id"
      : query.includes(" where wine_category_id = $1")
        ? "wine_category_id"
        : null;

  let builder = supabaseAdmin
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (parentColumn) builder = builder.eq(parentColumn, values[0]);
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return Number(data?.[0]?.sort_order ?? -1) + 1;
}

async function insertRow(table: SupabaseTable, row: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.from(table).insert(row).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateById(table: SupabaseTable, id: unknown, row: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from(table).update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

async function deleteById(table: SupabaseTable, id: unknown) {
  const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function extractTableName(query: string): SupabaseTable {
  const match = query.match(/ from (colli_[a-z_]+)/);
  if (!match) throw new Error(`Unable to extract table name from query: ${query}`);
  return match[1] as SupabaseTable;
}

function parseJson(value: unknown) {
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

function normalizeQuery(queryText: string) {
  return queryText.replace(/\s+/g, " ").trim().toLowerCase();
}

function now() {
  return new Date().toISOString();
}

function result<T extends QueryResultRow>(rows: QueryResultRow[]): SupabaseQueryResult<T> {
  return { rows: rows as T[], rowCount: rows.length };
}
