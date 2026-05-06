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

- `client/src/pages/`
  Pagine pubbliche e admin
- `client/src/components/`
  UI, layout, admin, componenti condivisi
- `client/src/contexts/`
  Auth admin, lingua, stato preview
- `client/src/hooks/`
  Hook condivisi, inclusi preload e page blocks
- `server/routes/`
  Route pubbliche e admin
- `shared/schema.ts`
  Contratto dati condiviso
- `scripts/`
  Build e utility operative

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
- `client/src/hooks/use-image-preloader.ts`

## File operativi root

- `README_OPERATIVO.md`
- `GITHUB_PUSH_GUIDE.md`

I file root diversi da questi devono essere eccezioni motivate. Il resto della documentazione deve stare in `DNA/` oppure in `report/`.
