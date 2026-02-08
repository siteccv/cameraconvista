# 02 - Architettura del Sistema

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

**Path pubblici**: `/`, `/menu`, `/lista-vini`, `/cocktail-bar`, `/eventi`, `/eventi/:id`, `/eventi-privati`, `/galleria`, `/contatti`

**Path admin**: `/admina/login`, `/admina`, `/admina/events`, `/admina/gallery`, `/admina/media`, `/admina/preview`, `/admina/seo`, `/admina/settings`

**Redirect**: `/carta-vini` → `/lista-vini` (301)

### State Management

- **Server State**: TanStack React Query v5 (cache, refetch, invalidation)
- **Admin State**: React Context (`AdminContext`) per auth, preview mode, device view
- **Language State**: React Context (`LanguageContext`) con persistenza localStorage
- **Form State**: react-hook-form con zodResolver per validazione

## Backend Architecture

### Middleware Stack (ordine in server/index.ts)

1. `cookieParser()` — parsing dei cookie per sessioni admin
2. `express.json()` — parsing body JSON con rawBody capture
3. `express.urlencoded()` — parsing form data
4. **Dev-only**: Disabilitazione ETag e `Cache-Control: no-store` per `/api/*` — evita risposte 304 che possono bloccare il client
5. Request logger — log delle API calls con timing

### Authentication Flow

1. Login: `POST /api/admin/login` → verifica bcrypt hash → crea sessione con token random 32 bytes
2. Cookie: `ccv_admin_session`, httpOnly, 24h expiry, sameSite: lax
3. Auth check: `GET /api/admin/check-session` → verifica token in tabella `admin_sessions`
4. Middleware: `requireAuth` protegge tutte le route admin
5. Password: Stored come bcrypt hash in `site_settings` con key `admin_password_hash`

### Storage Abstraction

`IStorage` interface in `server/storage.ts` definisce tutte le operazioni CRUD. Due implementazioni:

1. **DatabaseStorage**: Usa Drizzle ORM con PostgreSQL diretto
2. **SupabaseStorage**: Usa Supabase REST API con conversione automatica camelCase↔snake_case

Selezione runtime (fail-fast, deterministica):
```typescript
const HAS_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const HAS_DATABASE_URL = !!process.env.DATABASE_URL;
// Priorità: Supabase → PostgreSQL locale → errore esplicito (niente fallback ambigui)
```

### API Route Organization

Routes organizzate in moduli separati sotto `server/routes/`:

| File | Public Routes | Admin Routes |
|------|--------------|--------------|
| `auth.ts` | — | login, logout, check-session, change-password |
| `pages.ts` | GET pages, GET page by slug, GET blocks | CRUD pages, CRUD blocks, publish, publish-all |
| `menu.ts` | GET menu-items, wines, cocktails | CRUD menu-items, wines, cocktails |
| `events.ts` | GET events (filtered by visibility) | CRUD events (max 10) |
| `gallery.ts` | GET galleries, GET gallery images | CRUD galleries, CRUD gallery images |
| `media.ts` | GET media | CRUD media, upload, media categories |
| `settings.ts` | GET site-settings, footer | PUT settings, footer |
| `sync.ts` | — | Google Sheets sync (placeholder) |

Helper condivisi in `helpers.ts`: `requireAuth`, `parseId`, `validateId`, `generateSessionToken`, `verifyPassword`.
