# STATO ATTUALE PROGETTO - Camera con Vista CMS

**Data analisi iniziale:** 3 Febbraio 2026  
**Ultimo aggiornamento:** 11 Febbraio 2026

---

## FUNZIONALITÀ COMPLETAMENTE IMPLEMENTATE

| Area | Stato | Dettagli |
|------|-------|----------|
| **Database PostgreSQL** | ✅ Completo | Schema Drizzle ORM con tutte le tabelle: pages, page_blocks, menu_items, wines, cocktails, events, media, media_categories, site_settings, admin_sessions |
| **Supabase Backend** | ✅ Completo | Produzione su Supabase con `SupabaseStorage`, conversione automatica camelCase↔snake_case, snapshot draft/publish in `metadata.__publishedSnapshot` |
| **Contenuti bilingui IT/EN** | ✅ Completo | Tutti i campi supportano italiano e inglese con helper `t(it, en)` |
| **Autenticazione Admin** | ✅ Completo | Login a `/admina` con password 1909, sessioni persistenti nel database, cambio password |
| **Pagine pubbliche con dati reali** | ✅ Completo | Home, Menu, Carta Vini, Cocktail Bar, Eventi, Eventi Privati, Galleria, Dove Siamo - tutte collegano al database via React Query |
| **Cambio lingua pubblico** | ✅ Completo | Toggle IT/EN funzionante su tutte le pagine |
| **Schema draft/publish** | ✅ Completo nel DB | Campi `isDraft`, `isVisible`, `publishedAt` presenti in schema |
| **Device-specific overrides** | ✅ Completo nel DB | Schema `page_blocks` include campi separati desktop/mobile per immagini e font |
| **Click-to-Edit WYSIWYG** | ✅ Completo | Componenti `EditableText` e `EditableImage` usati su tutte le pagine pubbliche con editing inline in modalità admin preview |
| **Admin Eventi** | ✅ Completo | CRUD completo con max 10 eventi, poster Instagram Story (9:16), controlli zoom/offset, modalità visibilità (ACTIVE_ONLY/UNTIL_DAYS_AFTER), integrazione prenotazioni |
| **Admin Media Library** | ✅ Completo | Upload file su Object Storage, gestione categorie/cartelle dinamiche, dettagli immagine con zoom/offset |
| **Footer Management** | ✅ Completo | Gestione completa footer via Admin → Impostazioni: testi about IT/EN, contatti, orari, social, link rapidi, link legali |
| **Media Categories** | ✅ Completo | Sistema cartelle dinamico per media library con CRUD categorie |
| **Mobile Responsive System** | ✅ Completo | Design mobile-first con breakpoints Tailwind ottimizzati |
| **Admin Mobile Preview** | ✅ Completo | Simulazione iPhone 15 Pro (430x932px) con Dynamic Island, contenuto correttamente clipped nei bordi arrotondati |
| **Scroll to Top Navigation** | ✅ Completo | Componente ScrollToTop che resetta lo scroll ad ogni cambio pagina |
| **Traduzione Automatica IT→EN** | ✅ Completo | Endpoint `/api/admin/translate` con OpenAI, hook `useTranslation`, componente `TranslateButton` integrato in tutti i form bilingui |
| **Galleria Album** | ✅ Completo | Sistema album-based con copertine e titoli centrati. Admin CRUD album a `/admina/gallery`. GallerySlideViewer per visualizzazione immagini 9:16 con swipe/navigazione. Controlli zoom/offset per copertine e immagini. MediaPickerModal per selezione immagini dalla libreria. |
| **Google Sheets Sync** | ✅ Completo | Sistema sync completo con configurazione URL semplificata, draft/publish indipendente per Menu/Vini/Cocktail |
| **SEO System** | ✅ Completo | Middleware server-side, robots.txt, sitemap.xml dinamico, JSON-LD, Open Graph, hreflang, admin `/admina/seo` |
| **Canonical URL Redirect** | ✅ Completo | Middleware server-side 301 redirect per trailing slash e www enforcement in produzione |
| **Image Loading Optimization** | ✅ Completo | DNS preconnect Supabase, loading eager/lazy, prefetch hover navigazione, cache headers produzione, preloader staggered |
| **Eventi Privati** | ✅ Completo | Pagina con 4 service box editabili (package-1 to package-4), 3 immagini editabili "I nostri spazi", pulsante "Contattaci" con mailto:info@cameraconvista.it |

---

## FUNZIONALITÀ PARZIALMENTE IMPLEMENTATE

| Area | Stato | Cosa manca |
|------|-------|------------|
| **Anteprima in Sezioni Pagine** (`/admina/pages`) | 🟡 Parziale | Mostra anteprima delle pagine pubbliche embedded con IPhoneFrame. L'editing click-to-edit funziona in admin preview mode. |
| **Pagina Anteprima** (`/admina/preview`) | 🟡 Parziale | Mostra solo la Homepage, non permette navigazione completa tra tutte le pagine |
| **Workflow Draft/Publish** | 🟡 Parziale | I campi esistono e sono usati per alcuni contenuti, ma manca UI completa per gestire il workflow draft→publish |

---

## FUNZIONALITÀ NON IMPLEMENTATE (Requisiti originali)

| Requisito | Stato | Note |
|-----------|-------|------|
| **Editing blocchi pagina avanzato** | ❌ Non implementato | Nessun form per creare/modificare/riordinare `page_blocks` dalla UI |

---

## PERCENTUALE COMPLETAMENTO STIMATA

| Modulo | Completamento |
|--------|---------------|
| Backend API & Database | 95% |
| Pagine Pubbliche | 98% |
| Admin Authentication | 100% |
| Admin Dashboard | 75% |
| Admin Sezioni Pagine | 85% |
| Admin Eventi | 100% |
| Admin Media | 95% |
| Admin Galleria Album | 100% |
| Click-to-Edit WYSIWYG | 95% |
| Device Image Controls | 90% |
| Footer Management | 100% |
| Mobile Responsive | 98% |
| Admin Mobile Preview | 100% |
| Traduzione Automatica | 100% |
| Admin SEO | 100% |
| Google Sheets Sync | 100% |
| Image Loading / Performance | 100% |
| Canonical URL / Redirect | 100% |

**Completamento globale stimato: ~97%** rispetto ai requisiti originali completi.

---

## DEPLOYMENT

| Piattaforma | URL | Stato |
|-------------|-----|-------|
| **Render** | https://cameraconvista.onrender.com | ✅ Attivo |
| **Dominio Produzione** | https://www.cameraconvista.it | ✅ Attivo |
| **GitHub** | https://github.com/siteccv/cameraconvista.git | ✅ Sincronizzato |
| **Supabase** | Database produzione | ✅ Attivo |

---

## FILE CHIAVE DEL PROGETTO

### Schema Database
- `shared/schema.ts` - Definizioni tabelle Drizzle ORM (events, media_categories aggiunti)

### Backend
- `server/index.ts` - Bootstrap Express con middleware canonical redirect (www + trailing slash)
- `server/storage.ts` - DatabaseStorage con CRUD operations (eventi, media categories, footer settings)
- `server/supabase-storage.ts` - SupabaseStorage per produzione (camelCase↔snake_case, publishedSnapshot)
- `server/routes/index.ts` - Entry point con mount dei router modulari + cache headers produzione
- `server/routes/auth.ts` - Autenticazione admin, login/logout, cambio password
- `server/routes/pages.ts` - API pagine e page blocks (incluso endpoint `/slug/:slug/blocks`)
- `server/routes/menu.ts` - API menu items, vini, cocktails
- `server/routes/events.ts` - API eventi pubbliche e admin
- `server/routes/gallery.ts` - API galleria e album
- `server/routes/media.ts` - API media library e categorie
- `server/routes/settings.ts` - API site settings e footer
- `server/routes/sync.ts` - Endpoint sync Google Sheets (menu, vini, cocktail)
- `server/sheets-sync.ts` - Logica sync CSV da Google Sheets (parse, validazione, aggiornamento tabelle)
- `server/seo.ts` - Middleware SEO server-side per meta tag, JSON-LD, sitemap
- `server/routes/helpers.ts` - Utility parseId, validateId, requireAuth
- `server/db.ts` - Connessione PostgreSQL

### Frontend Pubblico
- `client/src/pages/home.tsx` - Homepage con classi responsive condizionali per forceMobileLayout
- `client/src/pages/menu.tsx` - Pagina menu con dati da DB e EditableText/EditableImage
- `client/src/pages/carta-vini.tsx` - Pagina vini con dati da DB
- `client/src/pages/cocktail-bar.tsx` - Pagina cocktail con dati da DB
- `client/src/pages/eventi.tsx` - Pagina eventi con card Instagram Story 9:16
- `client/src/pages/event-detail.tsx` - Dettaglio singolo evento con prenotazione
- `client/src/pages/eventi-privati.tsx` - Eventi privati con 4 service box editabili e pulsante contattaci (mailto)
- `client/src/pages/galleria.tsx` - Galleria album-based con copertine e GallerySlideViewer
- `client/src/pages/dove-siamo.tsx` - Dove Siamo (ex Contatti) con mappa e indicazioni stradali

### Frontend Admin
- `client/src/pages/admin/login.tsx` - Login admin
- `client/src/pages/admin/dashboard.tsx` - Dashboard con statistiche
- `client/src/pages/admin/pages.tsx` - Anteprima pagine con IPhoneFrame e forceMobileLayout
- `client/src/pages/admin/preview.tsx` - Anteprima homepage con IPhoneFrame mobile
- `client/src/pages/admin/events.tsx` - Gestione eventi (COMPLETO)
- `client/src/pages/admin/media.tsx` - Media library (COMPLETO)
- `client/src/pages/admin/gallery.tsx` - Gestione album galleria (COMPLETO)
- `client/src/pages/admin/seo.tsx` - Gestione SEO
- `client/src/pages/admin/sync-google.tsx` - Sincronizzazione Google Sheets con configurazione URL semplificata
- `client/src/pages/admin/settings.tsx` - Impostazioni e cambio password

### Componenti Admin WYSIWYG
- `client/src/components/admin/EditableText.tsx` - Editing inline testi con traduzione automatica
- `client/src/components/admin/EditableImage.tsx` - Editing inline immagini con zoom/offset, loading eager/lazy
- `client/src/components/admin/EventModal.tsx` - Modal creazione/modifica eventi con traduzione automatica
- `client/src/components/admin/FooterSettingsForm.tsx` - Form impostazioni footer con traduzione automatica
- `client/src/components/admin/ImageDetailsModal.tsx` - Dettagli immagine media library
- `client/src/components/admin/ManageCategoriesModal.tsx` - Gestione categorie media con traduzione automatica
- `client/src/components/admin/IPhoneFrame.tsx` - Frame iPhone 15 Pro per preview mobile con clipPath
- `client/src/components/admin/TranslateButton.tsx` - Pulsante traduzione IT→EN riutilizzabile
- `client/src/components/admin/MediaPickerModal.tsx` - Modale selezione immagini dalla media library
- `client/src/components/GallerySlideViewer.tsx` - Viewer immagini 9:16 con swipe e navigazione

### Componenti Admin Gallery (Refactored)
- `client/src/components/admin/gallery/GalleryModal.tsx` - Modal creazione/modifica album
- `client/src/components/admin/gallery/AlbumImagesModal.tsx` - Gestione immagini album con drag-and-drop (HTML5 nativo)
- `client/src/components/admin/gallery/ImageZoomModal.tsx` - Modal zoom/offset immagini

### Componenti Home Page (Refactored)
- `client/src/components/home/TeaserCard.tsx` - Card servizi per homepage
- `client/src/components/home/BookingDialog.tsx` - Modal conferma prenotazione bilingue
- `client/src/components/home/PhilosophySection.tsx` - Sezione filosofia con immagine
- `client/src/components/home/homeDefaults.ts` - Configurazioni default blocchi e teaser cards

### Hooks
- `client/src/hooks/useTranslation.ts` - Hook per chiamate API traduzione con loading/error states
- `client/src/hooks/use-image-preloader.ts` - Preloader immagini staggered con cleanup (pagine, gallery, eventi)
- `client/src/hooks/use-page-blocks.ts` - Hook per caricamento page blocks con auto-creazione blocchi mancanti

### Layout
- `client/src/components/layout/Header.tsx` - Header responsive con prefetch dati pagina su hover navigazione
- `client/src/components/layout/Footer.tsx` - Footer responsive con layout stacked mobile
- `client/src/components/layout/PublicLayout.tsx` - Layout pubblico con Header, Footer, CookieConsent
- `client/src/components/layout/AdminLayout.tsx` - Layout admin con sidebar

### Utilities
- `client/src/components/ScrollToTop.tsx` - Scroll to top su cambio route

### Context
- `client/src/contexts/LanguageContext.tsx` - Gestione lingua IT/EN
- `client/src/contexts/AdminContext.tsx` - Stato autenticazione admin, preview mode, deviceView, forceMobileLayout

### Assets
- `LOGOS/` - Cartella per loghi e icone del ristorante

---

## NOTE TECNICHE

### Stack Tecnologico
- **Frontend:** React 18.3.1, TypeScript, Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL con Drizzle ORM (locale) / Supabase (produzione)
- **Autenticazione:** Sessioni httpOnly cookies, bcrypt per hash password
- **Storage:** Google Cloud Storage via Object Storage per media
- **AI:** OpenAI gpt-4o-mini per traduzioni IT→EN
- **Deployment:** Render (hosting), GitHub (repository), Supabase (database produzione)

### Integrazioni Attive
- **Object Storage** - Funzionante per upload media
- **OpenAI** - Attivo per traduzioni automatiche IT→EN con prompt contestuali hospitality
- **Supabase** - Database produzione con conversione automatica camelCase↔snake_case

### Sistema Performance / Ottimizzazione Immagini (10-11 Feb 2026)
- **DNS Preconnect**: `client/index.html` include `<link rel="preconnect">` e `<link rel="dns-prefetch">` verso `pjrdnfbfpogvztfjuxya.supabase.co` per ridurre latenza DNS
- **Loading Strategy**: Hero images usano `loading="eager"`, immagini below-fold usano `loading="lazy"`
- **Image Preloader**: Hook `useImagePreloader` carica immagini di tutte le pagine in background con intervalli staggered (100ms), batch processing, cleanup su unmount
- **Nav Hover Prefetch**: Header prefetch dati pagina + immagini hero quando utente passa il mouse sui link navigazione
- **Cache Headers Produzione**: API pubbliche hanno `Cache-Control` 60-300s con `stale-while-revalidate`, nessun caching su route admin
- **Slug-based Blocks Endpoint**: `/api/pages/slug/:slug/blocks` per prefetching efficiente senza necessità di conoscere page ID

### Canonical URL Redirect (11 Feb 2026)
- **Middleware server-side** in `server/index.ts` (prima di tutte le route)
- **Trailing slash**: `/lista-vini/` → 301 → `/lista-vini` (preserva querystring)
- **www enforcement** (solo produzione): `cameraconvista.it` → 301 → `https://www.cameraconvista.it`
- **Combinato**: `cameraconvista.it/lista-vini/` → 301 → `https://www.cameraconvista.it/lista-vini`
- **Escluse API**: `/api/*` non subisce redirect
- **Compatibilità QR code**: I QR distribuiti con `/lista-vini/` ora funzionano correttamente

### Sistema Responsive Mobile
- **Breakpoints:** Tailwind md: (768px) e lg: (1024px)
- **forceMobileLayout:** Stato in AdminContext per forzare layout mobile in admin preview
- **deviceView:** Sincronizzato con forceMobileLayout per EditableImage e altri componenti
- **IPhoneFrame:** Componente scalabile che simula iPhone 15 Pro con Dynamic Island e clipPath per contenere il contenuto
- **ScrollToTop:** Componente che resetta scroll position ad ogni navigazione

---

## PROGRESSI RECENTI

### Canonical URL Redirect e Performance (10-11 Feb 2026)
- **Canonical redirect middleware**: Trailing slash removal + www enforcement in produzione con 301 permanent redirect
- **Compatibilità QR code**: `/lista-vini/` ora reindirizza correttamente a `/lista-vini`
- **Image loading optimization**: DNS preconnect, eager/lazy loading, preloader staggered, nav hover prefetch, cache headers produzione
- **Slug-based blocks endpoint**: `/api/pages/slug/:slug/blocks` per prefetching efficiente
- **Eventi Privati**: 4 service box completamente editabili da admin (package-1 to package-4), pulsante "Contattaci" con mailto:info@cameraconvista.it

### Modifiche Pagine Pubbliche (10 Feb 2026)
- **Rinominata pagina Contatti → Dove Siamo**: Slug `/contatti` → `/dove-siamo`, titolo IT "Dove Siamo", EN "Where We Are". Aggiornati: header, footer, SEO server-side, admin pages/seo, page-defaults, database, link interni (homepage, eventi privati). Redirect 301 da `/contatti` a `/dove-siamo` per compatibilità.
- **Cocktail Bar**: Aggiunte 3 immagini editabili (gallery-1/2/3) tra intro e lista cocktail, gestibili da admin preview con EditableImage. Su mobile: aspect-ratio 4/5 (come homepage), su desktop: 4/3.
- **Eventi Privati**: Le 3 immagini "I nostri spazi" (spaces-1/2/3) ora sono editabili da admin preview con EditableImage
- **Dove Siamo**: Rimossa sezione "Inviaci un messaggio" (form contatto). Puliti tutti gli import e codice morto.
- **Fix usePageBlocks**: Il hook ora crea automaticamente i blocchi mancanti nel database anche quando ci sono già altri blocchi sulla pagina

### Google Sheets Sync System Completo (8-9 Feb 2026)
- **Configurazione semplificata**: Rimossi campi tecnici (spreadsheetId, GID, publishedKey)
- Configurazione basata su URL diretti CSV memorizzati in `site_settings.google_sheets_config`
- **Menu e Cocktail**: Un singolo URL di sincronizzazione CSV ciascuno
- **Vini**: URL generico foglio (per editing) + 6 URL CSV per categorie fisse (Bollicine Italiane/Francesi, Bianchi, Rossi, Rosati, Vini Dolci)
- Categorie vini **read-only**: Nomi visualizzati come titoli con indicatore colorato (non input box editabili)
- Pulsanti verdi "GOOGLE SHEET" per ogni sezione (Menu, Vini, Cocktail) che aprono fogli in nuova tab
- **Pulsante "Link di sincronizzazione"**: Tutta larghezza, sfondo ambra (`bg-amber-400/500`), icona ingranaggio con animazione rotazione 90°, dimensioni ingrandite
- Sistema draft/publish indipendente: Sync aggiorna tabelle draft, Pubblica crea snapshot JSON
- Conferma AlertDialog prima di pubblicare
- Validazione client-side e server-side degli URL

### SEO System Completo (7-8 Feb 2026)
- Middleware server-side per iniezione meta tag nell'HTML
- robots.txt, sitemap.xml dinamico con hreflang
- JSON-LD Restaurant, BreadcrumbList, Event schema
- Admin `/admina/seo` con editing meta title/description IT/EN per ogni pagina
- Contatori caratteri (/60 title, /160 description)
- Salvataggio immediato (non soggetto a draft/publish)

### Fix Gallery Drag & Drop e Aggiunta Immagini (5 Feb 2026)
- **Problema risolto:** Errore "Impossibile aggiungere l'immagine" nella gestione album
  - Causa: Sequence database disallineato dopo eliminazione immagini (tentava di usare ID già esistenti)
  - Soluzione: Riallineato sequence `gallery_images_id_seq` per generare nuovi ID
- **Refactoring Drag & Drop:**
  - Rimossa dipendenza @dnd-kit/core e @dnd-kit/sortable
  - Riscritto completamente `AlbumImagesModal.tsx` usando API HTML5 Drag & Drop nativa
  - Feedback visivo migliorato: immagine semi-trasparente durante trascinamento, bordo colorato su destinazione
  - Rimosso file `SortableImage.tsx` non più necessario
- **Test E2E verificati:**
  - ✅ Aggiunta nuove immagini dall'album
  - ✅ Trascinamento per riordinare le immagini
  - ✅ Persistenza ordine dopo reload

### Fix Responsive Mobile Viewport (4 Feb 2026 - sera)
- Risolto problema critico: i componenti usavano solo `forceMobileLayout` per determinare il layout mobile
- Questo causava che su iPhone reale il sito mostrava layout desktop (font grandi, proporzioni sbagliate)
- Aggiunto hook `useIsMobile()` in combinazione con `forceMobileLayout` per rilevamento corretto:
  - `isMobile = forceMobileLayout || viewportIsMobile`
- Componenti aggiornati:
  - `client/src/pages/home.tsx` - Layout homepage con classi condizionali
  - `client/src/components/admin/EditableText.tsx` - Font size responsive
  - `client/src/components/admin/EditableImage.tsx` - Zoom/offset responsive
  - `client/src/components/layout/Footer.tsx` - Layout footer responsive
- Ora il sito mostra correttamente il layout mobile su iPhone reale

### Refactoring Architettura Modulare (4 Feb 2026 - sera)
- **server/routes.ts refactored**: Da 1336 righe a 24 righe
  - Suddiviso in 9 moduli in `server/routes/`: auth, pages, menu, events, gallery, media, settings, sync, helpers
  - Ogni modulo gestisce un dominio specifico dell'applicazione
  - Helper `parseId` e `validateId` per validazione parametri
- **admin/gallery.tsx refactored**: Da 926 righe a 200 righe
  - Estratti 4 componenti in `client/src/components/admin/gallery/`
  - GalleryModal, AlbumImagesModal, ImageZoomModal, SortableImage
- **home.tsx refactored**: Da 619 righe a 377 righe
  - Estratti 5 file in `client/src/components/home/`
  - TeaserCard, BookingDialog, PhilosophySection, homeDefaults, index
- Tutti i test E2E passati con successo

### Galleria Album System (3-4 Feb 2026)
- Implementato sistema galleria basato su album con copertine e titoli centrati
- Schema DB: tabelle `galleries` e `gallery_images` con supporto bilingue IT/EN
- API admin e pubbliche per CRUD album e immagini
- GallerySlideViewer per visualizzazione pubblica con swipe touch e navigazione frecce

### Traduzione Automatica IT→EN (3 Feb 2026)
- Endpoint `/api/admin/translate` con OpenAI (gpt-4o-mini)
- Hook `useTranslation` e componente `TranslateButton` riutilizzabili
- Integrazione in tutti i form bilingui admin

---

## PROBLEMI RISOLTI

| Problema | Soluzione | Data |
|----------|-----------|------|
| QR code con trailing slash `/lista-vini/` non funziona | Middleware canonical redirect 301 trailing slash → senza slash | 11 Feb 2026 |
| URL non canoniche (www/non-www) | Middleware www enforcement 301 in produzione | 11 Feb 2026 |
| React 18 non supporta `fetchPriority` JSX prop | Rimosso fetchPriority, mantenuto solo `loading="eager"` per hero images | 10 Feb 2026 |
| Header prefetch usava custom queryFn | Refactored per usare default fetcher + getQueryData per image preload | 10 Feb 2026 |
| useImagePreloader memory leak su navigazione SPA | Aggiunto tracking timers con cleanup su unmount | 10 Feb 2026 |
| Errore "Impossibile aggiungere immagine" in album galleria | Riallineato sequence database `gallery_images_id_seq` | 5 Feb 2026 |
| Drag & Drop immagini album non funzionava | Riscritto con API HTML5 Drag & Drop nativa, rimosso dnd-kit | 5 Feb 2026 |
| Layout mobile non funziona su iPhone reale | Aggiunto `useIsMobile()` combinato con `forceMobileLayout` in tutti i componenti | 4 Feb 2026 |
| EditableText/Image usano dimensioni desktop su mobile | Modificata logica per usare `forceMobileLayout \|\| viewportIsMobile` | 4 Feb 2026 |
| Contenuto deborda da IPhoneFrame | Aggiunto clipPath con bordi arrotondati | 3 Feb 2026 |
| Media queries non funzionano in IPhoneFrame | Classi condizionali basate su forceMobileLayout invece di md:/lg: | 3 Feb 2026 |
| Pagine si aprono a fondo pagina | Aggiunto ScrollToTop component | 3 Feb 2026 |

---

*Questo documento è stato aggiornato con lo stato attuale del progetto al 11 Febbraio 2026.*
