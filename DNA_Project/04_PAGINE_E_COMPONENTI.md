# 04 - Pagine e Componenti

## Pagine Pubbliche

### Pattern Layout Above-the-Fold

Tutte le pagine pubbliche seguono questo pattern:

```
┌──────────────────────────────────────┐
│ Header (80px)                        │
├──────────────────────────────────────┤
│                                      │
│ min-h-[calc(100vh-80px)] flex col    │
│ ┌──────────────────────────────────┐ │
│ │ Hero Section (h-[60vh] shrink-0) │ │
│ │ - Background image               │ │
│ │ - Title overlay                   │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Intro Section (flex-1 centered)  │ │
│ │ - EditableText intro paragraph   │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Scrollable Content (below fold)      │
│ - Categories, items, cards, etc.     │
├──────────────────────────────────────┤
│ Footer                               │
└──────────────────────────────────────┘
```

**Home speciale**: Invece dell'intro, mostra branding block (logo + tagline + booking button).

### Home (`/`)
- Hero image con titolo
- Branding: logo, tagline, pulsante prenotazione (BookingDialog)
- PhilosophySection con testo editable
- TeaserSection con TeaserCard per menu, eventi, galleria
- Tutti i contenuti sono blocchi editabili via `usePageBlocks`

### Menu (`/menu`)
- Hero + intro
- Menu items raggruppati per categoria (Antipasti, Primi, Secondi, Dolci)
- Typography: font-display per titoli, `.price-text` per prezzi con font Spectral

### Carta Vini / Lista Vini (`/lista-vini`)
- Hero + intro
- Vini raggruppati per categoria (Bollicine, Bianchi, Rossi)
- Icona WineIcon lucide, color #c7902f
- Typography leggermente più piccola rispetto al menu

### Cocktail Bar (`/cocktail-bar`)
- Hero + intro
- Cocktail raggruppati per categoria (Signature, Classici, Analcolici)
- Stessa typography del menu

### Eventi (`/eventi`)
- Hero + intro
- Griglia di poster cards in formato 9:16 (Instagram Story)
- Filtro automatico per visibilità (ACTIVE_ONLY o UNTIL_DAYS_AFTER)
- Click su card → navigazione a `/eventi/:id`

### Dettaglio Evento (`/eventi/:id`)
- Poster grande con zoom/offset
- Titolo, data, descrizione, dettagli
- Pulsante prenotazione (se abilitato)
- Data in formato "SABATO 14 FEBBRAIO" (uppercase)

### Eventi Privati (`/eventi-privati`)
- Pagina informativa per eventi privati
- Contenuto editable via blocchi

### Galleria (`/galleria`)
- Griglia album con copertine
- Titolo centrato sovrapposto alla copertina
- Click → apre GallerySlideViewer
- Viewer: formato 9:16, swipe su mobile, frecce su desktop

### Contatti (`/contatti`)
- Hero + intro
- Informazioni contatto (indirizzo, telefono, email)
- Eventuale mappa integrata

## Componenti Admin

### EditableText (`client/src/components/admin/EditableText.tsx`)
- Attivo solo in `adminPreview` mode
- Click sul testo → campo input/textarea inline
- Supporta font size desktop/mobile indipendenti
- Salva automaticamente via `updateBlock` callback
- Bilingue: modifica campo IT o EN in base alla lingua corrente

### EditableImage (`client/src/components/admin/EditableImage.tsx`)
- Attivo solo in `adminPreview` mode
- Click → apre MediaPickerModal per selezionare immagine
- Supporta zoom e offset (pan) desktop/mobile indipendenti
- **LOGICA LOCKED**: Rendering ibrido
  - Zoom ≥ 100%: `object-cover` con CSS transform
  - Zoom < 100%: Posizionamento manuale calcolato

### IPhoneFrame (`client/src/components/admin/IPhoneFrame.tsx`)
- Simulazione frame iPhone 15 Pro (393x771px visible area)
- Dimensioni: 393px larghezza logica, 771px altezza (852 - 47 status bar - 34 home indicator)
- Container adattivo: si riduce se lo spazio disponibile è minore
- Minima altezza: 600px
- `forceMobileLayout` in AdminContext forza layout mobile nei componenti figli

### MediaPickerModal
- Griglia immagini dalla libreria media
- Filtro per categoria
- Selezione singola o multipla
- Preview immagine selezionata

### TranslateButton
- Pulsante per traduzione automatica IT→EN o EN→IT
- Usa OpenAI via endpoint `/api/admin/translate`

### GalleryModal
- Form creazione/modifica album
- Titolo IT/EN, copertina con zoom/offset
- MediaPickerModal per selezione copertina

### AlbumImagesModal
- Gestione immagini dentro un album
- Drag-and-drop per riordinamento (dnd-kit)
- Aggiunta immagini via MediaPickerModal
- Zoom/offset individuale per ogni immagine

## Hook Personalizzati

### usePageBlocks
- Hook centrale per il sistema WYSIWYG
- Query diversa basata su `adminPreview`:
  - Admin: `/api/admin/page-blocks/:pageId/blocks` (draft content)
  - Public: `/api/pages/:pageId/blocks` (published content)
- Auto-inizializzazione: crea blocchi default se la pagina non ne ha
- Metodi: `getBlock`, `getBlockValue`, `updateBlock`

### useLanguage
- Restituisce `language`, `setLanguage`, `t(it, en)`
- `t()` seleziona il testo nella lingua corrente, fallback all'altra lingua
- Persistenza in localStorage (`ccv_language`)

### useAdmin
- Restituisce auth state, preview mode, device view
- `checkSession()` verifica sessione al mount
- `logout()` invalida sessione e cookie

## Layout Components

### PublicLayout
```
Header → main (flex-1) → Footer → CookieConsent
```

### AdminLayout
```
SidebarProvider (16rem)
├── Sidebar
│   ├── SidebarHeader (CCV Admin)
│   ├── SidebarContent
│   │   ├── Navigation items (7 voci)
│   │   └── Actions (Publish, View Site, Logout)
│   └── Publish button state:
│       - Red pulsing = pending changes
│       - Green = all up to date
│       - Loading = checking
└── Main content area
    ├── Header (SidebarTrigger)
    └── main (overflow-auto)
```

## Menu Typography System

Tipografia coerente tra Menu, Carta Vini e Cocktail Bar:

| Elemento | Font | Size Menu/Cocktail | Size Vini |
|----------|------|-------------------|-----------|
| Categoria | Playfair Display, centered | text-4xl md:text-5xl | text-3xl md:text-4xl |
| Nome item | Playfair Display, uppercase | text-xl md:text-2xl | text-lg md:text-xl |
| Descrizione | text-muted-foreground | text-sm md:text-base | text-sm |
| Prezzo | `.price-text` (Spectral) | 20px, #c7902f | 20px, #c7902f |
| Divider | 1px solid #e5d6b6 | — | — |

### Price Text CSS Class
```css
.price-text {
  font-family: 'Spectral', Georgia, serif;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
  gap: 0.25rem;
  font-size: 20px;
  font-weight: 500;
  color: #c7902f;
}
```
