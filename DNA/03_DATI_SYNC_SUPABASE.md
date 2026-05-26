# 03 - Dati, Sync e Supabase

## Scopo

Descrivere i punti dati davvero necessari all'agent: backend dati, tabelle critiche, snapshot, sync e comportamento Supabase.

## Aggiornamento verificato il 2026-05-26

Stato corrente verificato dopo bonifica controllata:

- `page_blocks.published_snapshot` ora esiste anche come colonna reale nel DB;
- il fallback legacy `page_blocks.metadata.__publishedSnapshot` resta mantenuto per compatibilita;
- la pagina `eventi` in `pages` e tornata `is_visible = true`, coerente con route, nav e sitemap;
- le tabelle `colli_*` hanno `RLS enabled`;
- `/api/colli/menu` serve il menu pubblico dallo snapshot interno attivo e non dipende piu dal bridge Render come fallback automatico;
- se il canale DB diretto non risponde, il runtime Colli prova il secondo percorso interno via Supabase REST;
- il bridge Render resta solo sorgente diagnostica/di emergenza esplicita e viene rifiutato se non rispetta il baseline canonico `3/14/120/5/13/14`;
- i conteggi Colli correnti verificati sono:
  - `colli_sections`: 3
  - `colli_categories`: 14
  - `colli_items`: 120
  - `colli_allergens`: 14
  - `colli_item_allergens`: 50
  - `colli_wine_categories`: 5
  - `colli_wines`: 13
  - `colli_menu_snapshots`: 75 totali, `1` attivo
- la policy pubblica `site_settings` e stata ristretta alle sole chiavi strettamente necessarie lato pubblico.

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

Area Colli migrata su Supabase in tabelle indipendenti:

- `colli_sections`
- `colli_categories`
- `colli_items`
- `colli_allergens`
- `colli_item_allergens`
- `colli_wine_categories`
- `colli_wines`
- `colli_settings`
- `colli_menu_snapshots`

Regola: le tabelle Colli devono restare separate da `menu_items`, `wines`, `cocktails` e dalla sync Google Sheets CCV.

## Stato Colli verificato il 2026-05-13

Nota: questa sezione resta storica e descrive il freeze iniziale di integrazione. Per lo stato corrente usare il blocco `Aggiornamento verificato il 2026-05-26`.

Controllo read-only prima della migrazione eseguito con:

```bash
npm run colli:db:check
```

Esito iniziale:

- backend locale collegato a Supabase tramite `DATABASE_URL`;
- pagina CMS `colli` assente nella tabella `pages`;
- blocchi CMS della vetrina `/colli` assenti in `page_blocks`;
- tabelle `colli_*` assenti;
- sorgente Render Colli raggiungibile;
- conteggi sorgente confermati: sezioni 3, categorie 14, prodotti 120, categorie vini 5, vini 11, allergeni 14.

Stato consolidato dopo migrazione, pubblicazione CMS e test admin controllato:

- pagina CMS `colli` creata in `pages`;
- 8 blocchi vetrina creati in `page_blocks`;
- pagina CMS `colli` pubblicata: `is_visible = true`, `is_draft = false`;
- blocchi vetrina pubblicati: 0 blocchi in bozza;
- snapshot CMS dei blocchi salvati in `page_blocks.metadata.__publishedSnapshot`;
- impostazione `site_settings.colli_booking_settings` creata per il numero WhatsApp del CTA Prenota;
- tabelle `colli_*` create;
- dati Colli importati in tabelle indipendenti;
- snapshot attivo creato in `colli_menu_snapshots`;
- `/api/colli/menu` legge lo snapshot interno attivo e il bridge Render non e piu fallback automatico del runtime pubblico;
- dati CCV esistenti (`menu_items`, `wines`, `cocktails`, `events`, sync Google) non sono stati fusi con Colli.
- test admin Colli eseguito via backend: modifica temporanea prodotto, verifica pubblica, ripristino valore originale.

Ultima verifica read-only del 2026-05-13:

- host DB Supabase: `aws-1-eu-west-1.pooler.supabase.com`;
- pagina `colli`: presente, visibile e non in bozza;
- blocchi CMS Colli: 8;
- blocchi attesi: `hero`, `intro`, `location`, `cta`, `booking-cta`, `gallery-1`, `gallery-2`, `gallery-3`;
- impostazione `colli_booking_settings`: presente, telefono `+393335345751`;
- sorgente Render `https://ccvcolli-ghxg.onrender.com/api/menu/draft`: raggiungibile;
- scritture eseguite dal check: nessuna.

Conteggi finali verificati:

- `colli_sections`: 3;
- `colli_categories`: 14;
- `colli_items`: 120;
- `colli_allergens`: 14;
- `colli_item_allergens`: 50;
- `colli_wine_categories`: 5;
- `colli_wines`: 13;
- `colli_settings`: almeno 3 (`last_import`, `admin_password_hash`, `english_enabled`);
- `colli_settings.english_enabled`: impostazione opzionale creata/aggiornata dal pannello admin Colli quando si modifica il toggle EN; se assente il codice assume EN attivo;
- `colli_menu_snapshots`: 75 totali, con 1 solo snapshot `active`.

Sequenze DB verificate:

- le sequenze Colli risultano allineate ai rispettivi `max(id)`;
- corrette e riallineate anche le sequenze storiche `galleries` e `gallery_images` dopo verifica manuale.

## Site settings importanti

Chiavi operative note:

- `admin_password_hash`
- `footer_settings`
- `google_sheets_config`
- `published_menu_items`
- `published_wines`
- `published_cocktails`
- `menu_category_map`
- `resend_api_key` solo come fallback legacy server-side

## Snapshot pubblici

Esistono logiche diverse:

- pagine/blocchi: snapshot in `PageBlock.publishedSnapshot` lato codice; dal 2026-05-26 il valore e materializzato anche nella colonna reale `page_blocks.published_snapshot`, mantenendo il fallback legacy `metadata.__publishedSnapshot`
- menu/vini/cocktail: snapshot JSON in `site_settings`
- menu Colli: snapshot JSON dedicato in `colli_menu_snapshots`

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
- le tabelle `colli_*` hanno `RLS enabled` e policy server-side `service_role only`

File chiave:

- `server/routes/settings.ts`
- `server/supabase.ts`
- `server/db.ts`

## Connessione dati Colli in produzione

Il menu pubblico Colli legge lo snapshot attivo in `colli_menu_snapshots`.

Regole consolidate il 2026-05-13:

- `server/db.ts` usa `SUPABASE_DB_URL` con priorita su `DATABASE_URL`;
- per host Supabase/pooler viene abilitato SSL;
- la pool PostgreSQL ha timeout di connessione/query/statement;
- se `SUPABASE_DB_URL` non e presente ma `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` sono presenti, Colli usa Supabase REST server-side;
- `/api/colli/menu` usa DB diretto come primo canale interno e Supabase REST come secondo canale interno quando disponibile;
- l'admin Colli usa lo stesso adapter REST per login, lettura pannello e CRUD quando la connessione PostgreSQL diretta non e disponibile;
- il bridge Render resta solo sorgente diagnostica/esplicita, non fallback pubblico automatico.

Questo evita sia il blocco login admin Colli sia la schermata `Caricamento menu...` prolungata in produzione quando Render non ha `SUPABASE_DB_URL`.

## Sequence / ID safety

Per `pages`, `galleries` e `gallery_images` esiste una protezione specifica per drift delle sequence:

- se e disponibile `SUPABASE_DB_URL` o `DATABASE_URL`, il runtime puo riservare ID seriali via helper SQL dedicato
- in fallback, il runtime usa approccio conservativo basato su `MAX(id)+1`

File chiave:

- `server/sequence-maintenance.ts`
- `server/supabase-storage.ts`

## Supabase Storage / Egress

Il traffico immagini pubblico usa Supabase Storage (`media-public`).

Audit del 2026-05-13:

- quota ciclo Free sotto controllo: database 6%, storage 9%, egress 2%, cached egress 31%;
- il consumo principale rilevato non era il database ma Storage/cached egress;
- i file piu richiesti erano immagini pubbliche CMS, incluse immagini della vetrina Colli;
- il preload globale immagini e stato rimosso per evitare download preventivi di pagine non visitate.

Regole operative:

- non reintrodurre preload globale di tutte le pagine;
- mantenere eventuali prefetch legati a interazioni esplicite dell'utente;
- controllare `Observability -> Storage` prima di ottimizzazioni invasive su immagini o CDN;
- ottimizzare immagini pesanti prima di caricarle in Supabase Storage.

## Keepalive Supabase

Il keepalive non fa parte del runtime app:

- workflow GitHub dedicato
- script dedicato
- sola lettura REST leggera
- nessuna scrittura database
- lo script carica `.env` solo in locale, mentre su GitHub Actions usa i secrets del workflow
- target predefinito: tabella `pages`, select `id`, `limit=1`
- timeout e retry sono gestiti via `curl`

Comando locale:

```bash
npm run supabase:keepalive
```

File chiave:

- `.github/workflows/supabase-keepalive.yml`
- `scripts/supabase-keepalive.sh`

## Regola pratica per l'agent

Prima di toccare dati:

1. capire se il flusso e draft oppure snapshot pubblico
2. capire se il backend attivo e Supabase oppure PostgreSQL diretto
3. evitare scritture non richieste
4. non usare note storiche o audit passati per dedurre stato dati corrente
5. per Colli, eseguire prima `npm run colli:db:check`
6. per Colli, eseguire poi `npm run colli:import:dry-run` e non fare `db:push` senza revisione
