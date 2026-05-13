import { createHash } from "node:crypto";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import {
  getColliMenuCounts,
  type ColliMenuPayload,
  type ColliSection,
  type ColliCategory,
  type ColliDish,
  type ColliAllergen,
  type ColliWineCategory,
  type ColliWine,
} from "@shared/colli";
import { pool } from "../db";
import { storage } from "../storage";
import { invalidateColliMenuCache } from "./colli";
import { generateSessionToken, isAuthenticated, SESSION_MAX_AGE_MS } from "./helpers";

const COLLI_ADMIN_COOKIE_NAME = "ccv_colli_admin_session";
const COLLI_ADMIN_PASSWORD_KEY = "admin_password_hash";

type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
};

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Troppi tentativi di login. Riprova tra 15 minuti." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const colliAdminRouter = Router();

colliAdminRouter.post(
  "/login",
  loginLimiter,
  asyncRoute(async (req, res) => {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const passwordHash = await getColliAdminPasswordHash();

    if (!(await bcrypt.compare(password, passwordHash))) {
      res.status(401).json({ success: false, error: "Invalid password" });
      return;
    }

    const sessionToken = `colli_${generateSessionToken()}`;
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
    await storage.createAdminSession({ id: sessionToken, expiresAt });

    res.cookie(COLLI_ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/",
    });

    res.json({ success: true });
  }),
);

colliAdminRouter.post(
  "/logout",
  asyncRoute(async (req, res) => {
    const sessionToken = req.cookies?.[COLLI_ADMIN_COOKIE_NAME];
    if (sessionToken) {
      await storage.deleteAdminSession(sessionToken);
    }

    res.clearCookie(COLLI_ADMIN_COOKIE_NAME, { path: "/" });
    res.json({ success: true });
  }),
);

colliAdminRouter.get(
  "/check-session",
  asyncRoute(async (req, res) => {
    res.json({ authenticated: await isColliAdminAuthenticated(req) });
  }),
);

colliAdminRouter.get(
  "/summary",
  requireColliAdmin,
  asyncRoute(async (_req, res) => {
    const dbPool = requirePool();
    const result = await dbPool.query(`
      select
        (select count(*)::int from colli_sections) as sections,
        (select count(*)::int from colli_categories) as categories,
        (select count(*)::int from colli_items) as items,
        (select count(*)::int from colli_wine_categories) as wine_categories,
        (select count(*)::int from colli_wines) as wines,
        (select count(*)::int from colli_allergens) as allergens,
        (select count(*)::int from colli_menu_snapshots where status = 'active') as snapshots
    `);

    res.json(result.rows[0]);
  }),
);

colliAdminRouter.get(
  "/menu",
  requireColliAdmin,
  asyncRoute(async (_req, res) => {
    res.json(await loadColliMenuFromTables(requirePool()));
  }),
);

colliAdminRouter.put(
  "/sections/reorder",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      await reorderByIds(client, "colli_sections", parseIds(req.body?.ids));
    });
  }),
);

colliAdminRouter.post(
  "/sections",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const nameIt = requiredText(req.body?.name_it, "name_it");
      const nameEn = optionalText(req.body?.name_en) || nameIt;
      const nextOrder = await nextSortOrder(client, "colli_sections");

      await client.query(
        `insert into colli_sections (
          name_it, name_en, subtitle_it, subtitle_en, type, sort_order, is_active, updated_at
        ) values ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)`,
        [
          nameIt,
          nameEn,
          optionalText(req.body?.subtitle_it),
          optionalText(req.body?.subtitle_en),
          optionalText(req.body?.type),
          nextOrder,
        ],
      );
    });
  }),
);

colliAdminRouter.put(
  "/sections/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const id = parseId(req.params.id);
      const existing = await client.query<{ type: string | null }>(
        "select type from colli_sections where id = $1",
        [id],
      );
      if (!existing.rows[0]) throw new HttpError(404, "Section not found");

      await client.query(
        `update colli_sections
         set name_it = $2, name_en = $3, subtitle_it = $4, subtitle_en = $5,
             type = $6, updated_at = CURRENT_TIMESTAMP
         where id = $1`,
        [
          id,
          requiredText(req.body?.name_it, "name_it"),
          optionalText(req.body?.name_en) || requiredText(req.body?.name_it, "name_it"),
          optionalText(req.body?.subtitle_it),
          optionalText(req.body?.subtitle_en),
          existing.rows[0].type === "wine" ? "wine" : optionalText(req.body?.type),
        ],
      );
    });
  }),
);

colliAdminRouter.delete(
  "/sections/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await requireDeletePin(req);
    await mutateMenu(res, async (client) => {
      const id = parseId(req.params.id);
      const existing = await client.query<{ type: string | null }>(
        "select type from colli_sections where id = $1",
        [id],
      );
      if (!existing.rows[0]) throw new HttpError(404, "Section not found");
      if (existing.rows[0].type === "wine") {
        throw new HttpError(403, "La sezione Vini non puo essere eliminata.");
      }

      await client.query("delete from colli_sections where id = $1", [id]);
    });
  }),
);

colliAdminRouter.put(
  "/categories/reorder",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      await reorderByIds(client, "colli_categories", parseIds(req.body?.ids));
    });
  }),
);

colliAdminRouter.post(
  "/categories",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const sectionId = parseId(req.body?.section_id);
      const nameIt = requiredText(req.body?.name_it, "name_it");
      const nameEn = optionalText(req.body?.name_en) || nameIt;
      const nextOrder = await nextSortOrder(client, "colli_categories", "section_id", sectionId);

      await client.query(
        `insert into colli_categories (
          section_id, name_it, name_en, sort_order, is_active, updated_at
        ) values ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)`,
        [sectionId, nameIt, nameEn, nextOrder],
      );
    });
  }),
);

colliAdminRouter.put(
  "/categories/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const id = parseId(req.params.id);
      const nameIt = requiredText(req.body?.name_it, "name_it");
      await client.query(
        `update colli_categories
         set name_it = $2, name_en = $3, updated_at = CURRENT_TIMESTAMP
         where id = $1`,
        [id, nameIt, optionalText(req.body?.name_en) || nameIt],
      );
    });
  }),
);

colliAdminRouter.delete(
  "/categories/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await requireDeletePin(req);
    await mutateMenu(res, async (client) => {
      await client.query("delete from colli_categories where id = $1", [parseId(req.params.id)]);
    });
  }),
);

colliAdminRouter.put(
  "/items/reorder",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      await reorderByIds(client, "colli_items", parseIds(req.body?.ids));
    });
  }),
);

colliAdminRouter.post(
  "/items",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const categoryId = parseId(req.body?.category_id);
      const nextOrder = await nextSortOrder(client, "colli_items", "category_id", categoryId);
      const itemId = await upsertItem(client, null, req.body, categoryId, nextOrder);
      await replaceItemAllergens(client, itemId, req.body?.allergens);
    });
  }),
);

colliAdminRouter.put(
  "/items/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const itemId = parseId(req.params.id);
      await upsertItem(client, itemId, req.body);
      await replaceItemAllergens(client, itemId, req.body?.allergens);
    });
  }),
);

colliAdminRouter.delete(
  "/items/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await requireDeletePin(req);
    await mutateMenu(res, async (client) => {
      await client.query("delete from colli_items where id = $1", [parseId(req.params.id)]);
    });
  }),
);

colliAdminRouter.put(
  "/wine-categories/reorder",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      await reorderByIds(client, "colli_wine_categories", parseIds(req.body?.ids));
    });
  }),
);

colliAdminRouter.post(
  "/wine-categories",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const nameIt = requiredText(req.body?.name_it, "name_it");
      const nextOrder = await nextSortOrder(client, "colli_wine_categories");
      await client.query(
        `insert into colli_wine_categories (
          name_it, name_en, sort_order, is_active, updated_at
        ) values ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
        [nameIt, optionalText(req.body?.name_en) || nameIt, nextOrder],
      );
    });
  }),
);

colliAdminRouter.put(
  "/wine-categories/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const nameIt = requiredText(req.body?.name_it, "name_it");
      await client.query(
        `update colli_wine_categories
         set name_it = $2, name_en = $3, updated_at = CURRENT_TIMESTAMP
         where id = $1`,
        [parseId(req.params.id), nameIt, optionalText(req.body?.name_en) || nameIt],
      );
    });
  }),
);

colliAdminRouter.delete(
  "/wine-categories/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await requireDeletePin(req);
    await mutateMenu(res, async (client) => {
      await client.query("delete from colli_wine_categories where id = $1", [
        parseId(req.params.id),
      ]);
    });
  }),
);

colliAdminRouter.put(
  "/wines/reorder",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      await reorderByIds(client, "colli_wines", parseIds(req.body?.ids));
    });
  }),
);

colliAdminRouter.post(
  "/wines",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const wineCategoryId = parseId(req.body?.wine_category_id);
      const nameIt = requiredText(req.body?.name_it, "name_it");
      const nextOrder = await nextSortOrder(
        client,
        "colli_wines",
        "wine_category_id",
        wineCategoryId,
      );

      await client.query(
        `insert into colli_wines (
          wine_category_id, name_it, name_en, producer, origin, abv,
          price_glass, price_bottle, sort_order, is_available, updated_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP)`,
        [
          wineCategoryId,
          nameIt,
          optionalText(req.body?.name_en) || nameIt,
          optionalText(req.body?.producer),
          optionalText(req.body?.origin),
          toNumberOrNull(req.body?.abv),
          toNumberOrNull(req.body?.price_glass),
          toNumberOrNull(req.body?.price_bottle),
          nextOrder,
        ],
      );
    });
  }),
);

colliAdminRouter.put(
  "/wines/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const nameIt = requiredText(req.body?.name_it, "name_it");
      await client.query(
        `update colli_wines
         set name_it = $2, name_en = $3, producer = $4, origin = $5,
             abv = $6, price_glass = $7, price_bottle = $8, updated_at = CURRENT_TIMESTAMP
         where id = $1`,
        [
          parseId(req.params.id),
          nameIt,
          optionalText(req.body?.name_en) || nameIt,
          optionalText(req.body?.producer),
          optionalText(req.body?.origin),
          toNumberOrNull(req.body?.abv),
          toNumberOrNull(req.body?.price_glass),
          toNumberOrNull(req.body?.price_bottle),
        ],
      );
    });
  }),
);

colliAdminRouter.delete(
  "/wines/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await requireDeletePin(req);
    await mutateMenu(res, async (client) => {
      await client.query("delete from colli_wines where id = $1", [parseId(req.params.id)]);
    });
  }),
);

colliAdminRouter.post(
  "/allergens",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const nameIt = requiredText(req.body?.name_it, "name_it");
      const nextOrder = await nextSortOrder(client, "colli_allergens");
      await client.query(
        `insert into colli_allergens (
          name_it, name_en, sort_order, updated_at
        ) values ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [nameIt, optionalText(req.body?.name_en) || nameIt, nextOrder],
      );
    });
  }),
);

colliAdminRouter.put(
  "/allergens/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await mutateMenu(res, async (client) => {
      const nameIt = requiredText(req.body?.name_it, "name_it");
      await client.query(
        `update colli_allergens
         set name_it = $2, name_en = $3, updated_at = CURRENT_TIMESTAMP
         where id = $1`,
        [parseId(req.params.id), nameIt, optionalText(req.body?.name_en) || nameIt],
      );
    });
  }),
);

colliAdminRouter.delete(
  "/allergens/:id",
  requireColliAdmin,
  asyncRoute(async (req, res) => {
    await requireDeletePin(req);
    await mutateMenu(res, async (client) => {
      await client.query("delete from colli_allergens where id = $1", [parseId(req.params.id)]);
    });
  }),
);

async function upsertItem(
  client: PoolClient,
  id: number | null,
  body: Record<string, unknown>,
  categoryId?: number,
  sortOrder?: number,
): Promise<number> {
  const nameIt = requiredText(body?.name_it, "name_it");
  const nameEn = optionalText(body?.name_en) || nameIt;
  const values = [
    categoryId,
    nameIt,
    nameEn,
    optionalText(body?.subtitle_it),
    optionalText(body?.subtitle_en),
    optionalText(body?.description_it),
    optionalText(body?.description_en),
    optionalText(body?.extra_info),
    toNumberOrNull(body?.price),
    Boolean(body?.vegetarian),
    sortOrder,
  ];

  if (id) {
    await client.query(
      `update colli_items
       set name_it = $2, name_en = $3, subtitle_it = $4, subtitle_en = $5,
           description_it = $6, description_en = $7, extra_info = $8,
           price = $9, vegetarian = $10, updated_at = CURRENT_TIMESTAMP
       where id = $1`,
      [
        id,
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8],
        values[9],
      ],
    );
    return id;
  }

  if (!categoryId || sortOrder == null) {
    throw new HttpError(400, "category_id required");
  }

  const result = await client.query<{ id: number }>(
    `insert into colli_items (
      category_id, name_it, name_en, subtitle_it, subtitle_en, description_it, description_en,
      extra_info, price, vegetarian, sort_order, is_available, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, CURRENT_TIMESTAMP)
    returning id`,
    values,
  );
  return result.rows[0].id;
}

async function replaceItemAllergens(client: PoolClient, itemId: number, value: unknown) {
  const ids = Array.isArray(value) ? value.map(parseId) : [];
  await client.query("delete from colli_item_allergens where item_id = $1", [itemId]);

  const uniqueIds = Array.from(new Set(ids));
  for (let index = 0; index < uniqueIds.length; index += 1) {
    const allergenId = uniqueIds[index];
    await client.query(
      `insert into colli_item_allergens (item_id, allergen_id)
       values ($1, $2)
       on conflict do nothing`,
      [itemId, allergenId],
    );
  }
}

async function loadColliMenuFromTables(db: Queryable): Promise<ColliMenuPayload> {
  const [
    sectionsResult,
    categoriesResult,
    itemsResult,
    allergensResult,
    itemAllergensResult,
    wineCategoriesResult,
    winesResult,
  ] = await Promise.all([
    db.query<ColliSectionRow>(
      `select id, name_it, name_en, subtitle_it, subtitle_en, type, sort_order
       from colli_sections
       order by sort_order, id`,
    ),
    db.query<ColliCategoryRow>(
      `select id, section_id, name_it, name_en, sort_order
       from colli_categories
       order by sort_order, id`,
    ),
    db.query<ColliItemRow>(
      `select id, category_id, name_it, name_en, subtitle_it, subtitle_en, description_it,
              description_en, extra_info, price, vegetarian, sort_order
       from colli_items
       order by sort_order, id`,
    ),
    db.query<ColliAllergenRow>(
      `select id, name_it, name_en, sort_order
       from colli_allergens
       order by sort_order, id`,
    ),
    db.query<ColliItemAllergenRow>(
      `select item_id, allergen_id
       from colli_item_allergens
       order by id`,
    ),
    db.query<ColliWineCategoryRow>(
      `select id, name_it, name_en, sort_order
       from colli_wine_categories
       order by sort_order, id`,
    ),
    db.query<ColliWineRow>(
      `select id, wine_category_id, name_it, name_en, producer, origin, abv,
              price_glass, price_bottle, sort_order
       from colli_wines
       order by sort_order, id`,
    ),
  ]);

  const itemAllergens = new Map<number, string[]>();
  for (const row of itemAllergensResult.rows) {
    const next = itemAllergens.get(row.item_id) ?? [];
    next.push(String(row.allergen_id));
    itemAllergens.set(row.item_id, next);
  }

  return {
    sections: sectionsResult.rows.map(
      (row): ColliSection => ({
        id: String(row.id),
        name_it: row.name_it,
        name_en: row.name_en,
        subtitle_it: row.subtitle_it,
        subtitle_en: row.subtitle_en,
        type: row.type,
        order: row.sort_order,
      }),
    ),
    categories: categoriesResult.rows.map(
      (row): ColliCategory => ({
        id: String(row.id),
        section_id: String(row.section_id),
        name_it: row.name_it,
        name_en: row.name_en,
        order: row.sort_order,
      }),
    ),
    dishes: itemsResult.rows.map(
      (row): ColliDish => ({
        id: String(row.id),
        category_id: String(row.category_id),
        name_it: row.name_it,
        name_en: row.name_en,
        subtitle_it: row.subtitle_it,
        subtitle_en: row.subtitle_en,
        description_it: row.description_it,
        description_en: row.description_en,
        extra_info: row.extra_info,
        price: toNumberOrNull(row.price),
        vegetarian: row.vegetarian,
        allergens: itemAllergens.get(row.id) ?? [],
        order: row.sort_order,
      }),
    ),
    wineCategories: wineCategoriesResult.rows.map(
      (row): ColliWineCategory => ({
        id: String(row.id),
        name_it: row.name_it,
        name_en: row.name_en,
        order: row.sort_order,
      }),
    ),
    wines: winesResult.rows.map(
      (row): ColliWine => ({
        id: String(row.id),
        wine_category_id: String(row.wine_category_id),
        name_it: row.name_it,
        name_en: row.name_en,
        producer: row.producer,
        origin: row.origin,
        abv: toNumberOrNull(row.abv),
        price_glass: toNumberOrNull(row.price_glass),
        price_bottle: toNumberOrNull(row.price_bottle),
        order: row.sort_order,
      }),
    ),
    allergens: allergensResult.rows.map(
      (row): ColliAllergen => ({
        id: String(row.id),
        name_it: row.name_it,
        name_en: row.name_en,
      }),
    ),
  };
}

async function publishColliSnapshot(client: PoolClient): Promise<ColliMenuPayload> {
  const menu = await loadColliMenuFromTables(client);
  const counts = getColliMenuCounts(menu);
  const serialized = JSON.stringify(menu);
  const checksum = createHash("sha256").update(serialized).digest("hex");

  await client.query("update colli_menu_snapshots set status = 'archived' where status = 'active'");
  await client.query(
    `insert into colli_menu_snapshots (
      status, snapshot, counts, source_checksum, published_by
    ) values ('active', $1, $2, $3, 'colli-admin')`,
    [serialized, JSON.stringify(counts), checksum],
  );

  return menu;
}

async function mutateMenu(res: Response, mutation: (client: PoolClient) => Promise<void>) {
  const dbPool = requirePool();
  const client = await dbPool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await mutation(client);
    const menu = await publishColliSnapshot(client);
    await client.query("COMMIT");
    invalidateColliMenuCache();
    res.json(menu);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function reorderByIds(client: PoolClient, table: ReorderTable, ids: number[]) {
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    await client.query(
      `update ${table} set sort_order = $2, updated_at = CURRENT_TIMESTAMP where id = $1`,
      [id, index],
    );
  }
}

async function nextSortOrder(
  client: PoolClient,
  table: SortableTable,
  parentColumn?: "section_id" | "category_id" | "wine_category_id",
  parentId?: number,
): Promise<number> {
  if (parentColumn && parentId) {
    const result = await client.query<{ next: number }>(
      `select coalesce(max(sort_order), -1) + 1 as next from ${table} where ${parentColumn} = $1`,
      [parentId],
    );
    return result.rows[0]?.next ?? 0;
  }

  const result = await client.query<{ next: number }>(
    `select coalesce(max(sort_order), -1) + 1 as next from ${table}`,
  );
  return result.rows[0]?.next ?? 0;
}

async function requireDeletePin(req: Request) {
  const pin = typeof req.body?.pin === "string" ? req.body.pin : "";
  const passwordHash = await getColliAdminPasswordHash();

  if (!(await bcrypt.compare(pin, passwordHash))) {
    throw new HttpError(403, "PIN non corretto");
  }
}

async function getColliAdminPasswordHash(): Promise<string> {
  const dbPool = requirePool();
  const result = await dbPool.query<{ value: unknown }>(
    "select value from colli_settings where key = $1 limit 1",
    [COLLI_ADMIN_PASSWORD_KEY],
  );
  const storedValue = result.rows[0]?.value;

  if (typeof storedValue === "string" && isBcryptHash(storedValue)) {
    return storedValue;
  }

  if (storedValue && typeof storedValue === "object" && "hash" in storedValue) {
    const hash = (storedValue as { hash?: unknown }).hash;
    if (typeof hash === "string" && isBcryptHash(hash)) {
      return hash;
    }
  }

  throw new Error("Colli admin password hash not configured");
}

async function isColliAdminAuthenticated(req: Request): Promise<boolean> {
  if (await isAuthenticated(req)) return true;

  const sessionToken = req.cookies?.[COLLI_ADMIN_COOKIE_NAME];
  if (!sessionToken) return false;

  const session = await storage.getAdminSession(sessionToken);
  return !!session;
}

async function requireColliAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(await isColliAdminAuthenticated(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function requirePool() {
  if (!pool) throw new HttpError(503, "Database unavailable");
  return pool;
}

function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleRouteError(error, res);
    }
  };
}

function handleRouteError(error: unknown, res: Response) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";

  if (status >= 500) {
    console.error("[colli-admin] Request failed:", error);
  }

  res.status(status).json({ error: message });
}

function parseIds(value: unknown): number[] {
  if (!Array.isArray(value)) throw new HttpError(400, "ids must be an array");
  return value.map(parseId);
}

function parseId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid id");
  }
  return id;
}

function requiredText(value: unknown, field: string): string {
  const text = optionalText(value);
  if (!text) throw new HttpError(400, `${field} required`);
  return text;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}

type ReorderTable =
  | "colli_sections"
  | "colli_categories"
  | "colli_items"
  | "colli_wine_categories"
  | "colli_wines";

type SortableTable = ReorderTable | "colli_allergens";

interface ColliSectionRow {
  id: number;
  name_it: string;
  name_en: string;
  subtitle_it: string | null;
  subtitle_en: string | null;
  type: string | null;
  sort_order: number;
}

interface ColliCategoryRow {
  id: number;
  section_id: number;
  name_it: string;
  name_en: string;
  sort_order: number;
}

interface ColliItemRow {
  id: number;
  category_id: number;
  name_it: string;
  name_en: string;
  subtitle_it: string | null;
  subtitle_en: string | null;
  description_it: string | null;
  description_en: string | null;
  extra_info: string | null;
  price: string | number | null;
  vegetarian: boolean;
  sort_order: number;
}

interface ColliAllergenRow {
  id: number;
  name_it: string;
  name_en: string;
  sort_order: number;
}

interface ColliItemAllergenRow {
  item_id: number;
  allergen_id: number;
}

interface ColliWineCategoryRow {
  id: number;
  name_it: string;
  name_en: string;
  sort_order: number;
}

interface ColliWineRow {
  id: number;
  wine_category_id: number;
  name_it: string;
  name_en: string;
  producer: string | null;
  origin: string | null;
  abv: string | number | null;
  price_glass: string | number | null;
  price_bottle: string | number | null;
  sort_order: number;
}
