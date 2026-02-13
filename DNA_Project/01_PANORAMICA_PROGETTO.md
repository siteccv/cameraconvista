# 01 - Panoramica del Progetto

## Identità

**Nome**: Camera con Vista - Bistrot & Cocktail Bar  
**Tipo**: Sito web bilingue (IT/EN) per ristorante e cocktail bar a Bologna  
**URL Admin**: `/admina` (path segreto)  
**Password Admin predefinita**: `1909` (modificabile da Impostazioni)

## Obiettivi

1. Sito pubblico elegante e responsive per presentare menu, carta vini, cocktail bar, eventi, galleria fotografica e contatti
2. Pannello amministrativo completo con editing WYSIWYG diretto sulle pagine (click-to-edit)
3. Supporto bilingue nativo con traduzione automatica via OpenAI
4. Sistema draft/publish per separare le modifiche admin dal sito pubblico
5. Gestione media centralizzata con upload su Object Storage (GCS)
6. Gestione eventi con poster, prenotazioni e visibilità automatica
7. Galleria album con viewer Instagram Story (9:16)

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | Wouter (lightweight) |
| State | TanStack React Query v5 |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| Backend | Node.js + Express 5 |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Replit Neon-backed o Supabase) |
| Storage | Google Cloud Storage via Object Storage |
| AI | OpenAI (traduzione, generazione immagini) |
| Build | Vite (dev) + esbuild (prod) |

## Funzionalità Principali

### Sito Pubblico
- **Home**: Hero image, branding, logo, tagline, pulsante prenotazione
- **Menu**: Lista piatti per categoria con prezzi
- **Carta Vini**: Lista vini per categoria con regione, anno, prezzo
- **Cocktail Bar**: Lista cocktail per categoria
- **Eventi**: Griglia di poster 9:16 stile Instagram Story
- **Eventi Privati**: Pagina dedicata per eventi privati
- **Galleria**: Album con copertine, viewer slideshow
- **Contatti**: Informazioni di contatto

### Pannello Admin (`/admina`)
- **Sezioni Pagine**: Editing WYSIWYG di tutte le pagine con anteprima iPhone 15 Pro (393x852px) e scaling CSS deterministico.
- **Admin Control Center**: Sistema di blocco zoom globale per garantire coerenza visuale 1:1 durante l'editing.
- **Eventi**: CRUD completo con max 10 eventi
- **Galleria Album**: Gestione album e immagini con controlli ImageContainer
- **Libreria Media**: Upload, categorizzazione, gestione media
- **Anteprima**: Preview mobile avanzata con precisione pixel-perfect
- **SEO & Metadata**: Gestione meta tag per pagina (vedi `11_SEO_SISTEMA.md`)
- **Impostazioni**: Password, footer, configurazioni

### SEO Enterprise-Grade
- **robots.txt**: Blocca admin e API admin
- **Sitemap XML dinamica**: Pagine visibili + eventi attivi con hreflang IT/EN
- **Meta injection server-side**: Title, description, canonical, OG, Twitter Card, JSON-LD
- **JSON-LD**: Restaurant, Menu, Event, BreadcrumbList
- **Admin SEO panel**: Personalizzazione meta per pagina

## Flusso Draft/Publish

1. Admin modifica un contenuto → i campi correnti vengono aggiornati, `isDraft` diventa `true`
2. Il sito pubblico continua a servire il `publishedSnapshot` (ultimo stato pubblicato)
3. Admin clicca "Pubblica Sito" → snapshot corrente viene salvato in `publishedSnapshot`, `isDraft` diventa `false`
4. Il sito pubblico ora mostra i nuovi contenuti

## Doppio Backend

Il progetto supporta due backend database intercambiabili:
- **PostgreSQL diretto** (via `DATABASE_URL`): Usa Drizzle ORM (`DatabaseStorage`)
- **Supabase** (via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`): Usa `SupabaseStorage` con conversione automatica camelCase↔snake_case

La selezione è deterministica e fail-fast in `server/storage.ts`: Supabase ha priorità, poi PostgreSQL locale, altrimenti errore esplicito (nessun fallback silenzioso).

## Sicurezza

Il progetto implementa un livello di sicurezza avanzato (production-ready per progetto hospitality con admin privato):

### Backend Express
- **Helmet** attivo con security headers su tutte le risposte: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`
- **X-Powered-By** rimosso (tecnologia server nascosta)
- **Rate limiting login** attivo: 5 tentativi ogni 15 minuti per IP
- **Upload endpoint** protetto con autenticazione (`requireAuth`)
- **Password hash** con bcrypt, sessioni cookie httpOnly + secure in produzione
- Nessuna chiave sensibile esposta lato client

### Database (Supabase)
- **Row Level Security (RLS)** attiva su tutte le tabelle critiche
- Accesso `anon` limitato a SELECT consentiti per dati pubblici
- Scrittura consentita esclusivamente tramite backend con `service_role`
- Nessuna tabella pubblica esposta senza policy

> Dettagli completi: vedi `12_SICUREZZA_SITO.md`

## Portabilità

Il progetto è **100% portabile** fuori da Replit (Windsurf, macchina locale):
- `reusePort` rimosso dal server listen (evita crash su macOS/Windows)
- ETag disabilitato in dev per le API (evita 304 problematici)
- Plugin Vite `@replit/*` gated da `REPL_ID` (ignorati fuori Replit)
- Storage selection deterministica senza fallback ambigui
- Avvio locale: `NODE_ENV=development npm run dev` con `DATABASE_URL` o `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY`
