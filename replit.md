# Camera con Vista - Restaurant & Cocktail Bar Website

## Overview

This project is a bilingual (Italian/English) website for "Camera con Vista," a restaurant and cocktail bar in Bologna. It features a public-facing site with menu, wine list, cocktail bar, events, gallery, and contact pages, complemented by an admin panel for content management. The admin panel includes WYSIWYG click-to-edit functionalities, a draft/publish workflow, media library management, and Google Sheets synchronization for menu items. The goal is to provide a comprehensive, easily manageable online presence for the venue.

## User Preferences

Preferred communication style: Simple, everyday language.

**Agent mode recommendation**: Before every action, always recommend the optimal Agent mode (Fast, or Autonomous: Low / Medium / High / Max) to save credits. Suggest the lowest effective level for the task at hand.

**Automatic documentation update**: Always update `report/STATO_ATTUALE_PROGETTO.md` with the current project state after implementing new features or fixes.

**Backup command**: When user says "esegui nuovo backup", create a new tar.gz archive of the entire project (excluding node_modules, .git, BACKUP folder) and save it to `BACKUP/backup_replit_DD_Mon_HH-MM.tar.gz` with current date and time.

**Logo files management**: All logo files (logo_ccv.png, icona_ccv.png, Logo_ccv_2_optimized, etc.) MUST be stored exclusively in the `LOGOS/` folder in the project root. Never duplicate logos to other folders. When optimizing or managing logo files, always use LOGOS/ as the single source of truth. Exceptions:
- `client/public/favicon.png` - required for browser favicon
- `client/public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` - PWA icons derived from logo_ccv_SH.png
- `attached_assets/logo_ccv.png` - required for @assets alias in code (keep in sync with LOGOS/)

## System Architecture

### Core Technologies
The application is built using a modern full-stack approach:
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state, shadcn/ui (Radix primitives) for UI, and Tailwind CSS for styling. Vite is used for development and bundling.
-   **Backend**: Node.js with Express and TypeScript (ESM modules). It exposes RESTful API endpoints and handles server-side session-based authentication with httpOnly cookies for the admin panel.
-   **Database**: PostgreSQL managed by Drizzle ORM. Drizzle Kit is used for migrations. A storage abstraction layer allows switching to Supabase as a backend if `SUPABASE_URL` is configured.

### Key Features and Design Patterns

1.  **Bilingual Content Management**: Supports Italian and English with `t(it, en)` translation helper and `valueIt`/`valueEn` fields for content.
2.  **Admin Panel with WYSIWYG Editing**: Public pages feature `EditableText` and `EditableImage` components for direct content editing in admin preview mode.
3.  **Draft/Publish Workflow**: Content blocks and Google Sheets-synced data (menus, wines, cocktails) support separate draft and published states, allowing administrators to prepare content before making it live.
4.  **Responsive Design**: Mobile-first design with a specialized admin preview mode that simulates an iPhone 15 Pro, including independent font size adjustments for mobile and desktop views.
5.  **Modular Content Systems**:
    *   **Events**: Comprehensive CRUD for events with public display, Instagram Story-style posters, and booking integration.
    *   **Gallery**: Album-based photo gallery with admin management and a story-style public viewer.
    *   **Footer**: Database-driven and editable via admin settings, supporting bilingual content, contacts, and social links.
    *   **Media Library**: Dynamic category management for uploaded media.
6.  **SEO Optimization**: Enterprise-grade SEO features including server-side metadata injection, dynamic sitemap with `hreflang` alternates, per-page meta tags, JSON-LD schemas (Restaurant, Event, BreadcrumbList), and `robots.txt` configuration.
7.  **Consistent UI/UX**: Utilizes a specific above-the-fold layout pattern for public pages and a defined typography system for menu-related content, ensuring visual consistency and readability.
8.  **Shared Schema**: TypeScript types and Drizzle schema definitions are shared between frontend and backend to maintain data consistency.
9.  **GitHub Sync**: Integration to push project state to a GitHub repository on user command.

### Design Tokens & Typography

-   **Radius**: `--radius-placeholder` (0.75rem/12px) for image placeholders.
-   **Typography**: Specific `font-display` (Playfair Display) and `font-spectral` for various text elements like category titles, item names, and prices, ensuring a distinct and consistent visual identity. `.price-text` class handles price formatting for tabular numerals and baseline alignment.

## External Dependencies

### Database
-   **PostgreSQL**: Core database.
-   **Drizzle ORM**: For database interactions and schema management.

### Cloud Services
-   **Google Cloud Storage**: For media file uploads.
-   **Supabase**: Optional backend for storage abstraction if configured.

### AI Integrations (Optional)
-   **OpenAI API**: Used for AI-powered features such as text translation, image generation, and audio processing.

### UI Libraries
-   **Radix UI**: Provides accessible, unstyled component primitives.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **Lucide React**: Icon library.

### Development Tools
-   **Vite**: Fast development server and build tool.
-   **esbuild**: Production server bundling.
-   **TypeScript**: Language for type safety.