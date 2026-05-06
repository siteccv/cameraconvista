# 08 - Deployment e Infrastruttura

---

## Aggiornamento Operativo - 6 Maggio 2026

La sequenza raccomandata prima di push/deploy e `npm run check:all`, ora comprensiva di check, lint, format, audit, build, coverage e Playwright E2E. La build continua a produrre `dist/` come artefatto runtime.

- Backup operativo corrente: `BACKUP/Backup_06_May_11-53.tar`
- Gate locale richiesto: `npm run check:all`
- Stato gate: verde al termine dell hardening locale

## Ambienti

### Sviluppo Locale

- **Comando**: `NODE_ENV=development npm run dev`
- **Porta codice default**: 5000 se `PORT` non e impostata
- **Porta operativa corrente**: 5001 (`PORT=5001 npm run dev`)
- **Env richieste**: `DATABASE_URL` oppure `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- **Server listen**: Nessun flag speciale (`reusePort` rimosso per compatibilità macOS/Windows)
- **Vite**: HMR attivo, serve frontend e backend sulla stessa porta
- **ETag API**: Disabilitato in dev per evitare 304 problematici

### Produzione

- **Build**: `npm run build` → `tsx script/build.ts`
  - esbuild compila il server TypeScript in `dist/index.cjs`
  - Vite build compila il frontend in `dist/public/`
- **Start**: `npm run start` → `NODE_ENV=production node dist/index.cjs`
- **Static**: `server/static.ts` serve i file compilati

## Variabili d'Ambiente

### Obbligatorie runtime (almeno uno dei due gruppi database)

| Variabile      | Descrizione                                           |
| -------------- | ----------------------------------------------------- |
| `DATABASE_URL` | Connection string PostgreSQL (se non si usa Supabase) |

Se nessuna variabile database è configurata, il server si arresta con errore esplicito (fail-fast).

Nota: `SESSION_SECRET` non e usato dal flusso sessione admin corrente. Le sessioni usano token random salvati in `admin_sessions` e cookie httpOnly `ccv_admin_session`.

### Opzionali - Supabase

| Variabile                   | Descrizione                  |
| --------------------------- | ---------------------------- |
| `SUPABASE_URL`              | URL progetto Supabase        |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave service role Supabase |
| `SUPABASE_ANON_KEY`         | Chiave anonima Supabase      |

Se `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` sono configurate, il backend usa `SupabaseStorage` (priorità). Altrimenti usa `DatabaseStorage` con `DATABASE_URL`. Se nessuno è presente, errore esplicito.

### Opzionali - AI

| Variabile        | Descrizione                         |
| ---------------- | ----------------------------------- |
| `OPENAI_API_KEY` | API key OpenAI per traduzioni admin |

### Opzionali - Email / Resend

| Variabile              | Descrizione                                |
| ---------------------- | ------------------------------------------ |
| `RESEND_API_KEY`       | Invio richieste eventi privati             |
| `RESEND_SENDER_DOMAIN` | Dominio mittente verificato o `resend.dev` |
| `EVENT_REQUEST_EMAIL`  | Email destinataria richieste eventi        |

### Opzionali - Client / Test / GitHub

| Variabile                | Descrizione                            |
| ------------------------ | -------------------------------------- |
| `VITE_SUPABASE_URL`      | URL Supabase per client browser        |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase per client browser   |
| `PLAYWRIGHT_BASE_URL`    | Base URL per E2E esterni               |
| `GITHUB_URL`             | URL repository per operativita locale  |
| `GITHUB_TOKEN`           | Token GitHub locale, mai da committare |

## Database

### PostgreSQL Diretto (Default senza Supabase)

- Qualsiasi PostgreSQL raggiungibile via `DATABASE_URL`
- Drizzle ORM per schema management
- `drizzle-kit push` per sincronizzazione schema

### Supabase (Alternativo)

- Richiede `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- Due client: `supabaseAdmin` (service role) e `supabasePublic` (anon key)
- REST API per operazioni CRUD
- Conversione automatica camelCase ↔ snake_case

### Supabase Keepalive Free

- Workflow: `.github/workflows/supabase-keepalive.yml`
- Script: `scripts/supabase-keepalive.sh`
- Frequenza: una volta al giorno via GitHub Actions (`cron: "20 3 * * *"`) e avvio manuale con `workflow_dispatch`
- Metodo: lettura REST anonima e leggera su `pages?select=id&limit=1`
- Sicurezza: usa solo `SUPABASE_URL` e `SUPABASE_ANON_KEY`; non usa service role, non scrive dati e non modifica la logica runtime dell'app
- Resilienza: `curl` con timeout, retry automatici e fallimento esplicito in caso di HTTP non valido
- Secrets GitHub richiesti: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### Migrazioni

- **NON** usare migrazioni manuali SQL
- Usare `npm run db:push` (o `--force` se necessario)
- Drizzle Kit sincronizza lo schema da `shared/schema.ts` al database
- Config: `drizzle.config.ts` (NON MODIFICARE)

## Media Storage

### Supabase Storage

- Bucket pubblico: `media-public`
- Directory `public/`: asset pubblici
- Upload amministrativo tramite backend Express e `supabaseAdmin.storage`
- Ottimizzazione immagini server-side con `sharp` e conversione WebP

### Media Upload Pipeline

```
1. Frontend seleziona file
2. Upload a `/api/admin/uploads/direct`
3. Il backend ottimizza l'immagine con `sharp`
4. Upload su Supabase Storage
5. URL salvato nel database (tabella media)
```

## Build System

### Development

```
Vite Dev Server → HMR per React
tsx → Runtime TypeScript per Express
Entrambi sulla porta configurata con `PORT`; standard operativo corrente `5001`
```

### Production Build

```
1. script/build.ts → esbuild per server
   - Input: server/index.ts
   - Output: dist/index.cjs (CommonJS)
   - External: tutte le node_modules

2. Vite build → per client
   - Input: client/src/main.tsx
   - Output: dist/public/ (HTML, JS, CSS, assets)
```

## File NON Modificabili

| File                | Motivo                                 |
| ------------------- | -------------------------------------- |
| `vite.config.ts`    | Configurazione Vite con alias progetto |
| `server/vite.ts`    | Setup Vite dev server                  |
| `drizzle.config.ts` | Config Drizzle Kit                     |
| `package.json`      | Modificare solo tramite packager tool  |

## Pubblicazione

La pubblicazione del sito avviene su hosting Node standard:

- Build: `npm run build`
- Start: `npm run start`
- Dominio produzione: `https://www.cameraconvista.it`
- Database produzione: Supabase

**NOTA**: La "pubblicazione" del contenuto (draft → public) è un'operazione interna dell'app, non da confondere con il deployment dell'applicazione.

## GitHub Actions

### Quality

- File: `.github/workflows/quality.yml`
- Trigger: `push` su `main` e `pull_request`
- Step: `npm ci`, check, lint, format check, audit, build, coverage, E2E se le env Supabase sono disponibili
- Secrets usati: Supabase, Database, OpenAI, Resend e Vite env secondo necessita

### Supabase Keepalive

- File: `.github/workflows/supabase-keepalive.yml`
- Trigger: schedulato ogni giorno e manuale (`workflow_dispatch`)
- Secrets richiesti: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Metodo: lettura REST read-only su `pages?select=id&limit=1`
