begin;

alter table public.page_blocks
  add column if not exists published_snapshot jsonb;

update public.page_blocks
set published_snapshot = metadata -> '__publishedSnapshot'
where published_snapshot is null
  and metadata is not null
  and jsonb_typeof(metadata) = 'object'
  and metadata ? '__publishedSnapshot';

commit;
