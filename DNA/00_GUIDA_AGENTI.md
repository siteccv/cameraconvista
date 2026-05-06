# 00 - Guida Operativa per Agenti

---

## Scopo

Questo e il file da leggere per primo. Serve a dare a qualsiasi agente una visione operativa completa del progetto Camera con Vista prima di leggere i file specialistici `01`-`12`.

Il sito e live. Menu, pagine pubbliche, pannello admin, media, email eventi privati, sync Google Sheets, Supabase e SEO sono funzionalita operative. Ogni intervento deve partire dal presupposto che clienti reali possano consultare il sito in quel momento.

## Regola Primaria

Non compromettere mai sito pubblico, menu, funzionalita clienti, pannello admin, database live, media Supabase, sincronizzazioni o email.

Prima di modificare codice o configurazioni:

- Capire esattamente file e logica coinvolti.
- Preferire interventi chirurgici e reversibili.
- Non cambiare layout, testi, logiche, routing o flussi se non richiesto esplicitamente.
- Non scrivere dati nel database live salvo richiesta esplicita.
- Non lanciare sync Google Sheets salvo richiesta esplicita.
- Non inviare email reali salvo richiesta esplicita.
- Non stampare segreti, token o chiavi in chat/log.
- Non committare `.env`, backup, `node_modules`, `dist`, coverage o artefatti generati.

## Stato Corrente Verificato

- Branch operativo: `main`.
- Repository GitHub: `https://github.com/siteccv/cameraconvista.git`.
- Ultimi commit rilevanti:
  - `2a3f90f` - riallineamento SEO a tapas bar, aperitivo, cocktail bar ed eventi privati.
  - `b053312` - hardening enterprise, aggiornamento DNA e backup docs.
  - `8d4f784` - workflow keepalive Supabase.
  - `d68aa4f` - aggiornamento checkout action keepalive.
- Workflow GitHub attivi:
  - `Quality` su push main e pull request.
  - `Supabase Keepalive` schedulato ogni giorno e manuale.
- Ultimo gate locale completo richiesto: `npm run check:all`.
- Ultime modifiche locali documentate: aggiornamento copy del `BookingDialog`, CTA "Prenota un tavolo" aggiunto in fondo a Menu e Cocktail Bar, riallineamento whitelist pubblica `site_settings`.
- Backup operativo corrente: `BACKUP/Backup_06_May_11-53.tar`.
- Ultimo refresh backup: 6 Maggio 2026 11:53 Europe/Rome, archivio locale creato dopo aggiornamento DNA, booking flow e hardening `site_settings`.
- `BACKUP/` e `*.tar` sono esclusi da Git.

## Mappa Documentazione DNA

| File                         | Scopo                                                |
| ---------------------------- | ---------------------------------------------------- |
| `00_GUIDA_AGENTI.md`         | Entry point operativo per agenti                     |
| `01_PANORAMICA_PROGETTO.md`  | Identita, obiettivi, stack e stato generale          |
| `02_ARCHITETTURA_SISTEMA.md` | Architettura frontend/backend, routing, storage, API |
| `03_STRUTTURA_FILE.md`       | Struttura cartelle e file principali                 |
| `04_PAGINE_E_COMPONENTI.md`  | Pagine pubbliche, componenti admin, hook e layout    |
| `05_LOGICA_APPLICATIVA.md`   | Logiche draft/publish, sync, media, SEO, footer      |
| `06_PANNELLO_ADMIN.md`       | Funzioni admin e workflow di pubblicazione contenuti |
| `07_DATABASE_SCHEMA.md`      | Tabelle, snapshot, RLS e naming DB                   |
| `08_DEPLOYMENT.md`           | Env, build, CI, deploy, Supabase, keepalive          |
| `09_CONVENZIONI_CODICE.md`   | Convenzioni codice, Git, backup e commit             |
| `10_GUIDA_DEBUGGING.md`      | Debug, checklist e problemi noti                     |
| `11_SEO_SISTEMA.md`          | SEO server-side, sitemap, robots, JSON-LD            |
| `12_SICUREZZA_SITO.md`       | Sicurezza backend, DB, RLS e rischi                  |

## Comandi Standard

### Avvio locale

```bash
PORT=5001 npm run dev
```

Il codice usa `5000` come default se `PORT` non e impostata. Operativamente questo progetto viene avviato su `5001` per evitare conflitti.

### Gate completo

```bash
npm run check:all
```

Esegue: typecheck, lint, format check, audit, build, coverage unit e smoke E2E.

### Singoli controlli

```bash
npm run check
npm run lint
npm run format:check
npm run audit
npm run build
npm run test:coverage
npm run test:e2e
```

### Keepalive Supabase locale

```bash
npm run supabase:keepalive
```

Usa solo `SUPABASE_URL` e `SUPABASE_ANON_KEY`, effettua una lettura REST su `pages?select=id&limit=1`, non scrive dati.

## Runtime vs Tooling

| Area                                               | Impatto live | Note operative                                                  |
| -------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| `client/src/pages/*`                               | Alto         | Pagine pubbliche e admin, modificare solo se richiesto          |
| `server/routes/*`                                  | Alto         | API pubbliche/admin, possibili scritture DB o email             |
| `server/storage.ts` / `server/supabase-storage.ts` | Molto alto   | Accesso dati live e conversione Supabase                        |
| `shared/schema.ts`                                 | Molto alto   | Schema DB e tipi condivisi                                      |
| `server/seo.ts`                                    | Alto         | Meta, sitemap, canonical, JSON-LD                               |
| `.github/workflows/*`                              | Medio        | CI/keepalive, non cambia runtime app ma puo bloccare deploy     |
| `scripts/*`                                        | Medio/alto   | Alcuni script migrano/uploadano dati; leggere prima di eseguire |
| `DNA/*` e `report/*`                               | Basso        | Documentazione, non impatta runtime                             |
| `package.json` / lockfile                          | Medio/alto   | Dipendenze e script, richiede gate completo                     |

## Operazioni Che Scrivono Dati

Non eseguire senza richiesta esplicita:

- `npm run db:push`.
- Endpoint admin `POST/PATCH/DELETE`.
- `POST /api/admin/sync/*`.
- `POST /api/admin/sync/publish-*`.
- `POST /api/admin/publish-all`.
- Script di migrazione/upload in `scripts/`.
- Upload media o rotazioni immagini.
- Invio richieste evento private reali.

## Endpoint Critici

### Pubblici read-only

- `GET /api/pages`
- `GET /api/pages/:pageId/blocks`
- `GET /api/menu-items`
- `GET /api/wines`
- `GET /api/cocktails`
- `GET /api/events`
- `GET /api/galleries`
- `GET /api/media`
- `GET /api/footer-settings`
- `GET /sitemap.xml`
- `GET /robots.txt`

### Admin protetti

- `/api/admin/login`, `/api/admin/logout`, `/api/admin/check-session`, `/api/admin/change-password`
- `/api/admin/pages`, `/api/admin/page-blocks`, `/api/admin/publish-all`
- `/api/admin/events`
- `/api/admin/galleries`
- `/api/admin/media`, `/api/admin/uploads`, `/api/admin/media-categories`
- `/api/admin/settings`, `/api/admin/footer-settings`, `/api/admin/translate`
- `/api/admin/sync/*`

### Pubblici con effetti esterni

- `POST /api/event-request` invia email tramite Resend se configurato.
- `GET /api/health/email` e diagnostico read-only.

## Routing Pubblico Corrente

- `/` home.
- `/menu` menu.
- `/lista-vini` carta vini.
- `/carta-vini` redirect a `/lista-vini`.
- `/cocktail-bar` cocktail bar.
- `/eventi` eventi.
- `/eventi/:id` dettaglio evento.
- `/eventi-privati` pagina statica eventi privati.
- `/eventi-privati/aperitivo` sottopagina attiva.
- `/eventi-privati/cena` reindirizza a `/eventi-privati` quando `PRIVATE_DINNER_ENABLED=false`.
- `/eventi-privati/esclusivo` sottopagina attiva.
- `/galleria` galleria.
- `/dove-siamo` contatti/dove siamo.
- `/contatti` redirect a `/dove-siamo`.
- `/privacy` privacy policy.
- `/cookie` cookie policy.

## Eventi Privati

La card e la sottopagina Cena sono disattivate senza cancellazione codice tramite:

```typescript
client / src / lib / private - events - config.ts;
PRIVATE_DINNER_ENABLED = false;
```

Effetti:

- La card Cena non appare in `/eventi-privati`.
- La voce Cena non appare nella sezione pagine admin.
- `/eventi-privati/cena` reindirizza a `/eventi-privati`.
- Il codice della pagina Cena resta presente per eventuale ripristino controllato.

## Env e Secrets

Non stampare mai valori reali. Per verifiche mostrare solo presenza/assenza.

| Variabile                     | Uso                            | Dove                                    |
| ----------------------------- | ------------------------------ | --------------------------------------- |
| `SUPABASE_URL`                | Backend Supabase e keepalive   | local, hosting, GitHub secrets          |
| `SUPABASE_SERVICE_ROLE_KEY`   | Backend server-side Supabase   | local, hosting, GitHub Quality          |
| `SUPABASE_ANON_KEY`           | Client pubblico/keepalive REST | local, hosting, GitHub secrets          |
| `DATABASE_URL`                | PostgreSQL diretto / Drizzle   | local, hosting, GitHub Quality se usato |
| `SUPABASE_DB_URL`             | URL DB Supabase di riferimento | local/docs                              |
| `VITE_SUPABASE_URL`           | Client browser                 | local, hosting, GitHub Quality          |
| `VITE_SUPABASE_ANON_KEY`      | Client browser                 | local, hosting, GitHub Quality          |
| `OPENAI_API_KEY`              | Traduzioni admin               | local, hosting, GitHub Quality          |
| `RESEND_API_KEY`              | Email eventi privati           | local, hosting, GitHub Quality          |
| `RESEND_SENDER_DOMAIN`        | Dominio mittente email         | local, hosting, GitHub Quality          |
| `EVENT_REQUEST_EMAIL`         | Destinatario richieste eventi  | local, hosting, GitHub Quality          |
| `PORT`                        | Porta server                   | local/hosting                           |
| `PLAYWRIGHT_BASE_URL`         | Test E2E opzionale             | local/CI                                |
| `GITHUB_URL` / `GITHUB_TOKEN` | Operativita GitHub locale      | local only                              |

Nota: `SESSION_SECRET` non e una variabile usata dal flusso sessione admin attuale. Le sessioni usano token random salvati in `admin_sessions` e cookie `ccv_admin_session`.

## GitHub Actions

### Quality

File: `.github/workflows/quality.yml`

Trigger:

- `push` su `main`.
- `pull_request`.

Step:

- `npm ci`
- `npm run check`
- `npm run lint`
- `npm run format:check`
- `npm run audit`
- `npm run build`
- `npm run test:coverage`
- Playwright E2E solo se env Supabase necessarie sono presenti.

### Supabase Keepalive

File: `.github/workflows/supabase-keepalive.yml`

- Schedulato ogni giorno alle `03:20 UTC`.
- Avvio manuale con `workflow_dispatch`.
- Script: `scripts/supabase-keepalive.sh`.
- Secrets richiesti: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Esegue solo lettura REST leggera su `pages?select=id&limit=1`.

## Procedura Sicura Prima di Modifiche

1. Leggere questo file.
2. Leggere i file DNA specialistici coinvolti.
3. Ispezionare il codice reale prima di fidarsi della documentazione.
4. Controllare `git status -sb --ignored`.
5. Identificare file esatti da toccare.
6. Evitare refactor non richiesti.
7. Eseguire almeno il controllo pertinente; per modifiche codice o dipendenze usare `npm run check:all`.
8. Non committare artefatti ignorati.

## Procedura Commit/Push

Usare solo se richiesto esplicitamente.

1. `git status -sb --ignored`.
2. `git diff --stat`.
3. Eseguire gate richiesto, preferibilmente `npm run check:all`.
4. Stagiare solo file pertinenti.
5. Commit con messaggio chiaro.
6. `git push github main`.
7. Verificare `git ls-remote github refs/heads/main`.
8. Verificare workflow GitHub Actions.

## Backup Policy

Formato corrente:

```text
BACKUP/Backup_<giorno>_<Mese>_<HH-MM>.tar
```

Escludere sempre:

- `.git`
- `node_modules`
- `dist`
- `BACKUP`
- `coverage`
- `test-results`
- `.env`
- `.env.*`

I backup restano locali e non vengono committati salvo richiesta esplicita contraria.

## Rischi Residui Da Ricordare

- Il sito e live: anche cambi piccoli possono impattare menu o admin.
- Supabase `service_role` bypassa RLS: mai esporla client-side.
- Google Sheets sync aggiorna tabelle draft e publish salva snapshot pubblici.
- SEO server-side usa Express e DB: errori possono impattare crawling.
- Event request invia email reali se chiamato con payload valido.
- Alcuni report storici possono contenere informazioni obsolete; usare `DNA` e codice reale come fonte primaria.
