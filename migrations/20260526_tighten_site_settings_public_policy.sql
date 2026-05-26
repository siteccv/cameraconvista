begin;

drop policy if exists "Site settings pubblici leggibili" on public.site_settings;

create policy "Site settings pubblici leggibili"
  on public.site_settings
  for select
  to public
  using (
    key = any (
      array[
        'footer_settings'::text,
        'menu_category_map'::text,
        'published_cocktails'::text,
        'published_menu_items'::text,
        'published_wines'::text
      ]
    )
  );

commit;
