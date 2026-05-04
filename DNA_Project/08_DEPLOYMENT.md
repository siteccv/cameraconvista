# 08 - Deployment e Infrastruttura

## Ambienti

### Sviluppo Locale
- **Comando**: `NODE_ENV=development npm run dev`
- **Porta**: 5000 (default) o configurabile via `PORT=XXXX`
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

### Obbligatorie (almeno uno dei due gruppi database)
| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL (se non si usa Supabase) |
| `SESSION_SECRET` | Secret per le sessioni |

Se nessuna variabile database è configurata, il server si arresta con errore esplicito (fail-fast).

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
| `OPENAI_API_KEY` | API key OpenAI per traduzioni admin |

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
| `vite.config.ts` | Configurazione Vite con alias progetto |
| `server/vite.ts` | Setup Vite dev server |
| `drizzle.config.ts` | Config Drizzle Kit |
| `package.json` | Modificare solo tramite packager tool |

## Pubblicazione

La pubblicazione del sito avviene su hosting Node standard:
- Build: `npm run build`
- Start: `npm run start`
- Dominio produzione: `https://www.cameraconvista.it`
- Database produzione: Supabase

**NOTA**: La "pubblicazione" del contenuto (draft → public) è un'operazione interna dell'app, non da confondere con il deployment dell'applicazione.
