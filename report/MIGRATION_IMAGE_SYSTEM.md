# Image System Migration & Architecture

**Last updated:** 13 February 2026  
**Consolidation of:** Image migration reports, ImageContainer architecture, crop system, mobile preview

---

## 1. ImageContainer Architecture

### 1.1 Core Design

`ImageContainer` (`client/src/components/admin/ImageContainer.tsx`) is the unified image component replacing the legacy `EditableImage` for all public page hero/banner images. It provides:

- **Fit-to-width rendering**: Image fills container width, height determined by `fixedCropRatio`
- **Normalized offsets** `[-100, +100]`: Position adjustments independent of image dimensions
- **Dual desktop/mobile properties**: Separate scale/offset values for each device type
- **Admin controls**: Zoom slider, offset sliders (X/Y), integrated into admin preview mode

### 1.2 Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `blockKey` | string | Identifies the page block (e.g., `hero`, `gallery-1`) |
| `fixedCropRatio` | number | Aspect ratio for stable cropping across viewports (e.g., `16/9`, `4/5`) |
| `referenceWidth` | number | Reference width for consistent desktop rendering (default: 1200) |
| `imageScaleDesktop` / `imageScaleMobile` | number | Zoom level per device |
| `imageOffsetXDesktop` / `imageOffsetXMobile` | number | Horizontal offset [-100,+100] |
| `imageOffsetYDesktop` / `imageOffsetYMobile` | number | Vertical offset [-100,+100] |

### 1.3 Rendering Pipeline

```
1. Container width = parent element width (fit-to-width)
2. Container height = width / fixedCropRatio
3. Image natural dimensions loaded → compute objectFit scale
4. Apply zoom (imageScale) on top of base fit
5. Apply normalized offsets (imageOffsetX/Y) as percentage translation
6. CSS overflow:hidden crops to container bounds
```

### 1.4 fixedCropRatio Solution

The `fixedCropRatio` property solves the viewport stability problem:

- **Problem**: Without fixed ratio, the visible crop area changes as the browser resizes, causing different parts of the image to be visible on different screens
- **Solution**: `fixedCropRatio` locks the container's aspect ratio so the crop is consistent regardless of viewport width
- **Values used**: `16/9` for wide banners, `4/5` for mobile-style cards, `4/3` for medium gallery images

---

## 2. Migration Status

### 2.1 Completed Migrations

| Page | Block Keys | fixedCropRatio | Date | Notes |
|------|-----------|----------------|------|-------|
| **Home** | `hero` | 16/9 | 7 Feb 2026 | Hero banner, first migration |
| **Cocktail Bar** | `hero`, `gallery-1/2/3` | 16/9 (hero), 4/3 desktop / 4/5 mobile (gallery) | 8 Feb 2026 | Gallery images between intro and cocktail list |
| **Eventi Privati** | `hero`, `spaces-1/2/3` | 16/9 (hero), 4/3 desktop / 4/5 mobile (spaces) | 10 Feb 2026 | "I nostri spazi" section images |

### 2.2 Pages Still Using EditableImage

The following pages use `EditableImage` (legacy component). They are functional but subject to the known issues documented in Section 6 below:

- Menu (`/menu`)
- Carta Vini (`/lista-vini`)
- Eventi (`/eventi`) — event posters also affected (see 6.2)
- Galleria (`/galleria`)
- Dove Siamo (`/dove-siamo`)

Migration of these pages is low priority but would resolve the legacy issues.

### 2.3 Legacy Component Status

| Component | File | Status |
|-----------|------|--------|
| `EditableImage.tsx` | `client/src/components/admin/EditableImage.tsx` | **Active** — still used by non-migrated pages, has known issues (see Section 6) |
| `TestImageContainer.tsx` | — | **Removed** — test harness deleted after migration validation |

---

## 3. Database Schema for Images

### 3.1 page_blocks Table (ImageContainer)

Uses consistent camelCase naming for desktop/mobile image properties:

```
imageUrl, imageScaleDesktop, imageScaleMobile,
imageOffsetXDesktop, imageOffsetXMobile,
imageOffsetYDesktop, imageOffsetYMobile
```

### 3.2 events / galleries Tables (Legacy Naming)

Events and galleries still use legacy field names:

- `events`: `posterUrl`, `posterZoom`, `posterOffsetX`, `posterOffsetY`
- `galleries`: `coverUrl`, `coverZoom`, `coverOffsetX`, `coverOffsetY`

This naming inconsistency is low priority and does not affect functionality.

---

## 4. Mobile Preview System

### 4.1 IPhoneFrame Component

`client/src/components/admin/IPhoneFrame.tsx` provides pixel-perfect mobile simulation:

- **Dimensions**: 393×852px (iPhone 15 Pro)
- **Scaling**: CSS `transform: scale()` to fit within admin panel
- **Dynamic Island**: Visual replica for realism
- **Content clipping**: `clipPath` with rounded borders prevents content overflow

### 4.2 Device-Aware Rendering

The system supports device-specific image rendering:

```
AdminContext.deviceView = "desktop" | "mobile"
AdminContext.forceMobileLayout = boolean

isMobile = forceMobileLayout || useIsMobile() (viewport detection)
```

When `isMobile` is true:
- ImageContainer reads `imageScaleMobile`, `imageOffsetXMobile`, `imageOffsetYMobile`
- Layout uses mobile-specific aspect ratios (e.g., 4/5 instead of 4/3)
- Typography and spacing adjust via conditional Tailwind classes

### 4.3 Fix: Real Device Detection (4 Feb 2026)

**Problem**: Components only checked `forceMobileLayout` (admin toggle), causing real iPhones to show desktop layout.

**Solution**: Combined detection: `isMobile = forceMobileLayout || viewportIsMobile` applied to all relevant components (home.tsx, EditableText, EditableImage, Footer).

---

## 5. Image Loading Optimization

### 5.1 Strategy (10-11 Feb 2026)

| Technique | Implementation |
|-----------|---------------|
| DNS Preconnect | `<link rel="preconnect">` for Supabase storage domain in `client/index.html` |
| Eager/Lazy Loading | Hero images: `loading="eager"`, below-fold: `loading="lazy"` |
| Staggered Preloader | `useImagePreloader` hook loads images in background with 100ms intervals, batch processing, cleanup on unmount |
| Nav Hover Prefetch | Header prefetches page data + hero images on link hover |
| Cache Headers | Production API: `Cache-Control` 60-300s with `stale-while-revalidate` |

### 5.2 Slug-based Blocks Endpoint

`GET /api/pages/slug/:slug/blocks` enables efficient prefetching without requiring page ID lookup first.

---

## 6. Legacy Image System: Known Issues

These issues affect pages still using `EditableImage` and legacy event/gallery image controls. They are resolved by migrating to `ImageContainer`.

### 6.1 Offset & Zoom Logic Issues

| Issue | Description | Impact |
|-------|-------------|--------|
| **Offset units inconsistency** | EditableImage uses pixel-based offsets that behave differently at different viewport widths | Crop position shifts when viewport changes |
| **Missing clamp logic** | Offset values are not clamped to valid ranges, allowing the image to be positioned partially or fully outside the visible container | Admin can accidentally make image invisible |
| **Zoom minimum definition** | `zoom=1` maps to different effective scales depending on image aspect ratio vs container aspect ratio | Inconsistent baseline zoom behavior |
| **Modal ↔ public mismatch** | Admin edit modals render images with different container dimensions than public pages, so the preview in the modal doesn't match the final rendering | Admin sees different crop than visitors |

### 6.2 Event Poster Public Rendering

**Problem**: Event posters on the public events list (`/eventi`) do not correctly apply saved `posterZoom` and `posterOffsetX/Y` values. The poster images render at default position regardless of admin adjustments.

**Impact**: Low — posters generally look acceptable at default position, but fine-tuned positioning set by admin is lost on the public page.

**Resolution path**: Migrate event poster rendering to use ImageContainer or fix the transform calculation in the events list page.

### 6.3 Gallery Cover Images

Gallery cover images (`coverZoom`, `coverOffsetX/Y`) have the same offset unit issues as EditableImage. Migration to ImageContainer with normalized [-100,+100] offsets would resolve this.
