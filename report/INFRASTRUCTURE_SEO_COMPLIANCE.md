# Infrastructure, SEO & Privacy Compliance

**Last updated:** 13 February 2026  
**Consolidation of:** SEO middleware, Search Console analysis, privacy/cookie consent, canonical redirects, deployment

---

## 1. Deployment Infrastructure

### 1.1 Platform Overview

| Platform | URL | Purpose |
|----------|-----|---------|
| Render | `https://cameraconvista.onrender.com` | Application hosting |
| Production Domain | `https://www.cameraconvista.it` | Public-facing domain |
| Supabase | — | Production database |
| GitHub | `https://github.com/siteccv/cameraconvista.git` | Source repository |
| Replit | Development environment | Development + staging |
| Object Storage (GCS) | — | Media file uploads |

### 1.2 Render Considerations

- **Free tier cold start**: First request after inactivity may take 30-60 seconds (impacts Core Web Vitals and crawling)
- **Supabase keep-alive**: `/api/health` endpoint with `pg Pool` direct connection prevents 7-day standby suspension

---

## 2. SEO System Architecture

### 2.1 Middleware Pipeline

**File**: `server/seo.ts`

The SEO middleware intercepts HTML responses and injects page-specific meta tags into `<head>`:

```
Request → Express Route → SEO Middleware intercepts res.send()/res.end()
→ Detects HTML with </head> → Calls generateSeoHtml(path, lang)
→ Injects meta tags before </head> → Sends modified HTML
```

**Per-page injection includes:**
- `<title>` (page-specific, bilingual)
- `<meta name="description">` (bilingual)
- `<link rel="canonical">`
- `<link rel="alternate" hreflang="it/en/x-default">`
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:site_name`, `og:type`, `og:locale`)
- Twitter Card tags
- JSON-LD structured data (Restaurant, BreadcrumbList, Event, Menu schemas)

### 2.2 Production Fix: res.sendFile() → fs.readFile() (9 Feb 2026)

**Problem**: In production, the SPA catch-all in `server/static.ts` used `res.sendFile()`, which streams the file as a Buffer. The SEO middleware checked `typeof chunk === "string"`, so Buffer content was never intercepted — meta tags were not injected in production.

**Root cause**: `res.sendFile()` uses Node's `send` module for streaming (Buffer), bypassing the string-based middleware interception.

**Solution** (applied to `server/static.ts`):
```
Before: res.sendFile(path.resolve(distPath, "index.html"))
After:  fs.readFile(indexPath) → generateSeoHtml() → injectSeoIntoHtml() → res.send(html)
```

- Fallback to `res.sendFile()` if read/inject fails
- Only 4 lines changed in `server/static.ts`
- Compatible with both dev and production environments

### 2.3 Admin SEO Management

**Route**: `/admina/seo`

- 4 fields per page: Title IT, Title EN, Description IT, Description EN
- Character counters: /60 for titles, /160 for descriptions
- Saves immediately (not subject to draft/publish workflow)
- OG/Twitter tags auto-populated from title/description via middleware fallback

All 8 public pages have been populated with optimized SEO content.

---

## 3. robots.txt & Sitemap

### 3.1 robots.txt

Served dynamically by Express endpoint:

```
User-agent: *
Allow: /
Disallow: /admina
Disallow: /admina/
Disallow: /api/admin/

Sitemap: https://www.cameraconvista.it/sitemap.xml
```

- Admin panel and admin API routes blocked
- Sitemap uses absolute URL (fixed from initial relative path)

### 3.2 sitemap.xml

Generated dynamically from database. Includes:

| Page | Priority | changefreq | Hreflang |
|------|----------|------------|----------|
| `/` (Home) | 1.0 | daily | IT, EN, x-default |
| `/menu` | 0.8 | weekly | IT, EN, x-default |
| `/lista-vini` | 0.8 | weekly | IT, EN, x-default |
| `/cocktail-bar` | 0.8 | weekly | IT, EN, x-default |
| `/eventi` | 0.8 | weekly | IT, EN, x-default |
| `/eventi-privati` | 0.8 | weekly | IT, EN, x-default |
| `/galleria` | 0.8 | weekly | IT, EN, x-default |
| `/dove-siamo` | 0.8 | weekly | IT, EN, x-default |
| `/privacy` | 0.5 | monthly | IT, EN, x-default |
| `/cookie` | 0.5 | monthly | IT, EN, x-default |
| `/eventi/:id` (dynamic) | 0.6 | weekly | IT, EN, x-default |

- English URLs use `?lang=en` query parameter
- `lastmod` uses current date (improvement: use actual DB timestamps)
- Only events with `isVisible=true` are included

---

## 4. Canonical URL & Redirects

### 4.1 Canonical Redirect Middleware (11 Feb 2026)

**File**: `server/index.ts` (before all routes)

| Redirect Type | Example | Status |
|---------------|---------|--------|
| Trailing slash removal | `/lista-vini/` → `/lista-vini` | 301 |
| www enforcement (prod only) | `cameraconvista.it` → `www.cameraconvista.it` | 301 |
| Combined | `cameraconvista.it/lista-vini/` → `www.cameraconvista.it/lista-vini` | 301 |
| Page rename | `/contatti` → `/dove-siamo` | 301 |

- Query strings preserved during redirects
- `/api/*` routes excluded from redirect processing
- Solves QR code compatibility (printed codes with trailing slashes now work)

### 4.2 Bilingual URL Strategy

| Language | URL Pattern | Example |
|----------|-------------|---------|
| Italian (default) | Base path | `/menu` |
| English | Query parameter | `/menu?lang=en` |

**Trade-offs:**
- Simple implementation, single URL set
- Google treats query parameters as separate URLs — mitigated by correct canonical + hreflang tags
- Subfolder approach (`/en/menu`) would be more robust but requires significant refactor
- Current approach is adequate unless English SEO becomes a strategic priority

---

## 5. JSON-LD Structured Data

### 5.1 Schemas Implemented

| Schema Type | Pages | Key Data |
|-------------|-------|----------|
| **Restaurant** | Home (`/`) | Name, address, geo coordinates, cuisine, social links, opening hours |
| **BreadcrumbList** | All pages | Navigation hierarchy |
| **Event** | `/eventi/:id` | Event name, date, location, description |
| **Menu** | `/menu` | Restaurant menu reference |

### 5.2 Known Limitations

- `Menu` schema has `hasMenuSection: []` (empty) — could be populated from actual menu data
- No `og:image` configured for homepage — social shares lack preview image

---

## 6. Performance & Caching

### 6.1 Production Cache Headers

| Route Type | Cache-Control | Notes |
|------------|---------------|-------|
| Public API | 60-300s + `stale-while-revalidate` | Balances freshness with performance |
| Admin API | No caching | Ensures real-time data |
| Static assets | Vite default (hashed filenames) | Long-term caching via content hash |

### 6.2 Image Loading Optimization

| Technique | Details |
|-----------|---------|
| DNS Preconnect | `<link rel="preconnect">` + `<link rel="dns-prefetch">` for Supabase storage in `index.html` |
| Eager/Lazy | Hero images: `loading="eager"`, below-fold: `loading="lazy"` |
| Staggered Preload | `useImagePreloader` hook: background loading with 100ms intervals |
| Hover Prefetch | Header navigation prefetches page data on link hover |

---

## 7. Privacy & GDPR Compliance

### 7.1 Privacy Policy

**Route**: `/privacy`  
**File**: `client/src/pages/privacy-policy.tsx`

Bilingual (IT/EN) page containing:
- Data controller details (Camera con Vista S.A.S.)
- Types of data collected
- Processing purposes and legal basis
- Data retention periods
- Recipients and third-party sharing
- Data subject rights (access, rectification, erasure, portability)
- Link to Cookie Policy

### 7.2 Cookie Policy

**Route**: `/cookie`  
**File**: `client/src/pages/cookie-policy.tsx`

Bilingual (IT/EN) page covering:
- Cookie categories: Essential, Analytics, Marketing
- Third-party cookies (Google Analytics, Meta Pixel)
- Opt-out procedures
- Link to Privacy Policy

### 7.3 Cookie Consent System

**Components:**
- `CookieConsent.tsx` — Banner UI with 3 options
- `ConsentTracking.tsx` — Conditional script loading

**Consent Flow:**

```
User visits site → Banner appears (no tracking active)
  ├── "Accetta tutti" → analytics=true, marketing=true → GA + Pixel loaded
  ├── "Solo essenziali" → analytics=false, marketing=false → nothing loaded
  └── "Preferenze" → Opens panel with individual toggles
       ├── Analytics toggle (Google Analytics)
       └── Marketing toggle (Meta Pixel)
```

**Storage**: `localStorage["ccv_cookie_consent"]`
- `null`: No consent given → banner visible, all tracking OFF
- `"essential"`: Essential only (legacy format, backward compatible)
- `"all"`: All accepted (legacy format, backward compatible)
- `{"analytics": true, "marketing": false}`: Granular JSON format

**Custom Events:**
- `ccv_consent_reset`: Reopens banner (triggered by footer "Preferenze cookie" link)
- `ccv_consent_update`: Notifies `ConsentTracking` to reload/unload scripts

### 7.4 Tracking Configuration

| Tracker | Env Variable | Status |
|---------|-------------|--------|
| Google Analytics | `VITE_GA_MEASUREMENT_ID` | Pending configuration |
| Meta Pixel | `VITE_FB_PIXEL_ID` | Pending configuration |

Without these environment variables, tracking scripts are not loaded (safe-by-default).

### 7.5 Company Information in Footer

Displayed on all pages in the footer:
- **Company**: CAMERA CON VISTA S.A.S. di Matteo Bonetti Camera Roda & C.
- **Address**: Via Santo Stefano 14/2A – 40125 Bologna (BO)
- **VAT/Tax**: P.IVA / C.F. 03488971205

Footer also includes links to Privacy Policy, Cookie Policy, and "Preferenze cookie" (reopens consent banner).

---

## 8. Search Console Recommendations

### 8.1 Setup Steps

1. Register `https://www.cameraconvista.it` in Google Search Console (URL prefix method)
2. Submit sitemap: `https://www.cameraconvista.it/sitemap.xml`
3. Use "URL Inspection" on 3-4 sample URLs to verify rendered output
4. Monitor for 7-14 days: Coverage, Page Indexing, Canonical selection, Core Web Vitals

### 8.2 Known Improvement Opportunities

| Priority | Item | Impact |
|----------|------|--------|
| Medium | Add `og:image` for homepage | Better social media sharing appearance |
| Medium | Use real `lastmod` dates from DB | More accurate sitemap for crawlers |
| Low | Populate JSON-LD Menu sections | Richer search results |
| Low | Consider `/en/` subfolder for English | Stronger multilingual SEO (major refactor) |
