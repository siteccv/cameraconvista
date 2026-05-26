-- CCV Colli: dedicated gluten-free flag for dishes.
-- Prepared migration only: do not apply without backup, review and explicit approval.

BEGIN;

ALTER TABLE IF EXISTS colli_items
  ADD COLUMN IF NOT EXISTS gluten_free boolean NOT NULL DEFAULT false;

COMMIT;
