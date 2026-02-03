# Footer Settings Implementation Report

## Overview

Implemented a complete admin-manageable footer system for the Camera con Vista website. All footer content is now stored in the database and editable through the Admin → Impostazioni panel.

## Files Changed

### Schema / Types
- **`shared/schema.ts`** - Added footer settings types and Zod validation schemas:
  - `FooterHoursEntry` - Opening hours entry structure
  - `FooterSocialLink` - Social media link structure  
  - `FooterQuickLink` - Quick link structure
  - `FooterSettings` - Main footer configuration object
  - `defaultFooterSettings` - Safe fallback values

### API Endpoints
- **`server/routes.ts`** - Added 3 new endpoints:
  - `GET /api/footer-settings` - Public endpoint to fetch footer data
  - `GET /api/admin/footer-settings` - Admin endpoint (requires auth)
  - `PUT /api/admin/footer-settings` - Update footer settings (requires auth)

### Admin UI
- **`client/src/components/admin/FooterSettingsForm.tsx`** - New component with:
  - About text editor (IT/EN side-by-side)
  - Contacts editor (address, phone, email)
  - Hours editor (repeatable rows with closed toggle)
  - Social links editor (platform selector + URL)
  - Quick links editor (IT/EN labels + URL)
  - Legal links editor (Privacy/Cookie labels + URLs)
  - Save button with loading state

- **`client/src/pages/admin/settings.tsx`** - Integrated FooterSettingsForm below password change section

### Public Footer
- **`client/src/components/layout/Footer.tsx`** - Refactored to:
  - Fetch settings from `/api/footer-settings` using React Query
  - Fall back to `defaultFooterSettings` if API fails
  - Dynamically render all content based on database values
  - Support dynamic social icons (Instagram, Facebook, Twitter, LinkedIn, YouTube, TikTok)

## Database Changes

### Schema Updates
No new tables created. Footer settings are stored as JSON in the existing `site_settings` table:

```
key: "footer_settings"
value_it: <JSON string of FooterSettings>
value_en: <JSON string of FooterSettings> (same as IT - bilingual data is nested in JSON)
```

### Data Structure
```typescript
{
  about: { it: string, en: string },
  contacts: { address: string, phone: string, email: string },
  hours: Array<{ dayKeyIt, dayKeyEn, hours, isClosed }>,
  social: Array<{ type: "instagram"|"facebook"|..., url: string }>,
  quickLinks: Array<{ labelIt, labelEn, url }>,
  legalLinks: { privacyUrl, privacyLabelIt, privacyLabelEn, cookieUrl, cookieLabelIt, cookieLabelEn }
}
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/footer-settings` | Public | Fetch footer settings for public site |
| GET | `/api/admin/footer-settings` | Required | Fetch footer settings for admin editing |
| PUT | `/api/admin/footer-settings` | Required | Update footer settings |

## Features Implemented

- ✅ Venue description text (IT/EN)
- ✅ Contacts: address, phone, email
- ✅ Opening hours with structured editing and "closed" toggle
- ✅ Social links with platform selector (Instagram, Facebook, Twitter, LinkedIn, YouTube, TikTok)
- ✅ Quick links with bilingual labels and URLs
- ✅ Legal links (Privacy Policy, Cookie Policy) with customizable labels
- ✅ Safe defaults if database is empty
- ✅ Language toggle reflects footer content changes
- ✅ Admin access remains at `/admina` with password 1909
- ✅ Form validation via Zod schemas
- ✅ Loading and error states

## Testing Notes

1. Navigate to `/admina` and log in with password `1909`
2. Go to "Impostazioni" in the sidebar
3. Scroll down to "Impostazioni Footer" section
4. Edit any field and click "Salva Impostazioni Footer"
5. Navigate to any public page - footer should reflect changes
6. Toggle language - footer content should switch IT↔EN
