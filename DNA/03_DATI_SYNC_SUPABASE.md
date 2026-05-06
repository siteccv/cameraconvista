# 03 - Dati, Sync e Supabase

## Scopo

Descrivere i punti dati davvero necessari all'agent: backend dati, tabelle critiche, snapshot, sync e comportamento Supabase.

## Selezione storage

Il progetto sceglie il backend in modo deterministico:

1. Supabase se sono presenti `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
2. PostgreSQL diretto se e presente `DATABASE_URL`
3. Errore esplicito se manca tutto

File chiave:

- `server/storage.ts`

## Tabelle / aree critiche

- `pages`
- `page_blocks`
- `site_settings`
- `menu_items`
- `wines`
- `cocktails`
- `events`
- `galleries`
- `gallery_images`
- `media`
- `media_categories`
- `admin_sessions`

## Site settings importanti

Chiavi operative note:

- `admin_password_hash`
- `footer_settings`
- `google_sheets_config`
- `published_menu_items`
- `published_wines`
- `published_cocktails`
- `menu_category_map`
- `site_links`
- `view_admin_url`
- `view_site_url`
- `resend_api_key` solo come fallback legacy server-side

## Snapshot pubblici

Esistono due logiche diverse:

- pagine/blocchi: snapshot in `publishedSnapshot`
- menu/vini/cocktail: snapshot JSON in `site_settings`

Non confondere i due flussi.

## Sync Google Sheets

- Config in `site_settings.google_sheets_config`
- Sync aggiorna le tabelle correnti
- Publish genera gli snapshot pubblici
- Non eseguire sync o publish without explicit request

File chiave:

- `server/routes/sync.ts`

## Supabase e sicurezza dati

- Le scritture passano dal backend con `service_role`
- Il client usa solo flussi consentiti pubblici
- `site_settings` pubblica e filtrata da whitelist, non da blacklist fragile

File chiave:

- `server/routes/settings.ts`
- `server/supabase.ts`

## Sequence / ID safety

Per `pages`, `galleries` e `gallery_images` esiste una protezione specifica per drift delle sequence:

- se e disponibile `SUPABASE_DB_URL` o `DATABASE_URL`, il runtime puo riservare ID seriali via helper SQL dedicato
- in fallback, il runtime usa approccio conservativo basato su `MAX(id)+1`

File chiave:

- `server/sequence-maintenance.ts`
- `server/supabase-storage.ts`

## Keepalive Supabase

Il keepalive non fa parte del runtime app:

- workflow GitHub dedicato
- script dedicato
- sola lettura REST leggera

File chiave:

- `.github/workflows/supabase-keepalive.yml`
- `scripts/supabase-keepalive.sh`

## Regola pratica per l'agent

Prima di toccare dati:

1. capire se il flusso e draft oppure snapshot pubblico
2. capire se il backend attivo e Supabase oppure PostgreSQL diretto
3. evitare scritture non richieste
4. non usare note storiche o audit passati per dedurre stato dati corrente
