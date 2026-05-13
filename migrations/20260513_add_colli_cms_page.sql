-- Add the public Colli showcase page to the SITE-CCV CMS.
-- Review before running. This migration is intentionally separate from Colli menu data tables.

-- Keep serial sequences ahead of existing rows without lowering them.
SELECT setval(
  'pages_id_seq',
  GREATEST(
    (SELECT COALESCE(MAX(id), 0) FROM pages),
    (SELECT last_value FROM pages_id_seq)
  ),
  true
);

SELECT setval(
  'page_blocks_id_seq',
  GREATEST(
    (SELECT COALESCE(MAX(id), 0) FROM page_blocks),
    (SELECT last_value FROM page_blocks_id_seq)
  ),
  true
);

DO $$
DECLARE
  existing_colli_id integer;
BEGIN
  SELECT id INTO existing_colli_id FROM pages WHERE slug = 'colli';

  IF existing_colli_id IS NULL THEN
    INSERT INTO pages (
      slug,
      title_it,
      title_en,
      meta_title_it,
      meta_title_en,
      meta_description_it,
      meta_description_en,
      is_visible,
      is_draft,
      published_at,
      sort_order
    )
    VALUES (
      'colli',
      'Colli',
      'Colli',
      'Camera con Vista Colli',
      'Camera con Vista Colli',
      'Camera con Vista Colli: spazio all''aperto con food, drinks e vini. Apri il menu digitale dedicato.',
      'Camera con Vista Colli: an outdoor place for food, drinks and wines. Open the dedicated digital menu.',
      true,
      false,
      now(),
      8
    );
  ELSE
    UPDATE pages
    SET
      title_it = 'Colli',
      title_en = 'Colli',
      meta_title_it = COALESCE(meta_title_it, 'Camera con Vista Colli'),
      meta_title_en = COALESCE(meta_title_en, 'Camera con Vista Colli'),
      meta_description_it = COALESCE(
        meta_description_it,
        'Camera con Vista Colli: spazio all''aperto con food, drinks e vini. Apri il menu digitale dedicato.'
      ),
      meta_description_en = COALESCE(
        meta_description_en,
        'Camera con Vista Colli: an outdoor place for food, drinks and wines. Open the dedicated digital menu.'
      ),
      sort_order = 8,
      updated_at = now()
    WHERE slug = 'colli';
  END IF;
END $$;

WITH colli_page AS (
  SELECT id AS page_id FROM pages WHERE slug = 'colli'
),
defaults AS (
  SELECT *
  FROM (
    VALUES
      (
        'hero',
        0,
        NULL,
        NULL,
        NULL,
        NULL,
        'https://pjrdnfbfpogvztfjuxya.supabase.co/storage/v1/object/public/media-public/public/1771799359563-senza_titolo-1.webp',
        100,
        100,
        0,
        0,
        0,
        0,
        '{"overlay":0,"overlayMobile":0}'::jsonb
      ),
      (
        'intro',
        1,
        'Food · Drinks · Vini',
        'Food · Drinks · Wines',
        'Un giardino urbano dove ordinare direttamente dal menu digitale: food, drinks e vini selezionati per vivere Camera con Vista all''aperto.',
        'An urban garden where guests order directly from the digital menu: food, drinks and selected wines to enjoy Camera con Vista outdoors.',
        NULL,
        100,
        100,
        0,
        0,
        0,
        0,
        NULL::jsonb
      ),
      (
        'location',
        2,
        NULL,
        NULL,
        E'Via Cavaioni 1, 40136, Bologna\npresso Ca'' Shin',
        E'Via Cavaioni 1, 40136, Bologna\nat Ca'' Shin',
        NULL,
        100,
        100,
        0,
        0,
        0,
        0,
        NULL::jsonb
      ),
      (
        'cta',
        3,
        NULL,
        NULL,
        'Scopri il menu',
        'Discover the menu',
        NULL,
        100,
        100,
        0,
        0,
        0,
        0,
        NULL::jsonb
      ),
      (
        'booking-cta',
        4,
        NULL,
        NULL,
        'Prenota',
        'Book',
        NULL,
        100,
        100,
        0,
        0,
        0,
        0,
        NULL::jsonb
      ),
      (
        'gallery-1',
        5,
        NULL,
        NULL,
        NULL,
        NULL,
        'https://pjrdnfbfpogvztfjuxya.supabase.co/storage/v1/object/public/media-public/public/1771799355180-ChatGPT_Image_30_dic_2025__00_06_13.webp',
        100,
        100,
        0,
        0,
        0,
        0,
        '{"overlay":0,"overlayMobile":0}'::jsonb
      ),
      (
        'gallery-2',
        6,
        NULL,
        NULL,
        NULL,
        NULL,
        'https://pjrdnfbfpogvztfjuxya.supabase.co/storage/v1/object/public/media-public/public/1777330031871-tapas_ccv.webp',
        100,
        100,
        0,
        0,
        0,
        0,
        '{"overlay":0,"overlayMobile":0}'::jsonb
      ),
      (
        'gallery-3',
        7,
        NULL,
        NULL,
        NULL,
        NULL,
        'https://pjrdnfbfpogvztfjuxya.supabase.co/storage/v1/object/public/media-public/public/1770393051582-Food1_SilviaPozzati-3.jpg',
        100,
        100,
        0,
        0,
        0,
        0,
        '{"overlay":0,"overlayMobile":0}'::jsonb
      )
  ) AS d(
    block_type,
    sort_order,
    title_it,
    title_en,
    body_it,
    body_en,
    image_url,
    image_scale_desktop,
    image_scale_mobile,
    image_offset_x,
    image_offset_y,
    image_offset_x_mobile,
    image_offset_y_mobile,
    metadata
  )
)
INSERT INTO page_blocks (
  page_id,
  block_type,
  sort_order,
  title_it,
  title_en,
  body_it,
  body_en,
  image_url,
  image_scale_desktop,
  image_scale_mobile,
  image_offset_x,
  image_offset_y,
  image_offset_x_mobile,
  image_offset_y_mobile,
  title_font_size,
  title_font_size_mobile,
  body_font_size,
  body_font_size_mobile,
  is_draft,
  metadata
)
SELECT
  colli_page.page_id,
  defaults.block_type,
  defaults.sort_order,
  defaults.title_it,
  defaults.title_en,
  defaults.body_it,
  defaults.body_en,
  defaults.image_url,
  defaults.image_scale_desktop,
  defaults.image_scale_mobile,
  defaults.image_offset_x,
  defaults.image_offset_y,
  defaults.image_offset_x_mobile,
  defaults.image_offset_y_mobile,
  CASE defaults.block_type
    WHEN 'intro' THEN 17
    ELSE NULL
  END,
  CASE defaults.block_type
    WHEN 'intro' THEN 16
    ELSE NULL
  END,
  CASE defaults.block_type
    WHEN 'intro' THEN 18
    WHEN 'location' THEN 15
    WHEN 'cta' THEN 14
    WHEN 'booking-cta' THEN 14
    ELSE 16
  END,
  CASE defaults.block_type
    WHEN 'intro' THEN 15
    WHEN 'location' THEN 14
    WHEN 'cta' THEN 13
    WHEN 'booking-cta' THEN 13
    ELSE 14
  END,
  false,
  defaults.metadata
FROM defaults
CROSS JOIN colli_page
WHERE NOT EXISTS (
  SELECT 1
  FROM page_blocks existing
  WHERE existing.page_id = colli_page.page_id
    AND existing.block_type = defaults.block_type
);
