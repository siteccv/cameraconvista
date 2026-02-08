# 08 - Deployment e Infrastruttura

## Ambienti

### Sviluppo (Replit)
- **Comando**: `npm run dev` → `NODE_ENV=development tsx server/index.ts`
- **Porta**: 5000 (unica porta non firewalled su Replit)
- **Vite**: HMR attivo, serve frontend e backend sulla stessa porta
- **Database**: PostgreSQL (Neon-backed) via `DATABASE_URL`
- **ETag API**: Disabilitato in dev per evitare 304 problematici

### Sviluppo (Locale / Windsurf)
- **Comando**: `NODE_ENV=development npm run dev`
- **Porta**: 5000 (default) o configurabile via `PORT=XXXX`
- **Env richieste**: `DATABASE_URL` oppure `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- **Plugin Replit**: Ignorati automaticamente (gated da `REPL_ID`)
- **Server listen**: Nessun flag speciale (`reusePort` rimosso per compatibilità macOS/Windows)

### Produzione
- **Build**: `npm run build` → `tsx script/build.ts`
  - esbuild compila il server TypeScript in `dist/index.cjs`
  - Vite build compila il frontend in `dist/public/`
- **Start**: `npm run start` → `NODE_ENV=production node dist/index.cjs`
- **Static**: `server/static.ts` serve i file compilati

## Variabili d'Ambiente

### Obbligatorie (almeno uno dei due gruppi database)
| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL (se non si usa Supabase) |
| `SESSION_SECRET` | Secret per le sessioni |

Se nessuna variabile database è configurata, il server si arresta con errore esplicito (fail-fast).

### Object Storage
| Variabile | Descrizione |
|-----------|-------------|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | ID bucket GCS |
| `PRIVATE_OBJECT_DIR` | Directory oggetti privati |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Path ricerca oggetti pubblici |

### Opzionali - Supabase
| Variabile | Descrizione |
|-----------|-------------|
| `SUPABASE_URL` | URL progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave service role Supabase |
| `SUPABASE_ANON_KEY` | Chiave anonima Supabase |

Se `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` sono configurate, il backend usa `SupabaseStorage` (priorità). Altrimenti usa `DatabaseStorage` con `DATABASE_URL`. Se nessuno è presente, errore esplicito.

### Opzionali - AI
| Variabile | Descrizione |
|-----------|-------------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | API key OpenAI |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Base URL OpenAI (Replit proxy) |

## Database

### PostgreSQL Diretto (Default senza Supabase)
- Su Replit: provisioned automaticamente
- In locale: qualsiasi PostgreSQL raggiungibile via `DATABASE_URL`
- Drizzle ORM per schema management
- `drizzle-kit push` per sincronizzazione schema

### Supabase (Alternativo)
- Richiede `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- Due client: `supabaseAdmin` (service role) e `supabasePublic` (anon key)
- REST API per operazioni CRUD
- Conversione automatica camelCase ↔ snake_case

### Migrazioni
- **NON** usare migrazioni manuali SQL
- Usare `npm run db:push` (o `--force` se necessario)
- Drizzle Kit sincronizza lo schema da `shared/schema.ts` al database
- Config: `drizzle.config.ts` (NON MODIFICARE)

## Object Storage

### Google Cloud Storage (via Replit)
- Bucket: `repl-default-bucket-$REPL_ID`
- Directory `public/`: asset pubblici
- Directory `.private/`: file privati
- Upload via presigned URLs (AWS S3-compatible)
- Componente frontend: `ObjectUploader`
- Hook: `use-upload.ts`

### Media Upload Pipeline
```
1. Frontend seleziona file
2. Richiesta presigned URL → Object Storage
3. Upload diretto a GCS
4. URL salvato nel database (tabella media)
5. Opzionale: resize con sharp server-side
```

## Build System

### Development
```
Vite Dev Server → HMR per React
tsx → Runtime TypeScript per Express
Entrambi sulla porta 5000
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

| File | Motivo |
|------|--------|
| `vite.config.ts` | Configurazione Vite con alias e plugin Replit |
| `server/vite.ts` | Setup Vite dev server |
| `drizzle.config.ts` | Config Drizzle Kit |
| `package.json` | Modificare solo tramite packager tool |

## Workflow Replit

Il workflow "Start application" esegue `npm run dev`:
- Auto-restart dopo modifiche ai file
- Auto-restart dopo installazione pacchetti
- Log visibili nella console Replit

## Pubblicazione

La pubblicazione del sito (rendere l'app accessibile pubblicamente) avviene tramite Replit Deployments:
- Dominio `.replit.app` o custom domain
- Build automatica, health checks, TLS
- L'utente deve cliccare manualmente il pulsante "Publish"

**NOTA**: La "pubblicazione" del contenuto (draft → public) è un'operazione interna dell'app, non da confondere con il deployment dell'applicazione.
