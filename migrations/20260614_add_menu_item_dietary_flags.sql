ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS vegetarian boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gluten_free boolean NOT NULL DEFAULT false;
