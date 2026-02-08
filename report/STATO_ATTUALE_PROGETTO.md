# STATO ATTUALE PROGETTO - Camera con Vista CMS

**Data analisi iniziale:** 3 Febbraio 2026  
**Ultimo aggiornamento:** 9 Febbraio 2026

---

## FUNZIONALITÀ COMPLETAMENTE IMPLEMENTATE

| Area | Stato | Dettagli |
|------|-------|----------|
| **Database PostgreSQL** | ✅ Completo | Schema Drizzle ORM con tutte le tabelle: pages, page_blocks, menu_items, wines, cocktails, events, media, media_categories, site_settings, admin_sessions |
| **Contenuti bilingui IT/EN** | ✅ Completo | Tutti i campi supportano italiano e inglese con helper `t(it, en)` |
| **Autenticazione Admin** | ✅ Completo | Login a `/admina` con password 1909, sessioni persistenti nel database, cambio password |
| **Pagine pubbliche con dati reali** | ✅ Completo | Menu, Carta Vini, Cocktail Bar, Eventi, Galleria, Contatti - tutte collegano al database via React Query |
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

---

## FUNZIONALITÀ PARZIALMENTE IMPLEMENTATE

| Area | Stato | Cosa manca |
|------|-------|------------|
| **Anteprima in Sezioni Pagine** (`/admina/pages`) | 🟡 Parziale | Mostra anteprima delle pagine pubbliche embedded con IPhoneFrame. L'editing click-to-edit funziona in admin preview mode. |
| **Pagina Anteprima** (`/admina/preview`) | 🟡 Parziale | Mostra solo la Homepage, non permette navigazione completa tra tutte le pagine |
| **Workflow Draft/Publish** | 🟡 Parziale | I campi esistono e sono usati per alcuni contenuti, ma manca UI completa per gestire il workflow draft→publish |
| **Admin SEO** (`/admina/seo`) | ✅ Completo | Pagina con editing meta title/description IT/EN per ogni pagina, contatori caratteri, salvataggio immediato |

---

## FUNZIONALITÀ NON IMPLEMENTATE (Requisiti originali)

| Requisito | Stato | Note |
|-----------|-------|------|
| **Editing blocchi pagina avanzato** | ❌ Non implementato | Nessun form per creare/modificare/riordinare `page_blocks` dalla UI |
| **Sincronizzazione Google Sheets** | ✅ Completo | Sistema sync completo con configurazione URL semplificata, draft/publish indipendente per Menu/Vini/Cocktail |

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

**Completamento globale stimato: ~97%** rispetto ai requisiti originali completi.

---

## FILE CHIAVE DEL PROGETTO

### Schema Database
- `shared/schema.ts` - Definizioni tabelle Drizzle ORM (events, media_categories aggiunti)

### Backend
- `server/storage.ts` - DatabaseStorage con CRUD operations (eventi, media categories, footer settings)
- `server/routes/index.ts` - Entry point con mount dei router modulari
- `server/routes/auth.ts` - Autenticazione admin, login/logout, cambio password
- `server/routes/pages.ts` - API pagine e page blocks
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
- `client/src/pages/galleria.tsx` - Galleria album-based con copertine e GallerySlideViewer
- `client/src/pages/contatti.tsx` - Contatti con layout responsive

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
- `client/src/components/admin/EditableImage.tsx` - Editing inline immagini con zoom/offset
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

### Layout
- `client/src/components/layout/Header.tsx` - Header responsive con supporto forceMobileLayout
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
- **Frontend:** React 18, TypeScript, Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL con Drizzle ORM
- **Autenticazione:** Sessioni httpOnly cookies, bcrypt per hash password
- **Storage:** Object Storage per media (configurato e funzionante)
- **AI:** OpenAI gpt-4o-mini per traduzioni IT→EN

### Integrazioni Attive
- **Object Storage** - Funzionante per upload media
- **OpenAI** - Attivo per traduzioni automatiche IT→EN con prompt contestuali hospitality

### Sistema Responsive Mobile
- **Breakpoints:** Tailwind md: (768px) e lg: (1024px)
- **forceMobileLayout:** Stato in AdminContext per forzare layout mobile in admin preview
- **deviceView:** Sincronizzato con forceMobileLayout per EditableImage e altri componenti
- **IPhoneFrame:** Componente scalabile che simula iPhone 15 Pro con Dynamic Island e clipPath per contenere il contenuto
- **ScrollToTop:** Componente che resetta scroll position ad ogni navigazione

---

## PROGRESSI RECENTI

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
- Nota: L'admin preview non può simulare perfettamente le unità `vh` (viewport height) perché sono sempre relative al browser, non al contenitore iPhone

### IPhoneFrame Content Clipping (3 Feb 2026 - notte)
- Aggiunto `clipPath: "inset(0 round 48px)"` per contenere il contenuto nei bordi arrotondati
- Il contenuto non deborda più dalla sagoma dell'iPhone

### Sezioni Pagine Mobile Preview (3 Feb 2026 - notte)
- Aggiunto useEffect per sincronizzare forceMobileLayout con deviceView
- Integrato IPhoneFrame nella pagina Sezioni Pagine
- Ora entrambe le pagine admin usano lo stesso sistema di preview mobile

### Galleria Album System (3-4 Feb 2026)
- Implementato sistema galleria basato su album con copertine e titoli centrati
- Schema DB: tabelle `galleries` e `gallery_images` con supporto bilingue IT/EN
- API admin e pubbliche per CRUD album e immagini
- Pagina admin `/admina/gallery` con:
  - Creazione/modifica/eliminazione album
  - MediaPickerModal per selezione immagini dalla libreria
  - Controlli zoom/offset per copertine
  - Switch visibilità album
  - **Drag & Drop riordino**: Trascina le immagini per riordinare (HTML5 nativo)
  - **Drag a 360°**: Nel modale zoom, trascina l'immagine per posizionamento libero (quando zoom > 100%)
- Componente GallerySlideViewer per visualizzazione pubblica:
  - Immagini formato Instagram Story (9:16)
  - Navigazione swipe touch su mobile
  - Navigazione frecce su desktop
  - Indicatori dot per posizione corrente
- Pagina pubblica `/galleria` con griglia album e titoli centrati
- 4 gallerie test create: Il Locale, La Cucina, Cocktails, Eventi (5 foto ciascuna)
- Test E2E completato con successo

### Traduzione Automatica IT→EN (3 Feb 2026 - notte)
- Implementato endpoint `/api/admin/translate` con OpenAI (gpt-4o-mini)
- Creato hook `useTranslation` e componente `TranslateButton` riutilizzabili
- Integrazione in: EditableText, EventModal, FooterSettingsForm, ManageCategoriesModal
- Prompt contestuali per traduzioni mirate (hospitality, concise, elegant)
- Autenticazione protetta con requireAuth

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

### Header Mobile Fix (4 Feb 2026)
- Nuovo logo: `logo_ccv.png` sostituisce il precedente
- Mobile: Logo centrato, hamburger a sinistra
- Mobile: Selettore lingua IT/EN spostato in fondo al menu hamburger
- Desktop: Layout invariato con selettore lingua visibile nell'header

### Mobile Preview Admin Fix (3 Feb 2026 - notte)
- Corretto problema: media queries CSS non funzionano in contenitori IPhoneFrame
- Aggiunto `forceMobileLayout` per forzare classi mobile senza media queries responsive
- Aggiornati: Footer.tsx, Header.tsx, home.tsx con classi condizionali
- Ora l'anteprima mobile admin mostra correttamente il layout a colonna singola

### Scroll to Top Fix (3 Feb 2026 - notte)
- Aggiunto componente ScrollToTop che resetta lo scroll ad ogni cambio pagina
- Risolto problema pagine che si aprivano a fondo pagina invece che all'inizio

### Mobile Responsive (3 Feb 2026 - sera)
- Implementato sistema responsive mobile-first completo
- IPhoneFrame con Dynamic Island per preview admin
- Header e Footer rispettano forceMobileLayout
- Sincronizzazione deviceView con forceMobileLayout in AdminPreview
- Padding ottimizzati per mobile (py-10 vs py-20)

### Eventi (3 Feb 2026 - sera)
- Implementato sistema eventi completo con:
  - Admin CRUD con massimo 10 eventi
  - Poster in formato Instagram Story (9:16)
  - Controlli zoom/offset per poster
  - Due modalità visibilità: ACTIVE_ONLY e UNTIL_DAYS_AFTER
  - Integrazione prenotazioni con URL configurabile
  - Pagina pubblica `/eventi` con card responsive
  - Pagina dettaglio `/eventi/:id` con descrizione e pulsante prenotazione

### Footer (3 Feb 2026)
- Gestione completa footer da Admin → Impostazioni
- Testi about bilingui, contatti, orari, social, link rapidi e legali

### Media Library (3 Feb 2026)
- Upload funzionante su Object Storage
- Sistema categorie/cartelle dinamico
- Gestione dettagli immagine con zoom/offset

---

## PROBLEMI RISOLTI

| Problema | Soluzione | Data |
|----------|-----------|------|
| Errore "Impossibile aggiungere immagine" in album galleria | Riallineato sequence database `gallery_images_id_seq` | 5 Feb 2026 |
| Drag & Drop immagini album non funzionava | Riscritto con API HTML5 Drag & Drop nativa, rimosso dnd-kit | 5 Feb 2026 |
| Layout mobile non funziona su iPhone reale | Aggiunto `useIsMobile()` combinato con `forceMobileLayout` in tutti i componenti | 4 Feb 2026 |
| EditableText/Image usano dimensioni desktop su mobile | Modificata logica per usare `forceMobileLayout \|\| viewportIsMobile` | 4 Feb 2026 |
| Contenuto deborda da IPhoneFrame | Aggiunto clipPath con bordi arrotondati | 3 Feb 2026 |
| Sezioni Pagine non usava forceMobileLayout | Aggiunto useEffect per sincronizzare forceMobileLayout con deviceView + IPhoneFrame | 3 Feb 2026 |
| Media queries non funzionano in IPhoneFrame | Classi condizionali basate su forceMobileLayout invece di md:/lg: | 3 Feb 2026 |
| Footer in preview mobile mostra layout desktop | Aggiornato gridClass con isMobile condition | 3 Feb 2026 |
| Pagine si aprono a fondo pagina | Aggiunto ScrollToTop component | 3 Feb 2026 |
| Preview mobile non forza layout mobile | Sincronizzato deviceView con forceMobileLayout | 3 Feb 2026 |
| IPhoneFrame overflow in viewport piccoli | Aggiunto scaling dinamico | 3 Feb 2026 |
| Header/Footer non rispettano preview mobile | Aggiunto check forceMobileLayout | 3 Feb 2026 |

---

*Questo documento è stato aggiornato con lo stato attuale del progetto.*
