# 03 - Struttura dei File

## Root

```
├── client/                    # Frontend React
├── server/                    # Backend Express
├── shared/                    # Tipi e schema condivisi
├── LOGOS/                     # Logo files (single source of truth)
├── BACKUP/                    # Backup archives
├── DNA_Project/               # Documentazione progetto (questa cartella)
├── attached_assets/           # Asset allegati (logo_ccv.png per @assets alias)
├── scripts/                   # Script di migrazione/utility
├── drizzle.config.ts          # Configurazione Drizzle Kit
├── tailwind.config.ts         # Configurazione Tailwind CSS
├── vite.config.ts             # Configurazione Vite (NON MODIFICARE)
├── tsconfig.json              # TypeScript config
├── package.json               # Dipendenze (NON MODIFICARE direttamente)
├── replit.md                  # Documentazione progetto per agente
└── components.json            # Configurazione shadcn/ui
```

## Client (`client/`)

```
client/
├── public/
│   ├── favicon.png            # Browser favicon
│   ├── icon-192.png           # PWA icon
│   ├── icon-512.png           # PWA icon large
│   ├── apple-touch-icon.png   # iOS icon
│   └── manifest.json          # PWA manifest
├── replit_integrations/
│   └── audio/                 # Audio utils (voice recorder, playback)
└── src/
    ├── main.tsx               # Entry point React
    ├── App.tsx                # Router + Context providers
    ├── index.css              # Tailwind base + custom CSS + design tokens
    ├── components/
    │   ├── admin/             # Componenti admin
    │   │   ├── EditableText.tsx        # Click-to-edit testo (WYSIWYG)
    │   │   ├── EditableImage.tsx       # Click-to-edit immagine con zoom/offset
    │   │   ├── EventModal.tsx          # Modal creazione/modifica evento
    │   │   ├── FooterSettingsForm.tsx  # Form impostazioni footer
    │   │   ├── ImageDetailsModal.tsx   # Dettagli immagine media
    │   │   ├── IPhoneFrame.tsx         # Frame preview iPhone 15 Pro
    │   │   ├── ManageCategoriesModal.tsx # Gestione cartelle media
    │   │   ├── MediaPickerModal.tsx    # Selettore immagini dalla libreria
    │   │   ├── TranslateButton.tsx     # Pulsante traduzione AI
    │   │   └── gallery/               # Componenti galleria admin
    │   │       ├── GalleryModal.tsx    # Modal creazione/modifica album
    │   │       ├── AlbumImagesModal.tsx # Gestione immagini album
    │   │       ├── ImageZoomModal.tsx  # Zoom/offset immagine singola
    │   │       ├── SortableImage.tsx   # Immagine drag-and-drop
    │   │       └── index.ts           # Barrel export
    │   ├── contact/           # Componenti pagina contatti
    │   ├── home/              # Componenti home page
    │   │   ├── BookingDialog.tsx       # Dialog prenotazione
    │   │   ├── PhilosophySection.tsx   # Sezione filosofia
    │   │   ├── TeaserCard.tsx         # Card teaser
    │   │   ├── TeaserSection.tsx      # Sezione teaser
    │   │   ├── homeDefaults.ts        # Valori default blocchi home
    │   │   └── index.ts              # Barrel export
    │   ├── layout/
    │   │   ├── PublicLayout.tsx        # Layout pubblico (Header + Footer + Cookie)
    │   │   ├── AdminLayout.tsx         # Layout admin (Sidebar + Header)
    │   │   ├── Header.tsx             # Header navigazione pubblica
    │   │   └── Footer.tsx             # Footer (database-driven)
    │   ├── ui/                # shadcn/ui components (40+ componenti)
    │   ├── CookieConsent.tsx   # Banner cookie consent
    │   ├── GallerySlideViewer.tsx # Viewer slideshow galleria
    │   ├── ObjectUploader.tsx  # Upload file a Object Storage
    │   └── ScrollToTop.tsx    # Scroll reset su navigazione
    ├── contexts/
    │   ├── AdminContext.tsx    # Auth state, preview mode, device view
    │   └── LanguageContext.tsx # Lingua IT/EN + helper t()
    ├── hooks/
    │   ├── use-mobile.tsx     # Hook per rilevamento mobile
    │   ├── use-page-blocks.ts # Hook per blocchi pagina (draft/publish aware)
    │   ├── use-toast.ts       # Hook per notifiche toast
    │   ├── useTranslation.ts  # Hook traduzione
    │   └── use-upload.ts      # Hook per upload file
    ├── lib/
    │   ├── formatters.ts      # Formattazione date, prezzi
    │   ├── page-defaults.ts   # Valori default blocchi per pagina
    │   ├── queryClient.ts     # TanStack Query config + apiRequest helper
    │   ├── supabase.ts        # Client Supabase (frontend)
    │   └── utils.ts           # cn() e utility generali
    └── pages/
        ├── home.tsx           # Pagina home
        ├── menu.tsx           # Pagina menu
        ├── carta-vini.tsx     # Pagina carta vini
        ├── cocktail-bar.tsx   # Pagina cocktail bar
        ├── eventi.tsx         # Pagina eventi
        ├── event-detail.tsx   # Dettaglio singolo evento
        ├── eventi-privati.tsx # Pagina eventi privati
        ├── galleria.tsx       # Pagina galleria
        ├── contatti.tsx       # Pagina contatti
        ├── not-found.tsx      # Pagina 404
        └── admin/
            ├── login.tsx      # Login admin
            ├── pages.tsx      # Gestione sezioni pagine
            ├── events.tsx     # Gestione eventi
            ├── gallery.tsx    # Gestione galleria
            ├── media.tsx      # Libreria media
            ├── preview.tsx    # Anteprima mobile
            ├── seo.tsx        # SEO & metadata
            └── settings.tsx   # Impostazioni
```

## Server (`server/`)

```
server/
├── index.ts               # Entry point Express + middleware
├── db.ts                  # Connessione PostgreSQL (Drizzle)
├── storage.ts             # IStorage interface + DatabaseStorage + export
├── supabase.ts            # Client Supabase (admin + public)
├── supabase-storage.ts    # SupabaseStorage implementazione
├── static.ts              # Serve static files in production
├── vite.ts                # Vite dev server setup (NON MODIFICARE)
├── sheets-sync.ts         # Google Sheets sync logic
├── routes/
│   ├── index.ts           # Mount point per tutti i router
│   ├── auth.ts            # Autenticazione (login, logout, change-password)
│   ├── pages.ts           # Pages + Page Blocks + Publish
│   ├── menu.ts            # Menu items, wines, cocktails
│   ├── events.ts          # Eventi (public + admin)
│   ├── gallery.ts         # Galleria album + immagini
│   ├── media.ts           # Media library + upload + categorie
│   ├── settings.ts        # Site settings + footer
│   ├── sync.ts            # Google Sheets sync endpoint
│   └── helpers.ts         # Auth helpers, ID parsing
├── routes.ts              # Re-export wrapper (delegates to routes/index.ts)
└── replit_integrations/   # Replit integration modules
    ├── audio/             # Audio processing
    ├── chat/              # Chat completions
    ├── image/             # Image generation
    ├── batch/             # Batch operations
    └── object_storage/    # Object storage management
```

## Shared (`shared/`)

```
shared/
└── schema.ts              # Drizzle schema + Zod schemas + types
```

Questo file è il "contratto" tra frontend e backend. Definisce:
- Tabelle Drizzle (pgTable)
- Relazioni (relations)
- Insert schemas (createInsertSchema + omit)
- Types (InsertX, X)
- Schema strutturati (footerSettingsSchema, etc.)

## Path Aliases

| Alias | Risolve a |
|-------|-----------|
| `@/*` | `client/src/*` |
| `@shared/*` | `shared/*` |
| `@assets/*` | `attached_assets/*` |
