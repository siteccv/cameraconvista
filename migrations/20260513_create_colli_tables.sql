-- CCV Colli dedicated schema.
-- Prepared migration only: do not apply without backup, review and explicit approval.

BEGIN;

CREATE TABLE IF NOT EXISTS colli_sections (
  id serial PRIMARY KEY,
  source_id text,
  name_it text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  subtitle_it text,
  subtitle_en text,
  type text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_sections_source_id_idx
  ON colli_sections (source_id);
CREATE INDEX IF NOT EXISTS colli_sections_sort_order_idx
  ON colli_sections (sort_order);

CREATE TABLE IF NOT EXISTS colli_categories (
  id serial PRIMARY KEY,
  source_id text,
  section_id integer NOT NULL REFERENCES colli_sections(id) ON DELETE CASCADE,
  name_it text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_categories_source_id_idx
  ON colli_categories (source_id);
CREATE INDEX IF NOT EXISTS colli_categories_section_id_idx
  ON colli_categories (section_id);
CREATE INDEX IF NOT EXISTS colli_categories_sort_order_idx
  ON colli_categories (sort_order);

CREATE TABLE IF NOT EXISTS colli_items (
  id serial PRIMARY KEY,
  source_id text,
  category_id integer NOT NULL REFERENCES colli_categories(id) ON DELETE CASCADE,
  name_it text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  subtitle_it text,
  subtitle_en text,
  description_it text,
  description_en text,
  extra_info text,
  price numeric(10, 2),
  vegetarian boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_items_source_id_idx
  ON colli_items (source_id);
CREATE INDEX IF NOT EXISTS colli_items_category_id_idx
  ON colli_items (category_id);
CREATE INDEX IF NOT EXISTS colli_items_sort_order_idx
  ON colli_items (sort_order);

CREATE TABLE IF NOT EXISTS colli_allergens (
  id serial PRIMARY KEY,
  source_id text,
  name_it text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_allergens_source_id_idx
  ON colli_allergens (source_id);
CREATE INDEX IF NOT EXISTS colli_allergens_sort_order_idx
  ON colli_allergens (sort_order);

CREATE TABLE IF NOT EXISTS colli_item_allergens (
  id serial PRIMARY KEY,
  item_id integer NOT NULL REFERENCES colli_items(id) ON DELETE CASCADE,
  allergen_id integer NOT NULL REFERENCES colli_allergens(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_item_allergens_unique_idx
  ON colli_item_allergens (item_id, allergen_id);
CREATE INDEX IF NOT EXISTS colli_item_allergens_item_id_idx
  ON colli_item_allergens (item_id);
CREATE INDEX IF NOT EXISTS colli_item_allergens_allergen_id_idx
  ON colli_item_allergens (allergen_id);

CREATE TABLE IF NOT EXISTS colli_wine_categories (
  id serial PRIMARY KEY,
  source_id text,
  name_it text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_wine_categories_source_id_idx
  ON colli_wine_categories (source_id);
CREATE INDEX IF NOT EXISTS colli_wine_categories_sort_order_idx
  ON colli_wine_categories (sort_order);

CREATE TABLE IF NOT EXISTS colli_wines (
  id serial PRIMARY KEY,
  source_id text,
  wine_category_id integer NOT NULL REFERENCES colli_wine_categories(id) ON DELETE CASCADE,
  name_it text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  producer text,
  origin text,
  abv numeric(5, 2),
  price_glass numeric(10, 2),
  price_bottle numeric(10, 2),
  sort_order integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS colli_wines_source_id_idx
  ON colli_wines (source_id);
CREATE INDEX IF NOT EXISTS colli_wines_wine_category_id_idx
  ON colli_wines (wine_category_id);
CREATE INDEX IF NOT EXISTS colli_wines_sort_order_idx
  ON colli_wines (sort_order);

CREATE TABLE IF NOT EXISTS colli_settings (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colli_menu_snapshots (
  id serial PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  snapshot jsonb NOT NULL,
  counts jsonb,
  source_checksum text,
  published_by text,
  published_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS colli_menu_snapshots_status_idx
  ON colli_menu_snapshots (status);
CREATE INDEX IF NOT EXISTS colli_menu_snapshots_published_at_idx
  ON colli_menu_snapshots (published_at);

COMMIT;
