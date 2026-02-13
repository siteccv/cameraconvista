# Technical Audit & Database Architecture

**Last updated:** 13 February 2026  
**Consolidation of:** Database audit, Supabase integration, Google Sheets sync, modular architecture, resolved issues

---

## 1. Database Architecture

### 1.1 Schema Overview

Database managed by **Drizzle ORM** (`shared/schema.ts`). Core tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `pages` | Public page metadata | `slug`, `titleIt/En`, `descriptionIt/En`, `isDraft`, `isVisible` |
| `page_blocks` | Content blocks per page | `blockKey`, `contentIt/En`, `imageUrl`, `imageScale*`, `imageOffset*`, `fontSizeDesktop/Mobile` |
| `menu_items` | Restaurant menu entries | `name`, `description`, `price`, `category`, `isVisible`, `isDraft` |
| `wines` | Wine list entries | `name`, `producer`, `region`, `price`, `category`, `isVisible`, `isDraft` |
| `cocktails` | Cocktail menu entries | `name`, `description`, `price`, `category`, `isVisible`, `isDraft` |
| `events` | Public events | `titleIt/En`, `posterUrl`, `posterZoom/OffsetX/Y`, `visibilityMode`, `isActive` |
| `galleries` | Photo albums | `titleIt/En`, `coverUrl`, `coverZoom/OffsetX/Y`, `sortOrder` |
| `gallery_images` | Photos within albums | `galleryId`, `imageUrl`, `zoom/offsetX/Y`, `sortOrder` |
| `media` | Media library files | `url`, `filename`, `mimeType`, `categoryId` |
| `media_categories` | Media folder system | `nameIt/En`, `slug`, `sortOrder` |
| `site_settings` | Global configuration | `key`, `value` (JSON) — stores footer, Google Sheets config, etc. |
| `admin_sessions` | Admin auth sessions | `sessionId`, `createdAt`, `expiresAt` |

### 1.2 Draft/Publish Workflow

Content supports draft/publish states via `isDraft`, `isVisible`, and `publishedAt` fields:

- **Google Sheets synced data** (menu, wines, cocktails): Sync writes to draft tables. "Pubblica" creates a JSON snapshot stored in `site_settings` as `metadata.__publishedSnapshot`
- **Page blocks**: `isDraft` field available but full UI workflow not yet implemented
- **Events**: Use `isActive` + `visibilityMode` (ACTIVE_ONLY / UNTIL_DAYS_AFTER) for visibility control

### 1.3 Bilingual Content Pattern

All user-facing content uses dual fields:
- `titleIt` / `titleEn`, `descriptionIt` / `descriptionEn`, `contentIt` / `contentEn`
- Frontend helper: `t(it, en)` selects based on `LanguageContext`
- Admin forms include `TranslateButton` for automatic IT→EN translation via OpenAI

---

## 2. Supabase Integration (Production)

### 2.1 Storage Abstraction

Two storage implementations share the `IStorage` interface:

| Implementation | File | Environment |
|----------------|------|-------------|
| `DatabaseStorage` | `server/storage.ts` | Development (direct PostgreSQL) |
| `SupabaseStorage` | `server/supabase-storage.ts` | Production (when `SUPABASE_URL` is configured) |

### 2.2 camelCase ↔ snake_case Conversion

Supabase uses snake_case columns. `SupabaseStorage` handles automatic conversion:
- **Write**: camelCase (app) → snake_case (Supabase)
- **Read**: snake_case (Supabase) → camelCase (app)

### 2.3 Keep-Alive Mechanism

Supabase free tier suspends databases after 7 days of inactivity.

**Solution**: `/api/health` endpoint uses `pg Pool` direct connection to execute a lightweight query, keeping the database active. This should be called periodically (e.g., via external cron/uptime monitor).

---

## 3. Google Sheets Sync System

### 3.1 Architecture

- **Config storage**: `site_settings.google_sheets_config` (JSON in database)
- **Sync endpoint**: `POST /api/admin/sync/:type` (menu, wines, cocktails)
- **Logic**: `server/sheets-sync.ts` — fetches CSV from Google Sheets published URLs, parses, validates, updates draft tables

### 3.2 Configuration

| Section | Config Type |
|---------|-------------|
| Menu | Single CSV URL |
| Cocktails | Single CSV URL |
| Wines | 1 generic sheet URL (for editing) + 6 CSV URLs for fixed categories (Bollicine Italiane/Francesi, Bianchi, Rossi, Rosati, Vini Dolci) |

### 3.3 Draft/Publish Flow

1. "Sincronizza" fetches CSV → updates draft tables
2. Admin reviews in preview
3. "Pubblica" creates JSON snapshot → stored in `site_settings`
4. Public pages read from published snapshot (falling back to live DB data)

---

## 4. Server Architecture

### 4.1 Modular Routes (Refactored 4 Feb 2026)

`server/routes.ts` was refactored from 1336 lines to 24 lines. Routes split into 9 modules under `server/routes/`:

| Module | File | Scope |
|--------|------|-------|
| Auth | `routes/auth.ts` | Login, logout, password change |
| Pages | `routes/pages.ts` | Pages, page blocks, slug-based endpoint |
| Menu | `routes/menu.ts` | Menu items, wines, cocktails |
| Events | `routes/events.ts` | Public + admin event APIs |
| Gallery | `routes/gallery.ts` | Albums, gallery images |
| Media | `routes/media.ts` | Media library, categories |
| Settings | `routes/settings.ts` | Site settings, footer |
| Sync | `routes/sync.ts` | Google Sheets sync endpoints |
| Helpers | `routes/helpers.ts` | `parseId`, `validateId`, `requireAuth` |

### 4.2 Authentication

- **Endpoint**: `POST /api/admin/login` with password validation (bcrypt)
- **Sessions**: httpOnly cookies, stored in `admin_sessions` table
- **Admin URL**: `/admina` (intentionally non-standard for security)
- **Middleware**: `requireAuth` checks session validity on all admin routes

### 4.3 Translation Service (Dual-Mode)

`POST /api/admin/translate` supports two backends:

| Environment | Backend | Model | Config |
|-------------|---------|-------|--------|
| Replit (dev) | AI Integrations proxy | gpt-5-nano | `max_completion_tokens: 1000` |
| Render (prod) | Direct `OPENAI_API_KEY` | gpt-4o-mini | `temperature: 0.3`, `max_tokens: 1000` |

Contextual hospitality prompts ensure restaurant-appropriate translations.

---

## 5. Frontend Architecture

### 5.1 Component Refactoring

Major refactors completed (4 Feb 2026):

| Component | Before | After | Extracted To |
|-----------|--------|-------|--------------|
| `admin/gallery.tsx` | 926 lines | 200 lines | `gallery/GalleryModal`, `AlbumImagesModal`, `ImageZoomModal` |
| `home.tsx` | 619 lines | 377 lines | `home/TeaserCard`, `BookingDialog`, `PhilosophySection`, `homeDefaults` |

### 5.2 Gallery System

- **Album-based**: Each album has cover image, bilingual title, sort order
- **Drag & Drop**: HTML5 native API (replaced @dnd-kit after stability issues)
- **Public viewer**: `GallerySlideViewer` — 9:16 format, swipe navigation, arrow keys
- **Sequence fix** (5 Feb 2026): Resolved `gallery_images_id_seq` misalignment after image deletions

### 5.3 Events System

- **Max 10 events** enforced
- **Poster format**: Instagram Story 9:16 aspect ratio
- **Visibility**: `isActive` + `visibilityMode` (ACTIVE_ONLY = show only when active; UNTIL_DAYS_AFTER = show N days after event date)
- **Booking**: Integration with external booking URL or mailto link

---

## 6. Resolved Issues Log

| Issue | Root Cause | Solution | Date |
|-------|-----------|----------|------|
| Event time saves 1 hour early | `toISOString()` uses UTC, not local timezone | Local timezone formatter for datetime-local field | 11 Feb |
| Event edit modal shows old time | Stale event data in modal state | Fresh copy on click + local datetime formatter | 11 Feb |
| Translation fails on Render | Replit AI proxy unreachable from external servers | Dual-mode: direct API key for Render | 11 Feb |
| QR codes with trailing slash fail | No redirect handler | 301 canonical redirect middleware | 11 Feb |
| Gallery "cannot add image" error | Database sequence misaligned after deletions | Reset `gallery_images_id_seq` | 5 Feb |
| Drag & drop unreliable | @dnd-kit library issues | Rewrote with HTML5 native Drag & Drop API | 5 Feb |
| Mobile layout broken on real iPhone | Only checked `forceMobileLayout` admin toggle | Combined `forceMobileLayout \|\| useIsMobile()` | 4 Feb |
| Content overflows IPhoneFrame | No clipping on frame | Added `clipPath` with rounded borders | 3 Feb |
| Pages open scrolled to bottom | No scroll reset on navigation | Added `ScrollToTop` component | 3 Feb |

---

## 7. Build Status

- **TypeScript**: Zero errors in active application code
- **Pre-existing**: 13 errors in `server/replit_integrations/` (auto-generated, can be ignored)
- **Dependencies**: No deprecated or vulnerable packages in active use
