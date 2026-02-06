# Camera con Vista - Restaurant & Cocktail Bar Website

## Overview

This is a bilingual (Italian/English) restaurant and cocktail bar website for "Camera con Vista" in Bologna. The project features a public-facing website with menu, wine list, cocktail bar, events, gallery, and contact pages, plus an admin panel for content management with WYSIWYG click-to-edit capabilities.

The stack is **Vite + React + Express + Drizzle ORM** with PostgreSQL as the database. The architecture supports draft/publish workflows, media library management, and Google Sheets sync for menu items.

## User Preferences

Preferred communication style: Simple, everyday language.

**Automatic documentation update**: Always update `report/STATO_ATTUALE_PROGETTO.md` with the current project state after implementing new features or fixes.

**Backup command**: When user says "esegui nuovo backup", create a new tar.gz archive of the entire project (excluding node_modules, .git, BACKUP folder) and save it to `BACKUP/backup_replit_DD_Mon_HH-MM.tar.gz` with current date and time.

**Logo files management**: All logo files (logo_ccv.png, icona_ccv.png, Logo_ccv_2_optimized, etc.) MUST be stored exclusively in the `LOGOS/` folder in the project root. Never duplicate logos to other folders. When optimizing or managing logo files, always use LOGOS/ as the single source of truth. Exceptions:
- `client/public/favicon.png` - required for browser favicon
- `client/public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` - PWA icons derived from logo_ccv_SH.png
- `attached_assets/logo_ccv.png` - required for @assets alias in code (keep in sync with LOGOS/)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints under `/api/*`
- **Authentication**: Server-side session-based admin auth with httpOnly cookies
  - Admin URL: `/admina` (secret path)
  - Default password: 1909 (stored in site_settings, changeable via settings page)
  - Session cookies: httpOnly, 24-hour expiry
  - Protected routes require valid session cookie

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client/server)
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Storage Abstraction**: `server/storage.ts` provides interface for all data operations
- **Supabase Backend**: When `SUPABASE_URL` is set, uses `server/supabase-storage.ts` (SupabaseStorage class) instead of local Drizzle. Converts camelCase↔snake_case automatically.
- **Draft/Publish System**: Page blocks support draft/publish workflow. Published snapshots are stored inside the existing `metadata` JSONB column as `metadata.__publishedSnapshot` (Supabase doesn't have a separate `published_snapshot` column). The `SupabaseStorage.enrichBlockWithSnapshot()` method extracts this into `block.publishedSnapshot` for the API layer. Public routes serve published content via `applyPublishedSnapshot()`, admin routes serve draft (current) fields.

### Key Architectural Patterns
1. **Shared Schema**: Types and schema definitions in `shared/` are used by both frontend and backend
2. **Path Aliases**: `@/*` maps to client source, `@shared/*` to shared modules
3. **Language Context**: React Context provides `t(it, en)` translation helper throughout the app
4. **Admin Context**: Manages authentication state, admin preview mode, device view (desktop/mobile), and forceMobileLayout for true mobile emulation in admin preview
5. **Bilingual Content**: All content fields support IT/EN variants (e.g., `valueIt`, `valueEn`)
6. **WYSIWYG Editing**: All public pages use `EditableText` and `EditableImage` components for click-to-edit functionality in admin preview mode. Components are located in `client/src/components/admin/`.
7. **Footer Management**: Footer content is database-driven and editable via Admin → Impostazioni. Settings include about text (IT/EN), contacts, opening hours, social links, quick links, and legal links. Stored as JSON in `site_settings` table under key `footer_settings`.
8. **Media Categories Management**: Dynamic folder/category system for media library. Categories stored in `media_categories` table with slug, labelIt, labelEn, sortOrder. Admin can create/edit/delete categories via "Gestisci cartelle" button. Uploaded media automatically assigned to selected category filter or first available.
9. **Events Management**: Complete events system with admin CRUD and public display.
   - **Admin**: `/admina/events` - Create/edit/delete events with max 10 concurrent events
   - **Public**: `/eventi` - Events listing with Instagram Story-style poster cards (9:16 aspect ratio)
   - **Detail**: `/eventi/:id` - Individual event page with poster, description, and booking button
   - **Fields**: titleIt/En, descriptionIt/En, detailsIt/En, posterUrl with zoom/offset controls
   - **Visibility**: Two modes - ACTIVE_ONLY (manual control) or UNTIL_DAYS_AFTER (auto-hide after event ends)
   - **Booking**: Optional integration with configurable URL (default: https://cameraconvista.resos.com/booking)
10. **Gallery Album System**: Album-based photo gallery with covers and centered title overlays.
   - **Admin**: `/admina/gallery` - Create/edit/delete albums with MediaPickerModal for image selection
   - **Public**: `/galleria` - Album grid with covers, clicking opens GallerySlideViewer
   - **Viewer**: Instagram Story format (9:16), swipe navigation on mobile, arrow keys on desktop
   - **Fields**: titleIt/En, coverUrl with zoom/offset, gallery_images with individual zoom/offset
11. **Mobile Responsive System**: Complete mobile-first responsive design.
   - **Admin Preview**: iPhone 15 Pro frame simulation (430x932px) with Dynamic Island, uses CSS `zoom` for accurate preview
   - **IPhoneFrame Component**: `client/src/components/admin/IPhoneFrame.tsx` - Uses CSS zoom (not transform:scale) for better pixel accuracy
   - **forceMobileLayout**: AdminContext state that forces mobile layout regardless of viewport (used in admin preview)
   - **deviceView**: Synchronized with forceMobileLayout to ensure EditableImage and EditableText components respond correctly
   - **Independent Font Sizes**: EditableText allows editing desktop/mobile font sizes independently - changes in mobile view only affect mobile, and vice versa
   - **Header/Footer**: Respect forceMobileLayout to switch between desktop/mobile layouts
   - **Responsive Breakpoints**: Uses Tailwind md: (768px) and lg: (1024px) with optimized mobile padding (py-10 vs py-20)
12. **Above-the-Fold Layout Pattern**: All public pages use consistent "clean" layout structure.
   - **Wrapper**: `min-h-[calc(100vh-80px)] flex flex-col` - full viewport minus header
   - **Hero Section**: `h-[60vh] shrink-0` - fixed height hero image with title overlay
   - **Intro Section**: `flex-1 flex items-center justify-center` - centers intro text in remaining space
   - **Home Special Case**: Shows branding block (logo + tagline + booking button) instead of intro text
   - **Scrollable Content**: Main content sections placed after the above-fold wrapper, visible on scroll
13. **GitHub Sync**: Project synced to https://github.com/siteccv/cameraconvista.git - when user says "esegui commit in github", push current state to GitHub main branch

### Design Tokens
- **`--radius-placeholder`**: Shared border-radius (0.75rem/12px) for image placeholders, used via `rounded-placeholder` Tailwind class

### Menu Typography System
Consistent typography applied across Wine List, Menu, and Cocktail Bar pages:
- **Category Title**: font-display (Playfair Display), centered, color #2f2b2a
  - Menu/Cocktail: `text-4xl md:text-5xl`
  - Wine List: `text-3xl md:text-4xl` (slightly smaller)
- **Item Name**: font-display, uppercase, tracking-wide, color #2f2b2a
  - Menu/Cocktail: `text-xl md:text-2xl`
  - Wine List: `text-lg md:text-xl` (slightly smaller)
- **Description/Meta**: `text-muted-foreground`
  - Menu/Cocktail: `text-sm md:text-base`
  - Wine List: `text-sm`
- **Prices**: `.price-text` CSS class with Spectral font, tabular-nums, 20px, weight 500, color #c7902f (gold/ocra)
- **Dividers**: 1px solid #e5d6b6 (warm beige)
- **Wine List Icon**: Lucide WineIcon, color #c7902f, strokeWidth 1.5

The `.price-text` class in `client/src/index.css` ensures € symbol and numbers are baseline-aligned using:
- `font-family: 'Spectral', Georgia, serif`
- `font-variant-numeric: tabular-nums` (prevents oldstyle numerals)
- `display: inline-flex; align-items: baseline`
- `line-height: 1; gap: 0.25rem`

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       │   ├── admin/gallery/  # Gallery admin components (GalleryModal, AlbumImagesModal, ImageZoomModal, SortableImage)
│       │   └── home/           # Home page components (TeaserCard, BookingDialog, PhilosophySection)
│       ├── contexts/     # React contexts (Language, Admin)
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities and query client
│       └── pages/        # Route components
├── server/           # Express backend
│   ├── routes/       # Modular API routes
│   │   ├── index.ts  # Router entry point (mounts all domain routers)
│   │   ├── auth.ts   # Authentication (login, logout, change password)
│   │   ├── pages.ts  # Pages and page blocks
│   │   ├── menu.ts   # Menu items, wines, cocktails
│   │   ├── events.ts # Events (public and admin)
│   │   ├── gallery.ts # Gallery albums and images
│   │   ├── media.ts  # Media library and categories
│   │   ├── settings.ts # Site settings and footer
│   │   ├── sync.ts   # Google Sheets sync (placeholder)
│   │   └── helpers.ts # Shared utilities (parseId, validateId, requireAuth)
│   ├── storage.ts    # Data access layer interface
│   └── db.ts         # Database connection
├── shared/           # Shared types and schema
│   └── schema.ts     # Drizzle schema definitions
└── attached_assets/  # Documentation and assets
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries

### Cloud Storage
- **Google Cloud Storage**: Object storage for media uploads via `@google-cloud/storage`
- **Uppy**: File upload handling with AWS S3-compatible presigned URLs

### AI Integrations (Optional)
- **OpenAI API**: Used via Replit AI Integrations for:
  - Text translation (IT↔EN)
  - Image generation
  - Voice/audio processing
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Development server with HMR
- **esbuild**: Production server bundling
- **TypeScript**: Type checking across the full stack

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY`: (Optional) For translation/AI features
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: (Optional) AI API endpoint