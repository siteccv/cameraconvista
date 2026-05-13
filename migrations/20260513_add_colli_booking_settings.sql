-- Add the public Colli booking phone setting used by the /colli Prenota CTA.
-- This does not affect the Colli digital menu tables or the dedicated Colli admin.

INSERT INTO site_settings (key, value_it, value_en, updated_at)
VALUES (
  'colli_booking_settings',
  '{"phoneNumber":"+393335345751"}',
  '{"phoneNumber":"+393335345751"}',
  now()
)
ON CONFLICT (key) DO UPDATE
SET
  value_it = COALESCE(site_settings.value_it, EXCLUDED.value_it),
  value_en = COALESCE(site_settings.value_en, EXCLUDED.value_en),
  updated_at = now();
