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
- **Sezioni Pagine**: Editing WYSIWYG di tutte le pagine
- **Eventi**: CRUD completo con max 10 eventi
- **Galleria Album**: Gestione album e immagini
- **Libreria Media**: Upload, categorizzazione, gestione media
- **Anteprima**: Preview mobile (iPhone 15 Pro frame)
- **SEO & Metadata**: Gestione meta tag per pagina
- **Impostazioni**: Password, footer, configurazioni

## Flusso Draft/Publish

1. Admin modifica un contenuto → i campi correnti vengono aggiornati, `isDraft` diventa `true`
2. Il sito pubblico continua a servire il `publishedSnapshot` (ultimo stato pubblicato)
3. Admin clicca "Pubblica Sito" → snapshot corrente viene salvato in `publishedSnapshot`, `isDraft` diventa `false`
4. Il sito pubblico ora mostra i nuovi contenuti

## Doppio Backend

Il progetto supporta due backend database intercambiabili:
- **Replit PostgreSQL** (default): Usa Drizzle ORM direttamente (`DatabaseStorage`)
- **Supabase**: Quando `SUPABASE_URL` è configurato, usa `SupabaseStorage` con conversione automatica camelCase↔snake_case

La selezione avviene in `server/storage.ts` tramite la variabile `USE_SUPABASE`.
