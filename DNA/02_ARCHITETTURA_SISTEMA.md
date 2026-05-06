# 02 - Architettura del Sistema

---

## Aggiornamento Operativo - 6 Maggio 2026

Architettura confermata: React/Vite client, Express API, storage Supabase/PostgreSQL e layer admin separato. Il client ora applica route-level lazy loading sulle pagine secondarie e sull'area admin per alleggerire il bundle iniziale senza alterare il comportamento.

- Backup operativo corrente: `BACKUP/Backup_06_May_13-10.tar`
- Gate completo raccomandato: `npm run check:all`
- Ultima validazione locale confermata: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`
- Nota gate: `npm run audit` segnala ancora 2 vulnerabilita moderate transitive

## Diagramma Architetturale

```
┌─────────────────────────────────────────────┐
│                  BROWSER                     │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Public Site  │  │   Admin Panel        │  │
│  │ (Wouter)     │  │   (/admina/*)        │  │
│  └──────┬───────┘  └──────────┬───────────┘  │
│         │                     │              │
│  ┌──────┴─────────────────────┴───────────┐  │
│  │        TanStack React Query v5         │  │
│  │   (cache, mutations, invalidation)     │  │
│  └──────────────────┬─────────────────────┘  │
└─────────────────────┼───────────────────────┘
                      │ HTTP (fetch)
┌─────────────────────┼───────────────────────┐
│              EXPRESS SERVER                  │
│  ┌──────────────────┴─────────────────────┐  │
│  │    Modular Route Layer                 │  │
│  │  /api/*  (public)                      │  │
│  │  /api/admin/*  (auth required)         │  │
│  └──────────────────┬─────────────────────┘  │
│  ┌──────────────────┴─────────────────────┐  │
│  │    IStorage Interface                  │  │
│  │  ┌────────────┐  ┌─────────────────┐   │  │
│  │  │ Database   │  │ Supabase        │   │  │
│  │  │ Storage    │  │ Storage         │   │  │
│  │  │ (Drizzle)  │  │ (REST API)      │   │  │
│  │  └─────┬──────┘  └───────┬─────────┘   │  │
│  └────────┼─────────────────┼─────────────┘  │
└───────────┼─────────────────┼───────────────┘
            │                 │
    ┌───────┴──────┐  ┌───────┴──────┐
    │  PostgreSQL  │  │   Supabase   │
    │  (locale)    │  │   (Remote)   │
    └──────────────┘  └──────────────┘
```

## Frontend Architecture

### Context Providers (ordine di nesting in App.tsx)

```
QueryClientProvider
  └── TooltipProvider
       └── LanguageProvider        // Gestisce lingua IT/EN + helper t()
            └── AdminProvider      // Auth state, preview mode, device view
                 └── Router        // Wouter Switch con ScrollToTop
```

### Routing Strategy

**Componenti wrapper**:

- `PublicPageRoute`: Verifica che la pagina sia visibile (query `/api/pages`) prima di renderizzarla
- `ProtectedAdminRoute`: Verifica `isAuthenticated` da AdminContext, redirect a `/admina/login` se non autenticato
- `AdminLoginRoute`: Redirect a `/admina` se già autenticato

**Path pubblici**: `/`, `/menu`, `/lista-vini`, `/cocktail-bar`, `/eventi`, `/eventi/:id`, `/eventi-privati`, `/eventi-privati/aperitivo`, `/eventi-privati/esclusivo`, `/galleria`, `/dove-siamo`, `/privacy`, `/cookie`

**Path admin**: `/admina/login`, `/admina`, `/admina/events`, `/admina/gallery`, `/admina/media`, `/admina/preview`, `/admina/seo`, `/admina/settings`, `/admina/sync-google`

**Redirect**: `/carta-vini` → `/lista-vini`, `/contatti` → `/dove-siamo`, `/home` → `/`, `/en/*` → path canonico con `?lang=en`. La route `/eventi-privati/cena` reindirizza a `/eventi-privati` quando `PRIVATE_DINNER_ENABLED=false`.

**Code splitting**: Home, Menu, Carta Vini e Cocktail Bar restano eager; Eventi, Galleria, Dove Siamo, policy, sottopagine eventi privati e tutte le route admin sono lazy-loaded via `React.lazy()` + `Suspense`.

### State Management

- **Server State**: TanStack React Query v5 (cache, refetch, invalidation)
- **Admin State**: React Context (`AdminContext`) per auth, preview mode, device view
- **Language State**: React Context (`LanguageContext`) con persistenza localStorage
- **Form State**: react-hook-form con zodResolver per validazione

## Backend Architecture

### Middleware Stack (ordine in server/index.ts)

1. `helmet()` — Security headers automatici (X-Content-Type-Options, Referrer-Policy, X-Frame-Options, rimozione X-Powered-By). CSP e HSTS disabilitati intenzionalmente per compatibilità con Google Fonts, Supabase CDN e Vite dev mode
2. **Permissions-Policy** middleware custom — `camera=(), microphone=(), geolocation=()`
3. `cookieParser()` — parsing dei cookie per sessioni admin
4. `express.json()` — parsing body JSON con rawBody capture
5. `express.urlencoded()` — parsing form data
6. **Dev-only**: Disabilitazione ETag e `Cache-Control: no-store` per `/api/*` — evita risposte 304 che possono bloccare il client
7. Request logger — log delle API calls con timing e sintesi dei payload JSON, senza dump completi delle risposte
8. **SEO Middleware** (`server/seo.ts`) — wrappa `res.send/res.end` per iniettare meta tags (title, description, canonical, OG, Twitter Card, hreflang, JSON-LD) nell'HTML prima che venga servito. Usa `req.originalUrl` per identificare la pagina. Esclude `/admina` e asset statici. Dettagli completi in `11_SEO_SISTEMA.md`
9. **SEO Routes** — `/sitemap.xml` (dinamica), `robots.txt` (statico in `client/public/`)
10. **Session housekeeping** — dopo il seed iniziale il server ripulisce le `admin_sessions` scadute a startup e ogni 15 minuti

### Authentication Flow

1. Login: `POST /api/admin/login` → rate limiting (5 tentativi / 15 min) → verifica bcrypt hash → crea sessione con token random 32 bytes
2. Cookie: `ccv_admin_session`, httpOnly, secure (in produzione), 24h expiry, sameSite: lax
3. Auth check: `GET /api/admin/check-session` → verifica token in tabella `admin_sessions`
4. Middleware: `requireAuth` protegge tutte le route admin e upload endpoint
5. Password: Stored come bcrypt hash in `site_settings` con key `admin_password_hash`; la chiave legacy `admin_password` viene considerata solo se contiene gia un bcrypt hash migrabile
6. Fallback password: consentito solo in non-production se manca l'hash; in produzione il server fallisce esplicitamente

### Security Layer

> Dettagli completi: vedi `12_SICUREZZA_SITO.md`

- **Helmet**: Security headers su tutte le risposte HTTP
- **Rate limiting**: `express-rate-limit` su `/api/admin/login` (5 tentativi / 15 min)
- **Upload protection**: Tutti gli endpoint di upload richiedono autenticazione
- **No secret exposure**: Nessuna chiave sensibile (service_role, DATABASE_URL, OPENAI_API_KEY) esposta nel codice client
- **Supabase RLS**: Row Level Security attiva su tutte le tabelle, accesso anon limitato a SELECT pubblici

### Storage Abstraction

`IStorage` interface in `server/storage.ts` definisce tutte le operazioni CRUD. Due implementazioni:

1. **DatabaseStorage**: Usa Drizzle ORM con PostgreSQL diretto
2. **SupabaseStorage**: Usa Supabase REST API con conversione automatica camelCase↔snake_case

Per `pages`, `galleries` e `gallery_images`, quando esiste una connessione DB diretta (`SUPABASE_DB_URL` oppure `DATABASE_URL`) `SupabaseStorage` usa `server/sequence-maintenance.ts` per riservare il prossimo serial ID con `LOCK TABLE` + `setval` + `nextval`. Solo in assenza di accesso DB diretto resta il fallback conservativo `MAX(id)+1`.

Selezione runtime (fail-fast, deterministica):

```typescript
const HAS_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const HAS_DATABASE_URL = !!process.env.DATABASE_URL;
// Priorità: Supabase → PostgreSQL locale → errore esplicito (niente fallback ambigui)
```

### API Route Organization

Routes organizzate in moduli separati sotto `server/routes/`:

| File          | Public Routes                           | Admin Routes                                                                                                       |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `auth.ts`     | —                                       | login, logout, check-session, change-password                                                                      |
| `pages.ts`    | GET pages, GET page by slug, GET blocks | CRUD pages, CRUD blocks, publish, publish-all                                                                      |
| `menu.ts`     | GET menu-items, wines, cocktails        | CRUD menu-items, wines, cocktails                                                                                  |
| `events.ts`   | GET events (filtered by visibility)     | CRUD events (max 10)                                                                                               |
| `gallery.ts`  | GET galleries, GET gallery images       | CRUD galleries, CRUD gallery images                                                                                |
| `media.ts`    | GET media                               | CRUD media, upload (WebP auto-conversion, max 1920px, quality 80%), rotate (WebP re-compression), media categories |
| `settings.ts` | GET site-settings, footer               | PUT settings, footer                                                                                               |
| `sync.ts`     | —                                       | Google Sheets sync menu/vini/cocktail, configurazione CSV, publish snapshot                                        |
| `seo.ts`\*    | GET /sitemap.xml                        | — (middleware auto-injection)                                                                                      |

\*`seo.ts` non è nella cartella routes/ ma è un modulo separato montato direttamente in `server/index.ts`.

Helper condivisi in `helpers.ts`: `requireAuth`, `parseId`, `validateId`, `generateSessionToken`, `verifyPassword`.
