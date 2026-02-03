# Camera con Vista - Restaurant & Cocktail Bar Website

## Overview

This is a bilingual (Italian/English) restaurant and cocktail bar website for "Camera con Vista" in Bologna. The project features a public-facing website with menu, wine list, cocktail bar, events, gallery, and contact pages, plus an admin panel for content management with WYSIWYG click-to-edit capabilities.

The stack is **Vite + React + Express + Drizzle ORM** with PostgreSQL as the database. The architecture supports draft/publish workflows, media library management, and Google Sheets sync for menu items.

## User Preferences

Preferred communication style: Simple, everyday language.

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

### Key Architectural Patterns
1. **Shared Schema**: Types and schema definitions in `shared/` are used by both frontend and backend
2. **Path Aliases**: `@/*` maps to client source, `@shared/*` to shared modules
3. **Language Context**: React Context provides `t(it, en)` translation helper throughout the app
4. **Admin Context**: Manages authentication state, admin preview mode, and device view (desktop/mobile)
5. **Bilingual Content**: All content fields support IT/EN variants (e.g., `valueIt`, `valueEn`)
6. **WYSIWYG Editing**: All public pages use `EditableText` and `EditableImage` components for click-to-edit functionality in admin preview mode. Components are located in `client/src/components/admin/`.
7. **Footer Management**: Footer content is database-driven and editable via Admin → Impostazioni. Settings include about text (IT/EN), contacts, opening hours, social links, quick links, and legal links. Stored as JSON in `site_settings` table under key `footer_settings`.

### Design Tokens
- **`--radius-placeholder`**: Shared border-radius (0.75rem/12px) for image placeholders, used via `rounded-placeholder` Tailwind class

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── contexts/     # React contexts (Language, Admin)
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities and query client
│       └── pages/        # Route components
├── server/           # Express backend
│   ├── routes.ts     # API endpoint definitions
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