# 01 - Mappa Tecnica

## Scopo

Dare all'agent una mappa rapida del progetto reale: stack, entrypoint, percorsi e file critici.

## Stack

- Frontend: React 18 + TypeScript + Vite
- Routing: Wouter
- Data fetching: TanStack Query
- Backend: Express 5 + Node
- Database: PostgreSQL oppure Supabase
- Shared schema: Drizzle + Zod in `shared/schema.ts`
- Media: Supabase Storage
- Email richieste evento: Resend

## Entry point principali

- Frontend bootstrap: `client/src/main.tsx`
- Router app: `client/src/App.tsx`
- Server runtime: `server/index.ts`
- Storage selection: `server/storage.ts`
- Supabase storage runtime: `server/supabase-storage.ts`
- Build: `scripts/build.ts`

## Struttura utile

- `.github/`
  Workflow GitHub Actions per qualita e keepalive Supabase
- `attached_assets/`
  Asset importati dal bundle Vite, inclusi logo CCV, logo Colli e icona navbar Colli
- `client/src/pages/`
  Pagine pubbliche e admin
- `client/src/components/`
  UI, layout, admin, componenti condivisi
- `client/src/contexts/`
  Auth admin, lingua, stato preview
- `client/src/hooks/`
  Hook condivisi, incluso il flusso page blocks
- `server/routes/`
  Route pubbliche e admin
- `shared/schema.ts`
  Contratto dati condiviso
- `shared/colli.ts`
  Contratto dati Colli e helper di validazione/conteggio
- `scripts/`
  Build e utility operative
- `migrations/`
  SQL revisionabili/applicati per integrazione Colli e impostazioni correlate
- `LOGOS/`
  Sorgenti/logo storici e operativi. Non e runtime primario, ma alcuni script storici media lo referenziano.

Utility Colli sicure:

- `npm run colli:db:check`
  Controllo read-only stato CMS `/colli`, tabelle `colli_*` e sorgente Render.
- `npm run colli:import:dry-run`
  Piano import Colli senza scritture database.
- `npm run colli:import`
  Import controllato nelle sole tabelle `colli_*`; si blocca se trova dati esistenti senza `--replace`.

## Stato operativo aggiornato al 2026-05-13

Il progetto locale contiene l'integrazione Colli dentro SITE-CCV.

Stato pubblico:

- `/colli` e una vetrina pubblica gestita dal CMS SITE-CCV;
- `/colli/menu` e il menu digitale diretto per QR;
- il QR definitivo deve puntare a `/colli/menu`, non alla vetrina;
- la navbar principale mostra Colli tramite asset ottimizzato `attached_assets/colli-nav.webp`.

Stato admin:

- `/admina` resta il pannello globale SITE-CCV;
- admin SITE-CCV gestisce anche la vetrina `/colli` e il numero WhatsApp del CTA Prenota;
- `/colli/admina` e il login separato Colli da ingranaggio del menu digitale;
- `/colli/admina/panel` gestisce solo il menu digitale Colli;
- `/colli/admin` e `/colli/admin/panel` sono solo redirect di compatibilita verso `/colli/admina`.

Stato dati:

- dati CCV principali restano in flussi separati `menu_items`, `wines`, `cocktails`, eventi, gallery e sync Google;
- dati Colli vivono in tabelle dedicate `colli_*`;
- il menu pubblico Colli legge snapshot interno Supabase da `colli_menu_snapshots`;
- Render Colli resta solo riferimento/fallback, non runtime primario desiderato.

Stato pulizia:

- `ccv-colli-source/` e stata rimossa dal workspace perche non funzionale al runtime SITE-CCV;
- `BACKUP/` mantiene solo backup finale operativo e snapshot DB finale;
- rimossi i componenti home non referenziati `PhilosophySection.tsx` e `TeaserCard.tsx`;
- il commit principale di integrazione Colli e stato gia pubblicato su `main`; le modifiche successive seguono commit normali su differenze reali.

## Runtime reale

- `App.tsx` monta provider lingua, admin e query client
- Le pagine principali pubbliche restano eager
- Pagine secondarie e admin sono lazy-loaded
- Il server Express monta route API, housekeeping sessioni e SEO middleware
- In produzione il server serve `dist/public` e inietta SEO server-side

## Route pubbliche principali

- `/`
- `/menu`
- `/lista-vini`
- `/cocktail-bar`
- `/eventi`
- `/eventi/:id`
- `/eventi-privati`
- `/eventi-privati/aperitivo`
- `/eventi-privati/esclusivo`
- `/colli`
- `/colli/menu`
- `/galleria`
- `/dove-siamo`
- `/privacy`
- `/cookie`

Redirect attivi:

- `/carta-vini` -> `/lista-vini`
- `/contatti` -> `/dove-siamo`
- `/home` -> `/`
- `/en/*` -> path canonico con `?lang=en`

## Route admin principali

- `/admina/login`
- `/admina`
- `/admina/events`
- `/admina/gallery`
- `/admina/media`
- `/admina/preview`
- `/admina/seo`
- `/admina/settings`
- `/admina/sync-google`

## File critici da leggere prima di toccare logiche

- `server/index.ts`
- `server/storage.ts`
- `server/supabase-storage.ts`
- `server/routes/auth.ts`
- `server/routes/pages.ts`
- `server/routes/menu.ts`
- `server/routes/settings.ts`
- `server/routes/sync.ts`
- `server/seo.ts`
- `client/src/App.tsx`
- `client/src/hooks/use-page-blocks.ts`
- `client/src/components/layout/Header.tsx`

## File operativi root

- `README_OPERATIVO.md`
- `GITHUB_PUSH_GUIDE.md`

I file root diversi da questi devono essere eccezioni motivate. Lo storico non operativo va lasciato fuori dal runtime documentale attivo e, se serve, recuperato da Git o dai backup.

## Componenti da non rimuovere per supposizione

Non rimuovere senza una verifica dedicata:

- componenti `client/src/components/ui/*` anche se non tutti sono usati oggi, perche sono parte del kit UI disponibile;
- `LOGOS/`, perche contiene sorgenti/logo e riferimenti da script storici media;
- `migrations/`, perche documenta lo stato DB applicato;
- `.github/`, perche contiene quality gate e keepalive Supabase;
- script Supabase/media storici, se non sono stati prima classificati e approvati per archiviazione.
