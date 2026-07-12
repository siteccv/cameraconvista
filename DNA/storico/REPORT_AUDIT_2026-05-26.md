# REPORT_AUDIT_ENTERPRISE_STATO_ATTUALE

Data audit: 2026-05-26  
Aggiornamento post-bonifica: 2026-05-26  
Root progetto: `/Users/dero/Documents/SITE-CCV`

## 1. Executive summary

- Stato generale: progetto funzionante, online, con frontend pubblico, admin classico, modulo Colli dedicato, backend Express, Supabase/Postgres, sync Google Sheets, deploy Render e CI GitHub.
- Stato tecnico: base operativa solida ma non ancora allineata a uno standard enterprise uniforme.
- Problemi certi più rilevanti emersi nell'audit iniziale:
  - esposizione pubblica dei blocchi di una pagina nascosta tramite `GET /api/pages/:pageId/blocks`; evidenza: [server/routes/pages.ts](server/routes/pages.ts) `router.get("/:pageId/blocks")`, verifica reale via `curl /api/pages/5/blocks`;
  - route pubblica `/eventi` configurata ma oggi non fruibile perché la pagina `eventi` è `is_visible=false`; evidenza DB read-only su tabella `pages` e verifica browser reale su `http://127.0.0.1:5001/eventi` con schermata `404`;
  - divergenza schema/runtime su `page_blocks.published_snapshot`; evidenza: [shared/schema.ts](shared/schema.ts) dichiara `publishedSnapshot`, ma il DB reale non ha quella colonna e [server/supabase-storage.ts](server/supabase-storage.ts) la serializza dentro `metadata.__publishedSnapshot`;
  - tutte le tabelle `colli_*` hanno `RLS disabled`; evidenza: query read-only su `pg_tables` / `pg_class`;
  - dipendenza runtime Colli dal bridge Render con dataset non allineato (`13` vini interni vs `11` sul bridge); stato successivo mitigato nelle sezioni `43-45`; evidenza: `npm run colli:db:check`, [server/routes/colli.ts](server/routes/colli.ts), DNA Colli storico.
- Debito principale:
  - file molto grandi e logiche concentrate;
  - doppie logiche storiche per publish/snapshot/sync;
  - documentazione DNA utile ma con drift reale su alcuni numeri e stati operativi;
  - CI GitHub con gap concreto: ultimo commit `main` remoto esiste, ma non risulta alcuna run associata del workflow `Quality`.

## 2. Metodo di audit seguito

- Audit solo in lettura.
- Nessuna modifica a codice, DB, Supabase, Render, Google Sheet, Apps Script, deploy, env, dati o produzione.
- Unica scrittura effettuata: questo file markdown nella root.
- Metodo:
  - ricognizione repo e configurazioni;
  - mappa frontend/admin/backend/API;
  - lettura selettiva dei file critici;
  - controlli Git/GitHub/Render/Supabase/Google pubblici;
  - query DB read-only di metadata e integrità;
  - verifica app locale già disponibile su `5001`;
  - verifica browser reale non distruttiva su route chiave.

## 3. Comandi diagnostici eseguiti

- Repository/Git:
  - `pwd`
  - `git status --short --branch`
  - `git branch --all --verbose --no-abbrev`
  - `git remote -v`
  - `find ...` e `rg ...`
- Stack/config:
  - lettura `package.json`, `vite.config.ts`, `tsconfig.json`, `drizzle.config.ts`, `playwright.config.ts`
  - lettura file in `client/`, `server/`, `shared/`, `DNA/`, `.github/workflows/`
- Avvio/runtime locale:
  - `PORT=5001 npm run dev`
  - `lsof -iTCP:5001 -sTCP:LISTEN`
  - `curl -I http://127.0.0.1:5001`
  - `curl http://127.0.0.1:5001/api/colli/menu`
  - `curl http://127.0.0.1:5001/api/pages`
  - `curl http://127.0.0.1:5001/api/pages/5/blocks`
  - `curl http://127.0.0.1:5001/api/pages/slug/eventi/blocks`
  - `curl http://127.0.0.1:5001/api/site-settings`
  - `curl http://127.0.0.1:5001/robots.txt`
  - `curl http://127.0.0.1:5001/sitemap.xml`
- Browser/test tooling:
  - `npx playwright --version`
  - launch headless Chrome via Playwright su `/eventi`
- Qualità:
  - `npm run check:all`
  - `npm run colli:db:check`
- GitHub:
  - `gh auth status`
  - `gh repo view siteccv/cameraconvista`
  - `gh workflow list`
  - `gh run list --workflow Quality`
  - `gh run list --commit d60f37bf6d7aa65ab2884a18e8f68e5c3fb7a6d2`
  - `git rev-parse HEAD`
  - `git ls-remote github refs/heads/main`
- Render:
  - `curl -I https://cameraconvista.onrender.com`
  - `curl -I https://ccvcolli-ghxg.onrender.com/api/health`
  - `curl` Render API `/v1/services` con chiave locale, senza stampare segreti
- Google Sheets:
  - `curl` CSV pubblicato Google Sheets usato dal sync menu
  - `rg` su repo per `google_sheets_config`, URL sheet, `clasp`, `Apps Script`
- Supabase/Postgres read-only:
  - query tabelle, colonne, RLS, policy, indici, bucket storage, funzioni, trigger, integrità referenziale, chiavi `site_settings`, chiavi `colli_settings`, conteggi esatti.

## 4. Stato reale del progetto

- Stack:
  - frontend React 18 + Vite + Wouter + TanStack Query;
  - backend Express 5 + TypeScript;
  - storage layer duale: Supabase REST adapter o accesso PostgreSQL/Drizzle; evidenza: [server/storage.ts](server/storage.ts), [server/db.ts](server/db.ts), [server/supabase-storage.ts](server/supabase-storage.ts);
  - DB reale: Supabase Postgres;
  - deploy: Render;
  - CI: GitHub Actions.
- Package manager: `npm`; evidenza `package-lock.json` e `package.json`.
- Branch corrente: `main`.
- Remote principali:
  - `github https://github.com/siteccv/cameraconvista.git`
  - `gitsafe-backup git://gitsafe:5418/backup.git`

## 5. Mappa completa delle aree del progetto

- Frontend pubblico:
  - entrypoint [client/src/main.tsx](client/src/main.tsx);
  - router [client/src/App.tsx](client/src/App.tsx);
  - layout principali in `client/src/components/layout/`.
- Area admin classica:
  - route `/admina/*`; evidenza [client/src/App.tsx](client/src/App.tsx);
  - pagine in `client/src/pages/admin/`.
- Area admin Colli:
  - route `/colli/admina` e `/colli/admina/panel`; evidenza [client/src/App.tsx](client/src/App.tsx).
- Backend/API:
  - mount router centrale [server/routes/index.ts](server/routes/index.ts);
  - bootstrap [server/index.ts](server/index.ts).
- Database/storage:
  - schema applicativo [shared/schema.ts](shared/schema.ts);
  - contratto Colli [shared/colli.ts](shared/colli.ts);
  - accesso DB [server/db.ts](server/db.ts), [server/storage.ts](server/storage.ts), [server/supabase-storage.ts](server/supabase-storage.ts).
- SEO/SSR:
  - injection server-side e sitemap/robots in [server/seo.ts](server/seo.ts) e [server/index.ts](server/index.ts).
- Sync esterne:
  - Google Sheets in [server/sheets-sync.ts](server/sheets-sync.ts);
  - admin sync UI in [client/src/pages/admin/sync-google.tsx](client/src/pages/admin/sync-google.tsx).
- Deploy:
  - Render rilevato via API e runtime pubblico.
- CI/CD:
  - `.github/workflows/quality.yml`
  - `.github/workflows/supabase-keepalive.yml`
- Documentazione:
  - `README_OPERATIVO.md`
  - cartella `DNA/`
  - `GITHUB_PUSH_GUIDE.md`
- Residui legacy:
  - branch `replit-agent`
  - script una tantum in `scripts/`
  - tabelle DB obsolete/non usate.

## 6. Cosa è stato verificato con certezza

- app locale già raggiungibile su `http://127.0.0.1:5001`;
- backend pubblico e API rispondono;
- database Supabase accessibile in read-only con metadata coerenti;
- Render principale e bridge Colli pubblici rispondono `200`;
- GitHub remoto e auth CLI sono attivi;
- Chrome/Playwright sono presenti;
- Google Sheets pubblicati usati dal progetto sono raggiungibili;
- CI `Quality` esiste nel repo ma non risulta agganciato all’ultimo commit remoto `main`;
- `/eventi` locale produce `404` lato client pur avendo route definita.

## 7. Cosa non è stato possibile verificare

- Apps Script reale: `NON VERIFICATO`
  - nessun file `clasp`, nessun sorgente Apps Script nel repo, nessun accesso diretto al progetto Google Script.
- Search Console / analytics dashboard reali: `NON VERIFICATO`
  - nessun accesso operativo diretto nel repo.
- env e secret lato Render dashboard oltre ai metadati base: `NON VERIFICATO`
  - verificato il servizio via API, non l’intero set di env lato dashboard.
- bucket objects e file storage contenuto dettagliato: `NON VERIFICATO`
  - verificati bucket e limiti, non inventario completo file.

## 8. Risultato avvio locale su porta 5001

- Tentativo diretto: `PORT=5001 npm run dev`
  - risultato: `EADDRINUSE`; evidenza shell locale.
- Diagnosi:
  - un processo `node` era già in ascolto sulla `5001`; evidenza `lsof -iTCP:5001 -sTCP:LISTEN`.
- Verifica funzionale:
  - `curl -I http://127.0.0.1:5001` => `HTTP/1.1 200 OK`
  - `curl /api/colli/menu` => risposta valida con `source=siteccv-supabase-snapshot`.
- Conclusione:
  - app locale già attiva su `5001`;
  - riavvio fresco non verificato perché porta occupata;
  - sezione marcata `VERIFICATA PARZIALMENTE`.

## 9. Analisi struttura progetto

- Struttura root coerente:
  - `client/`, `server/`, `shared/`, `migrations/`, `scripts/`, `e2e/`, `tests/`, `DNA/`, `.github/`.
- File canonici:
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `drizzle.config.ts`, `playwright.config.ts`.
- Residui/attenzioni:
  - branch `replit-agent` ancora presente;
  - cartella `attached_assets/` e `LOGOS/` convivono con `client/public/`;
  - script mutativi una tantum presenti ma non protetti da workflow applicativo: `scripts/upload-images-to-supabase.ts`, `scripts/migrate-all-images-to-supabase.ts`, `scripts/cleanup-duplicate-storage.ts`.
- Problema sospetto:
  - parte del progetto ha stratificazione storica elevata; evidenza numero di file grandi e DNA storico molto lungo.

## 10. Analisi frontend pubblico

- Routing pubblico definito in [client/src/App.tsx](client/src/App.tsx).
- Pagine CMS-driven principali:
  - `home`, `menu`, `lista-vini`, `cocktail-bar`, `galleria`, `dove-siamo`, sottopagine eventi privati.
- Pagine static/special:
  - `privacy`, `cookie`, `colli`, `colli/menu`.
- Problemi certi:
  - la route `/eventi` esiste ma la relativa pagina è filtrata dalla visibility DB; evidenza:
    - [client/src/App.tsx](client/src/App.tsx) usa `PublicPageRoute` per `eventi`;
    - query DB `pages` mostra `eventi is_visible=false`;
    - browser headless su `/eventi` mostra `404`.
  - hard coupling ai page id numerici; evidenza [client/src/lib/page-defaults.ts](client/src/lib/page-defaults.ts) `PAGE_IDS`.
- Problemi sospetti:
  - default media URL remoti hardcoded in [client/src/lib/page-defaults.ts](client/src/lib/page-defaults.ts);
  - `home.tsx` duplica logica del custom hook `use-page-blocks`; evidenza [client/src/pages/home.tsx](client/src/pages/home.tsx) e [client/src/hooks/use-page-blocks.ts](client/src/hooks/use-page-blocks.ts).
- Codice sospetto/non usato:
  - [client/src/lib/supabase.ts](client/src/lib/supabase.ts) non risulta importato da altri file del client.

## 11. Analisi area admin

- Admin classico:
  - autenticazione via cookie sessione `ccv_admin_session`; evidenza [server/routes/helpers.ts](server/routes/helpers.ts).
  - pagine admin in `client/src/pages/admin/`.
- Admin Colli:
  - login dedicato e panel dedicato; evidenza [client/src/App.tsx](client/src/App.tsx), [server/routes/colli-admin.ts](server/routes/colli-admin.ts).
- Problemi certi:
  - il pannello SEO admin non copre tutte le pagine realmente routabili; evidenza [client/src/pages/admin/seo.tsx](client/src/pages/admin/seo.tsx) `PAGE_LABELS` non include `colli`, `colli-menu`, `privacy`, `cookie`, `eventi-privati-cena`.
  - l’autenticazione Colli non è realmente separata: una sessione admin classica abilita anche l’accesso all’admin Colli; evidenza [server/routes/colli-admin.ts](server/routes/colli-admin.ts) `isColliAdminAuthenticated()`.
- Problemi sospetti:
  - bootstrap automatico dei blocchi mancanti lato admin preview può nascondere drift dati; evidenza [client/src/hooks/use-page-blocks.ts](client/src/hooks/use-page-blocks.ts), [client/src/pages/home.tsx](client/src/pages/home.tsx).

## 12. Analisi backend/API

- Entry bootstrap: [server/index.ts](server/index.ts).
- Mount router: [server/routes/index.ts](server/routes/index.ts).
- Aree endpoint:
  - `/api/pages`
  - `/api/menu-items`, `/api/wines`, `/api/cocktails`
  - `/api/colli/*`
  - `/api/events`
  - `/api/galleries`
  - `/api/media`
  - `/api/footer-settings`, `/api/site-settings`, `/api/colli-booking-settings`
  - `/api/event-request`
  - `/api/health/email`
  - `/api/admin/*`
- Problemi certi:
  - `GET /api/pages/:pageId/blocks` non valida la visibilità della pagina; evidenza [server/routes/pages.ts](server/routes/pages.ts).
  - `storage.seedInitialData()` è chiamato a ogni bootstrap server; evidenza [server/index.ts](server/index.ts) e [server/storage.ts](server/storage.ts). Il metodo si ferma se esistono pagine, ma resta una logica di auto-seed attiva su runtime.
  - doppio storage runtime:
    - Supabase REST adapter;
    - accesso DB/Drizzle.
    - evidenza [server/storage.ts](server/storage.ts), [server/supabase-storage.ts](server/supabase-storage.ts).
- Problemi sospetti:
  - stratificazione alta tra storage classico, Supabase adapter, bridge Render Colli, snapshot DB, snapshot `site_settings`;
  - rischio manutenzione elevato per `server/storage.ts` (`871` righe) e `server/routes/colli-admin.ts` (`991` righe).

## 13. Analisi Supabase/database

- Accesso: `VERIFICATO` in read-only.
- Tabelle pubbliche rilevate:
  - `pages`, `page_blocks`, `site_settings`, `menu_items`, `wines`, `cocktails`, `events`, `galleries`, `gallery_images`, `media`, `media_categories`, `admin_sessions`, `users`
  - namespace Colli: `colli_sections`, `colli_categories`, `colli_items`, `colli_item_allergens`, `colli_allergens`, `colli_wine_categories`, `colli_wines`, `colli_settings`, `colli_menu_snapshots`
  - tabella sospetta/obsoleta: `menu_items_published`
- Conteggi reali significativi:
  - `pages=12`
  - `page_blocks=72`
  - `menu_items=19`
  - `wines=58`
  - `cocktails=29`
  - `media=65`
  - `events=3`
  - `colli_items=120`
  - `colli_wines=13`
  - `colli_item_allergens=50`
  - `colli_menu_snapshots active=1 archived=74`
  - `menu_items_published=0`
  - `users=0`
- Integrità referenziale verificata:
  - nessun orphan su `page_blocks`, `gallery_images`, `colli_categories`, `colli_items`, `colli_item_allergens`.
- Viste:
  - nessuna view in `public`, `storage`, `auth`.
- Funzioni:
  - solo `update_updated_at_column()`.
- Trigger:
  - presenti su `pages`, `page_blocks`, `menu_items`, `wines`, `cocktails`, `events`, `galleries`, `site_settings`;
  - assenti sulle tabelle `colli_*`.
- Bucket storage:
  - `media-private` `public=false`, limite `100MB`
  - `media-public` `public=true`, limite `50MB`
- Problemi certi:
  - divergenza schema/runtime `page_blocks`:
    - codice schema dichiara `published_snapshot`;
    - DB reale non ha la colonna;
    - runtime Supabase usa `metadata.__publishedSnapshot`.
  - tutte le tabelle `colli_*` hanno `RLS disabled`.
  - `menu_items_published` esiste ma ha `0` righe e non risulta referenziata dal codice.
  - `users` esiste ma ha `0` righe; auth reale è basata su `site_settings` e `admin_sessions`.
- Problemi sospetti:
  - `site_settings` contiene sia `admin_password` legacy sia `admin_password_hash`;
  - `site_settings` contiene anche `resend_api_key` come secret applicativo persistito nel DB.

## 14. Analisi Google Sheet / Apps Script

- Google Sheets: `VERIFICATO PARZIALMENTE`
  - il progetto usa davvero URL CSV pubblicati Google Sheets; evidenza [server/sheets-sync.ts](server/sheets-sync.ts).
  - `curl` sul CSV menu ha restituito header e righe reali.
- Apps Script: `NON VERIFICATO`
  - nessun file `clasp`, nessun sorgente Apps Script, nessuna evidenza diretta di script versionato.
- Logica sync rilevata:
  - URL default hardcoded in [server/sheets-sync.ts](server/sheets-sync.ts);
  - override possibile via `site_settings.google_sheets_config`;
  - endpoint admin dedicati in [server/routes/sync.ts](server/routes/sync.ts).
- Problemi certi:
  - sync menu/wines/cocktails sostituisce i dati live facendo `deleteAll()` e poi insert batch; evidenza [server/sheets-sync.ts](server/sheets-sync.ts).
  - nessuna transazione end-to-end attorno a fetch esterno + delete + insert; rischio di working set parziale in caso di errore a metà.
- Mitigazione parziale già presente:
  - il pubblico legge snapshot pubblicati in `site_settings`, non le tabelle live; evidenza [server/routes/menu.ts](server/routes/menu.ts), [server/routes/sync.ts](server/routes/sync.ts).
- Gap:
  - trigger Apps Script, deduplicazione lato foglio, cancellazioni/archiviazioni e chiavi Google restano `NON VERIFICATO`.

## 15. Analisi integrazioni esterne

- Supabase:
  - integrata come DB reale e come REST admin adapter.
- Render:
  - servizio `cameraconvista` verificato via API Render:
    - `type=web_service`
    - `branch=main`
    - `autoDeploy=yes`
    - `region=frankfurt`
    - `plan=free`
    - `url=https://cameraconvista.onrender.com`
  - bridge Colli esterno `https://ccvcolli-ghxg.onrender.com/api/health` risponde `200`.
- GitHub:
  - repo `siteccv/cameraconvista` verificato.
- Google Sheets:
  - integrazione reale verificata.
- Altro:
  - Resend in `event-request`;
  - OpenAI env presente ma non auditata funzionalmente in questo passaggio.

## 16. Analisi deploy/configurazioni

- Porta runtime:
  - default codice `5000`; evidenza [server/index.ts](server/index.ts).
  - operativo locale standard documentato `5001`.
- Vite build:
  - root `client`, output `dist/public`; evidenza `vite.config.ts`.
- Canonical host:
  - redirect a `www.cameraconvista.it` in produzione; evidenza [server/index.ts](server/index.ts).
- CI:
  - workflow `Quality` su push `main` e PR; evidenza [.github/workflows/quality.yml](.github/workflows/quality.yml).
  - workflow `Supabase Keepalive` presente.
- Problema certo:
  - l’ultimo commit remoto `main` `d60f37bf6d7aa65ab2884a18e8f68e5c3fb7a6d2` non mostra run associate `Quality`; evidenza `gh run list --commit ... => []`.

## 17. Analisi SEO/SSR/sitemap/robots

- SEO server-side reale:
  - injection HTML in [server/index.ts](server/index.ts) e [server/seo.ts](server/seo.ts).
- Sitemap e robots reali:
  - `/robots.txt` e `/sitemap.xml` serviti server-side.
- Verifiche:
  - `curl /robots.txt` => ok;
  - `curl /sitemap.xml` => ok.
- Problemi certi:
  - `/eventi` non compare in sitemap perché `pages` lo marca invisibile, ma eventi dettaglio attivi compaiono;
  - admin SEO non copre tutte le pagine SEO-rilevanti, vedi sezione 11.
- Problemi sospetti:
  - differenza tra page visibility CMS e route effettivamente esposte crea rischio di incoerenze SEO/funzionali.

## 18. Analisi sicurezza

- Misure presenti:
  - `helmet` base; evidenza [server/index.ts](server/index.ts);
  - `httpOnly` cookie admin; evidenza [server/routes/helpers.ts](server/routes/helpers.ts), [server/routes/colli-admin.ts](server/routes/colli-admin.ts);
  - validazioni Zod su molte API admin/public;
  - rate limit login Colli via `express-rate-limit`;
  - rate limit semplice per `event-request`.
- Problemi certi:
  - public exposure di blocchi pagina nascosta via `/api/pages/:pageId/blocks`;
  - RLS assente su tutte le tabelle `colli_*`;
  - accesso admin Colli concedibile anche con sessione admin classica;
  - policy cookie non allineata alla realtà implementata:
    - policy dice cookie `ccv_cookie_consent`, `ccv_language`, `session_id`;
    - codice usa `localStorage` per consenso e lingua, cookie `ccv_admin_session` / `ccv_colli_admin_session`.
  - endpoint pubblico `/api/site-settings` espone anche `site_links`, `view_admin_url`, `view_site_url`; non sono segreti, ma sono metadati interni pubblicabili.
- Problemi sospetti:
  - rate limit `event-request` è solo in-memory e non distribuito; evidenza [server/routes/event-request.ts](server/routes/event-request.ts);
  - `COLLI` embed consente `cashin.coop`; scelta intenzionale ma da governare.

## 19. Analisi performance/stabilità

- Evidenze di peso:
  - chunk client principale build ~`744.60 kB`;
  - chunk `EventWizard` ~`409.11 kB`;
  - CSS principale ~`115.31 kB`;
  - evidenza da `npm run check:all`.
- Asset pesanti rilevati:
  - `attached_assets/colli_home.png` ~`788 KB`
  - `LOGOS/logo_ccv_icon.png` ~`304 KB`
  - `client/public/colli-home-512.png` ~`188 KB`
- Problemi certi:
  - file frontend/backend molto grandi e concentrati;
  - `ColliMenuApp` forza `refetchOnMount: "always"`, `refetchOnWindowFocus: true`, `staleTime: 0`; evidenza `rg` su [client/src/components/colli/ColliMenuApp.tsx](client/src/components/colli/ColliMenuApp.tsx).
- Problemi sospetti:
  - eventuale churn rete lato Colli su utenti che tornano in focus frequentemente;
  - fallback Render Colli potrebbe aumentare latenza o servire dati non allineati in caso di failure snapshot interno.

## 20. Analisi qualità codice

- File più grandi:
  - `server/routes/colli-admin.ts` `991`
  - `server/storage.ts` `871`
  - `shared/schema.ts` `843`
  - `client/src/lib/page-defaults.ts` `800`
  - `client/src/components/colli/ColliMenuApp.tsx` `778`
  - `server/supabase-storage.ts` `662`
- Duplicazioni certe:
  - `home.tsx` replica logica già coperta da `use-page-blocks`;
  - snapshot publish logics distribuite tra `pages`, `menu`, `sync`, `site_settings`, `colli_menu_snapshots`.
- Complessità:
  - forte coupling tra routing, CMS numerico e stato DB;
  - mix di approccio strongly typed e workaround storici.
- TODO/legacy:
  - riferimenti legacy in footer/day parsing, password legacy, note “chirurgical fix”.

## 21. Stato cartella DNA

- Stato generale: utile, ampia, operativa, ma non completamente riallineata.
- Punti forti:
  - copre architettura, dati, deploy, guardrail, Colli.
- Drift certi:
  - `DNA/03_DATI_SYNC_SUPABASE.md` riporta Colli con `11` vini, mentre il DB reale ha `13`;
  - `DNA/03_DATI_SYNC_SUPABASE.md` riporta `colli_item_allergens` più basso dello stato reale (`50`);
  - `DNA/04_OPERATIONS_DEPLOY_GITHUB.md` contiene ancora una sezione che dichiara `npm run audit` fallito con `3` vulnerabilità, mentre oggi `npm run audit` passa;
  - `DNA/CCV_COLLI_INTEGRATION.md` resta molto storica e in più punti ancora allineata al vecchio conteggio `11` vini.
- Valutazione:
  - DNA è base utile per agent futuri;
  - non va considerata fonte primaria senza confronto col codice e col DB reale.

## 22. Codice morto o sospetto

- Certo/sospetto forte:
  - tabella `menu_items_published` nel DB: `0` righe e nessuna referenza nel repo;
  - tabella `users`: `0` righe, non usata dal runtime corrente di autenticazione;
  - [client/src/lib/supabase.ts](client/src/lib/supabase.ts) apparentemente non importata;
  - script una tantum in `scripts/` non agganciati al flusso standard.

## 23. Logiche duplicate

- `home.tsx` vs `use-page-blocks`;
- storage runtime:
  - `DatabaseStorage`
  - `SupabaseStorage`
  - bridge/fallback Colli Render
- publish content:
  - `page_blocks` snapshot
  - `site_settings` snapshot JSON per menu/wines/cocktails
  - `colli_menu_snapshots` per Colli
- Google Sheets config:
  - default hardcoded
  - override in `site_settings.google_sheets_config`

## 24. Logiche obsolete

- `admin_password` legacy key ancora presente accanto a `admin_password_hash`;
- tabella `menu_items_published`;
- tabella `users` inattiva;
- note storiche DNA che descrivono stati superati;
- route legacy redirect `/carta-vini`, `/contatti`, `/colli/admin*` mantenute per compatibilità.

## 25. Endpoint coinvolti

- Pubblici principali:
  - `GET /api/pages`
  - `GET /api/pages/slug/:slug/blocks`
  - `GET /api/pages/:pageId/blocks`
  - `GET /api/menu-items`
  - `GET /api/wines`
  - `GET /api/cocktails`
  - `GET /api/site-settings`
  - `GET /api/footer-settings`
  - `GET /api/colli-booking-settings`
  - `GET /api/colli/menu`
  - `GET /api/events`
  - `GET /api/galleries`
  - `GET /api/media`
  - `POST /api/event-request`
  - `GET /api/health/email`
- Admin principali:
  - `/api/admin/*`
  - `/api/admin/sync/*`
  - `/api/colli/admin/*`

## 26. Tabelle coinvolte

- CMS/Core:
  - `pages`, `page_blocks`, `site_settings`, `admin_sessions`
- Catalogo pubblico:
  - `menu_items`, `wines`, `cocktails`
- Media/eventi:
  - `media`, `media_categories`, `galleries`, `gallery_images`, `events`
- Colli:
  - `colli_sections`, `colli_categories`, `colli_items`, `colli_item_allergens`, `colli_allergens`, `colli_wine_categories`, `colli_wines`, `colli_settings`, `colli_menu_snapshots`
- Sospette/legacy:
  - `menu_items_published`, `users`

## 27. File coinvolti

- Frontend:
  - [client/src/App.tsx](client/src/App.tsx)
  - [client/src/pages/home.tsx](client/src/pages/home.tsx)
  - [client/src/hooks/use-page-blocks.ts](client/src/hooks/use-page-blocks.ts)
  - [client/src/lib/page-defaults.ts](client/src/lib/page-defaults.ts)
  - [client/src/pages/admin/seo.tsx](client/src/pages/admin/seo.tsx)
  - [client/src/components/CookieConsent.tsx](client/src/components/CookieConsent.tsx)
  - [client/src/contexts/LanguageContext.tsx](client/src/contexts/LanguageContext.tsx)
  - [client/src/pages/cookie-policy.tsx](client/src/pages/cookie-policy.tsx)
  - [client/src/components/colli/ColliMenuApp.tsx](client/src/components/colli/ColliMenuApp.tsx)
- Backend:
  - [server/index.ts](server/index.ts)
  - [server/routes/index.ts](server/routes/index.ts)
  - [server/routes/pages.ts](server/routes/pages.ts)
  - [server/routes/menu.ts](server/routes/menu.ts)
  - [server/routes/settings.ts](server/routes/settings.ts)
  - [server/routes/sync.ts](server/routes/sync.ts)
  - [server/routes/event-request.ts](server/routes/event-request.ts)
  - [server/routes/colli.ts](server/routes/colli.ts)
  - [server/routes/colli-admin.ts](server/routes/colli-admin.ts)
  - [server/sheets-sync.ts](server/sheets-sync.ts)
  - [server/storage.ts](server/storage.ts)
  - [server/supabase-storage.ts](server/supabase-storage.ts)
  - [server/seo.ts](server/seo.ts)
- Shared/docs/config:
  - [shared/schema.ts](shared/schema.ts)
  - [shared/colli.ts](shared/colli.ts)
  - [.github/workflows/quality.yml](.github/workflows/quality.yml)
  - `DNA/*.md`

## 28. Rischi backend

- P0:
  - esposizione pubblica blocchi pagina nascosta via endpoint numerico.
- P1:
  - stratificazione storage/snapshot/fallback difficile da governare;
  - `/eventi` configurata ma oggi 404 per mismatch DB/router.
- P2:
  - seed automatico al bootstrap su DB vuoto;
  - `event-request` rate limit solo in-memory.
- P3:
  - file monolitici e commenti storici.

## 29. Rischi database

- P0:
  - `colli_*` senza RLS.
- P1:
  - drift schema/runtime su `page_blocks.published_snapshot`;
  - fallback Colli Render con dataset diverso dall’interno.
- P2:
  - assenza trigger `updated_at` per `colli_*`;
  - secret `resend_api_key` in `site_settings`.
- P3:
  - tabelle residue `menu_items_published`, `users`.

## 30. Rischi Google Sheet / Apps Script

- P1:
  - sync distruttivo `delete + insert` senza transazione end-to-end.
- P2:
  - doppia sorgente configurativa: default hardcoded + config DB.
- `NON VERIFICATO`:
  - Apps Script, trigger, logiche di archiviazione/cancellazione lato Google.

## 31. Rischi SEO/deploy

- P1:
  - workflow `Quality` non agganciato all’ultimo commit `main`;
  - route pubblica `/eventi` non coerente con page visibility, potenziale rumore SEO/funzionale.
- P2:
  - admin SEO non governa tutte le pagine reali;
  - DNA deploy/history non totalmente riallineata.

## 32. Rischi sicurezza

- P0:
  - public blocks exposure su pagina invisibile.
- P1:
  - `colli_*` senza RLS;
  - admin Colli non realmente separato.
- P2:
  - policy cookie non allineata alla realtà tecnica;
  - `site_settings` pubblica alcuni URL interni non segreti ma sensibili.

## 33. Rischi performance

- P1:
  - bundle JS grandi;
  - refetch aggressivo Colli.
- P2:
  - bridge Render Colli storico ancora disallineato, ma non più usato dal runtime pubblico di default.
- P3:
  - asset statici abbastanza pesanti;
  - file monolitici complicano ottimizzazione mirata.

## 34. Colli di bottiglia

- `server/routes/colli-admin.ts`: troppa responsabilità in un solo modulo.
- `server/storage.ts`: storage centrale troppo esteso.
- `shared/schema.ts`: schema molto grande con storia evolutiva eterogenea.
- `client/src/lib/page-defaults.ts`: hardcoded forte di page id e asset defaults.
- `client/src/pages/admin/sync-google.tsx`: UI e logica sync molto dense.

## 35. Priorità di intervento futura

### P0 critico

- chiudere esposizione `GET /api/pages/:pageId/blocks` per pagine invisibili;
- decidere governance RLS per `colli_*`.

### P1 importante

- riallineare `/eventi` con visibilità CMS o con routing reale;
- riallineare bridge Render Colli e snapshot interno;
- risolvere gap CI del commit `main`;
- allineare admin SEO alle pagine realmente esposte;
- consolidare separazione auth admin vs admin Colli.

### P2 migliorativo

- ridurre duplicazioni `home.tsx` / `use-page-blocks`;
- governare meglio sync Google Sheets con transazionalità o staging;
- allineare documentazione cookie/privacy alla realtà tecnica;
- ridurre hardcoded di page ids e URL media.

### P3 pulizia futura

- rimuovere o archiviare `menu_items_published`, `users`, helper Supabase client non usato;
- segmentare file monolitici;
- ripulire note storiche DNA obsolete.

## 36. Piano teorico consigliato di bonifica futura, senza applicarlo

- Fase A:
  - mettere in sicurezza API pubbliche e governance accessi.
- Fase B:
  - riallineare routing/visibility/SEO e CI GitHub.
- Fase C:
  - consolidare storage/snapshot/sync, riducendo i percorsi paralleli.
- Fase D:
  - pulizia schema/documentazione/file legacy.

## 37. Gap informativi ancora aperti

- definizione operativa desiderata di `/eventi`: deve essere pubblica o no;
- policy attese per `colli_*` lato Supabase;
- esistenza di Apps Script esterno non versionato;
- motivo per cui l’ultimo commit `main` non ha innescato `Quality`;
- inventario completo dei secret e delle loro fonti canoniche;
- eventuale uso reale di `menu_items_published` fuori repo.

## 38. Conclusione operativa

- Il progetto è operativo e utilizzato, ma presenta alcuni punti certi di non allineamento enterprise:
  - una falla logica su API pubblica pagine;
  - incoerenze tra router e stato CMS;
  - divergenze schema/runtime e doc/runtime;
  - governance Colli ancora più “operativa” che “istituzionalizzata”.
- La base è comunque buona:
  - test e controlli disponibili;
  - architettura leggibile;
  - deploy reale verificato;
  - integrazioni principali identificabili.
- La fonte primaria resta il codice reale e il DB reale, non la documentazione DNA.

## 39. Piano di azione credibile

- Strategia:
  - procedere per step piccoli, verificabili e reversibili;
  - chiudere prima i rischi `P0/P1`, poi affrontare allineamenti e pulizia;
  - evitare refactor massivi iniziali;
  - non rimuovere strutture storiche finché non sono dimostrate inutili.
- Sequenza operativa:
  - `Step 0`: baseline di sicurezza, controlli pre-intervento e snapshot logici read-only;
  - `Step 1`: chiusura esposizione pubblica `GET /api/pages/:pageId/blocks`;
  - `Step 2`: riallineamento route `/eventi`, visibility DB, SEO e navigazione;
  - `Step 3`: hardening area Colli lato autenticazione e accesso;
  - `Step 4`: riduzione dei mismatch schema/runtime più critici;
  - `Step 5`: allineamenti secondari a basso rischio su admin/endpoint/configurazioni;
  - `Step 6`: riallineamento documentazione tecnica e verifiche finali.
- Regola guida:
  - se uno step presenta dubbi reali di rottura, non va applicato in produzione senza ulteriore evidenza.

## 40. Vincoli non negoziabili

- preservare i dati esistenti nel DB;
- evitare modifiche distruttive o irreversibili;
- non cambiare layout pubblico o admin se non strettamente necessario per correggere un problema reale;
- non peggiorare mobile, fluidità, prestazioni o UX;
- ogni modifica deve avere verifica prima/dopo;
- nessuna rimozione di tabelle, bucket, script o logiche legacy senza prova di inutilizzo;
- eventuali modifiche DB devono essere additive o controllate.

## 41. Obblighi operativi

- eseguire un solo cluster logico di modifiche alla volta;
- verificare sempre:
  - tipo di impatto;
  - file coinvolti;
  - endpoint coinvolti;
  - eventuale impatto DB;
  - risultato dei controlli tecnici;
- mantenere il comportamento pubblico invariato salvo correzione esplicita di bug/incoerenza;
- in caso di dubbio tecnico non applicare la modifica e documentare il motivo.

## 42. Obiettivi

- eliminare i rischi reali senza compromettere il funzionamento del sito;
- riallineare codice, DB e routing dove oggi divergono;
- rafforzare le aree sensibili backend/admin/Colli;
- ridurre le incoerenze che possono generare problemi futuri;
- lasciare il progetto più governabile e prevedibile per manutenzioni successive.

## 43. Interventi eseguiti dopo l'audit

- `P0` chiuso:
  - le route pubbliche `pages` ora espongono solo pagine `is_visible = true` e `is_draft = false`;
  - `GET /api/pages/:pageId/blocks` ora verifica prima la pagina e non espone più blocchi di pagine nascoste o in bozza;
  - aggiunto test unitario dedicato in `tests/unit/pages-public-routes.test.ts`.
- `P1` chiuso sulla coerenza eventi:
  - la pagina `eventi` nel DB è stata riallineata a `is_visible = true`;
  - `/eventi` torna coerente con route, nav, sitemap e contenuti CMS;
  - verificate route runtime su istanza locale separata `5002`.
- hardening Colli eseguito:
  - l'admin Colli non accetta più la sessione dell'admin principale come scorciatoia;
  - le tabelle `colli_*` hanno ora `RLS enabled` con policy `service_role only`.
- stabilità/coerenza Colli migliorata:
  - `/api/colli/menu` legge ora prima lo snapshot interno via DB e, se serve, prova il canale Supabase REST come secondo percorso interno;
  - il bridge Render non è più fallback automatico del runtime pubblico;
  - il bridge esterno resta solo opzione esplicita via env e viene rifiutato se i conteggi non coincidono con il baseline canonico `3/14/120/5/13/14`;
  - estratta logica condivisa di normalizzazione/metadati in `server/colli-menu-response.ts` per ridurre duplicazione fra route pubblica e adapter Supabase;
  - aggiornati anche i check/script Colli che ragionavano ancora sul vecchio stato da `11` vini.
- mismatch schema/runtime ridotto:
  - `page_blocks.published_snapshot` è stato aggiunto al DB e backfillato dai valori legacy;
  - `server/supabase-storage.ts` ora legge prima la colonna reale e mantiene il fallback legacy.
- riduzione superficie pubblica:
  - `/api/site-settings` non espone più `site_links`, `view_admin_url`, `view_site_url`;
  - la policy pubblica `site_settings` in Supabase è stata riallineata allo stesso perimetro.
- allineamenti secondari:
  - `client/src/App.tsx`: `colli` ed `eventi-privati` passano da `StaticPageRoute` a `PublicPageRoute`;
  - `client/src/pages/admin/seo.tsx`: copertura aggiunta per `colli` e `eventi-privati-cena`;
  - `.github/workflows/quality.yml`: aggiunto `workflow_dispatch` per recovery manuale.

## 44. Verifiche post-bonifica

- `npm run check`: OK
- `npm run lint`: OK
- `npm run audit`: OK, `0` vulnerabilità
- `npm run test`: OK, `10` file e `34` test
- `npm run build`: OK, con warning PostCSS non bloccante già noto
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5002 npm run test:e2e`: OK, `27/27`
- `npm run colli:db:check`: OK, sola lettura, nessuna scrittura
- verifiche browser reali su `5002`:
  - `/eventi`: OK, niente `404`
  - `/colli`: OK
  - `/api/site-settings`: perimetro ridotto alle chiavi pubbliche strettamente necessarie
- verifica runtime Colli dedicata su `5003`:
  - `curl /api/colli/menu`: `metadata.source = siteccv-supabase-snapshot`
  - conteggi serviti al pubblico: `3/14/120/5/13/14`
  - `stale = false`

## 45. Residuo intenzionalmente non toccato

- gestione SEO admin per `privacy`, `cookie` e `colli-menu`:
  - non estesa in questo passaggio perché richiede una decisione architetturale su pagine statiche fuori `pages`.
- tabella `menu_items_published` e tabella `users`:
  - non rimosse per evitare rimozioni senza prova completa di inutilizzo fuori repository.
- testo legale `cookie-policy`:
  - non modificato in questa tranche per evitare cambi su contenuti normativo-legali senza revisione dedicata.
- documentazione DNA:
  - migliorata nei punti critici, ma resta ancora estendibile su procedure operative e storia ridondante; non è ancora una base “esaustiva” in senso enterprise.
