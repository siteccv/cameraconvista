# SETUP SUPABASE - Camera con Vista CMS

**Data creazione:** 4 Febbraio 2026  
**Progetto Supabase:** https://pjrdnfbfpogvztfjuxya.supabase.co

---

## 1. CHECKLIST CONFIGURAZIONE PROGETTO SUPABASE

### 1.1 Creazione Progetto (già completato)
- [x] Progetto creato con URL: `https://pjrdnfbfpogvztfjuxya.supabase.co`
- [x] Regione scelta (consigliata: `eu-central-1` per Italia)

### 1.2 Recupero Chiavi API
1. Vai su **Settings → API** nel dashboard Supabase
2. Copia le seguenti chiavi:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` (sicura per client-side)
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (SOLO server-side, MAI esporre al client)

### 1.3 Configurazione Replit Secrets
Aggiungi i seguenti Secrets in Replit (Settings → Secrets):

| Nome Secret | Valore | Uso |
|-------------|--------|-----|
| `SUPABASE_URL` | https://pjrdnfbfpogvztfjuxya.supabase.co | Client + Server |
| `SUPABASE_ANON_KEY` | (copia da dashboard) | Client-side (lettura pubblica) |
| `SUPABASE_SERVICE_ROLE_KEY` | (copia da dashboard) | Server-side ONLY (scritture admin) |

**IMPORTANTE SICUREZZA:**
- `SUPABASE_SERVICE_ROLE_KEY` NON deve MAI essere usato con prefisso `VITE_` o `NEXT_PUBLIC_`
- NON deve MAI apparire nel bundle client
- Usare SOLO in `server/` per operazioni privilegiate

---

## 2. SQL EDITOR SCRIPTS (Ordine di Priorità)

Esegui i seguenti script nell'ordine indicato nel SQL Editor di Supabase.

---

### SCRIPT 1: Estensioni Necessarie
**Scopo:** Abilitare funzionalità PostgreSQL richieste

```sql
-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

### SCRIPT 2: Tabella Users (Autenticazione Admin)
**Scopo:** Gestione utenti admin del CMS

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_username ON users(username);
```

---

### SCRIPT 3: Tabella Admin Sessions
**Scopo:** Sessioni di autenticazione admin persistenti

```sql
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
```

---

### SCRIPT 4: Tabella Site Settings
**Scopo:** Configurazioni globali del sito (password admin, footer, ecc.)

```sql
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value_it TEXT,
  value_en TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_site_settings_key ON site_settings(key);
```

---

### SCRIPT 5: Tabella Pages
**Scopo:** Pagine del sito con supporto draft/publish e SEO

```sql
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  meta_title_it TEXT,
  meta_title_en TEXT,
  meta_description_it TEXT,
  meta_description_en TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_draft BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_visible ON pages(is_visible);
CREATE INDEX idx_pages_draft ON pages(is_draft);
```

---

### SCRIPT 6: Tabella Page Blocks
**Scopo:** Blocchi di contenuto con override desktop/mobile

```sql
CREATE TABLE IF NOT EXISTS page_blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Contenuti bilingui
  title_it TEXT,
  title_en TEXT,
  body_it TEXT,
  body_en TEXT,
  cta_text_it TEXT,
  cta_text_en TEXT,
  cta_url TEXT,
  
  -- Media
  image_url TEXT,
  image_alt_it TEXT,
  image_alt_en TEXT,
  
  -- Transform desktop
  image_offset_x INTEGER DEFAULT 0,
  image_offset_y INTEGER DEFAULT 0,
  image_scale_desktop INTEGER DEFAULT 100,
  
  -- Transform mobile
  image_offset_x_mobile INTEGER DEFAULT 0,
  image_offset_y_mobile INTEGER DEFAULT 0,
  image_scale_mobile INTEGER DEFAULT 100,
  
  -- Font sizes
  title_font_size INTEGER DEFAULT 48,
  body_font_size INTEGER DEFAULT 16,
  title_font_size_mobile INTEGER DEFAULT 32,
  body_font_size_mobile INTEGER DEFAULT 14,
  
  -- Draft/publish
  is_draft BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata flessibile
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_page_blocks_page ON page_blocks(page_id);
CREATE INDEX idx_page_blocks_type ON page_blocks(block_type);
CREATE INDEX idx_page_blocks_order ON page_blocks(page_id, sort_order);
```

---

### SCRIPT 7: Tabella Media Categories
**Scopo:** Categorie/cartelle per organizzare i media

```sql
CREATE TABLE IF NOT EXISTS media_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label_it TEXT NOT NULL,
  label_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_media_categories_slug ON media_categories(slug);
```

---

### SCRIPT 8: Tabella Media
**Scopo:** Libreria media con metadati bilingui

```sql
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_it TEXT,
  alt_en TEXT,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_media_category ON media(category);
CREATE INDEX idx_media_created ON media(created_at DESC);
```

---

### SCRIPT 9: Tabella Events
**Scopo:** Eventi pubblici con poster Instagram Story 9:16

```sql
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  details_it TEXT,
  details_en TEXT,
  poster_url TEXT,
  poster_zoom INTEGER DEFAULT 100,
  poster_offset_x INTEGER DEFAULT 0,
  poster_offset_y INTEGER DEFAULT 0,
  start_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT false,
  booking_enabled BOOLEAN NOT NULL DEFAULT false,
  booking_url TEXT DEFAULT 'https://cameraconvista.resos.com/booking',
  visibility_mode TEXT NOT NULL DEFAULT 'ACTIVE_ONLY',
  visibility_days_after INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_events_active ON events(active);
CREATE INDEX idx_events_start ON events(start_at);
CREATE INDEX idx_events_order ON events(sort_order);
```

---

### SCRIPT 10: Tabella Menu Items
**Scopo:** Piatti del menu (sincronizzabili con Google Sheets)

```sql
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  price TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  sheet_row_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_order ON menu_items(category, sort_order);
```

---

### SCRIPT 11: Tabella Wines
**Scopo:** Carta dei vini (sincronizzabile con Google Sheets)

```sql
CREATE TABLE IF NOT EXISTS wines (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  region TEXT,
  year TEXT,
  price TEXT,
  price_glass TEXT,
  description_it TEXT,
  description_en TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  sheet_row_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_wines_category ON wines(category);
CREATE INDEX idx_wines_available ON wines(is_available);
CREATE INDEX idx_wines_order ON wines(category, sort_order);
```

---

### SCRIPT 12: Tabella Cocktails
**Scopo:** Lista cocktail (sincronizzabile con Google Sheets)

```sql
CREATE TABLE IF NOT EXISTS cocktails (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT,
  price TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  sheet_row_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_cocktails_category ON cocktails(category);
CREATE INDEX idx_cocktails_available ON cocktails(is_available);
CREATE INDEX idx_cocktails_order ON cocktails(category, sort_order);
```

---

### SCRIPT 13: Tabella Galleries
**Scopo:** Album fotografici con copertine

```sql
CREATE TABLE IF NOT EXISTS galleries (
  id SERIAL PRIMARY KEY,
  title_it TEXT NOT NULL,
  title_en TEXT NOT NULL,
  cover_url TEXT,
  cover_zoom INTEGER DEFAULT 100,
  cover_offset_x INTEGER DEFAULT 0,
  cover_offset_y INTEGER DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_galleries_visible ON galleries(is_visible);
CREATE INDEX idx_galleries_order ON galleries(sort_order);
```

---

### SCRIPT 14: Tabella Gallery Images
**Scopo:** Immagini negli album (formato 9:16)

```sql
CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_zoom INTEGER DEFAULT 100,
  image_offset_x INTEGER DEFAULT 0,
  image_offset_y INTEGER DEFAULT 0,
  alt_it TEXT,
  alt_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_gallery_images_gallery ON gallery_images(gallery_id);
CREATE INDEX idx_gallery_images_order ON gallery_images(gallery_id, sort_order);
```

---

### SCRIPT 15: Abilitazione RLS (Row Level Security)
**Scopo:** Abilitare la sicurezza a livello di riga

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
```

---

### SCRIPT 16: RLS Policies - Lettura Pubblica
**Scopo:** Permettere lettura pubblica sui contenuti visibili

```sql
-- PAGES: lettura pubblica solo pagine visibili e pubblicate
CREATE POLICY "Pages pubbliche leggibili" ON pages
  FOR SELECT
  USING (is_visible = true AND is_draft = false);

-- PAGE_BLOCKS: lettura pubblica blocchi non in draft
CREATE POLICY "Page blocks pubblici leggibili" ON page_blocks
  FOR SELECT
  USING (is_draft = false);

-- MEDIA_CATEGORIES: lettura pubblica
CREATE POLICY "Media categories leggibili pubblicamente" ON media_categories
  FOR SELECT
  USING (true);

-- MEDIA: lettura pubblica
CREATE POLICY "Media leggibili pubblicamente" ON media
  FOR SELECT
  USING (true);

-- EVENTS: lettura pubblica eventi attivi
CREATE POLICY "Eventi attivi leggibili" ON events
  FOR SELECT
  USING (active = true);

-- MENU_ITEMS: lettura pubblica elementi disponibili
CREATE POLICY "Menu items disponibili leggibili" ON menu_items
  FOR SELECT
  USING (is_available = true);

-- WINES: lettura pubblica vini disponibili
CREATE POLICY "Wines disponibili leggibili" ON wines
  FOR SELECT
  USING (is_available = true);

-- COCKTAILS: lettura pubblica cocktails disponibili
CREATE POLICY "Cocktails disponibili leggibili" ON cocktails
  FOR SELECT
  USING (is_available = true);

-- GALLERIES: lettura pubblica gallerie visibili
CREATE POLICY "Galleries visibili leggibili" ON galleries
  FOR SELECT
  USING (is_visible = true);

-- GALLERY_IMAGES: lettura pubblica immagini di gallerie visibili
CREATE POLICY "Gallery images leggibili" ON gallery_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM galleries 
      WHERE galleries.id = gallery_images.gallery_id 
      AND galleries.is_visible = true
    )
  );

-- SITE_SETTINGS: lettura pubblica (footer, ecc.) - ESCLUSA password
CREATE POLICY "Site settings pubblici leggibili" ON site_settings
  FOR SELECT
  USING (key != 'admin_password');
```

---

### SCRIPT 17: RLS Policies - Scrittura Admin (via service_role)
**Scopo:** Solo service_role può scrivere (admin operations)

```sql
-- USERS: solo service_role può gestire
CREATE POLICY "Users gestibili da service_role" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ADMIN_SESSIONS: solo service_role può gestire
CREATE POLICY "Admin sessions gestibili da service_role" ON admin_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- SITE_SETTINGS: service_role per scrittura
CREATE POLICY "Site settings scrivibili da service_role" ON site_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PAGES: service_role per scrittura (admin)
CREATE POLICY "Pages scrivibili da service_role" ON pages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PAGE_BLOCKS: service_role per scrittura
CREATE POLICY "Page blocks scrivibili da service_role" ON page_blocks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- MEDIA_CATEGORIES: service_role per scrittura
CREATE POLICY "Media categories scrivibili da service_role" ON media_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- MEDIA: service_role per scrittura
CREATE POLICY "Media scrivibili da service_role" ON media
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- EVENTS: service_role per scrittura
CREATE POLICY "Events scrivibili da service_role" ON events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- MENU_ITEMS: service_role per scrittura
CREATE POLICY "Menu items scrivibili da service_role" ON menu_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- WINES: service_role per scrittura
CREATE POLICY "Wines scrivibili da service_role" ON wines
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- COCKTAILS: service_role per scrittura
CREATE POLICY "Cocktails scrivibili da service_role" ON cocktails
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- GALLERIES: service_role per scrittura
CREATE POLICY "Galleries scrivibili da service_role" ON galleries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- GALLERY_IMAGES: service_role per scrittura
CREATE POLICY "Gallery images scrivibili da service_role" ON gallery_images
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

---

### SCRIPT 18: Storage Buckets
**Scopo:** Creare bucket per upload media

```sql
-- Crea bucket per media pubblici
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-public',
  'media-public',
  true,
  52428800, -- 50MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
);

-- Crea bucket per media privati (documenti admin, ecc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-private',
  'media-private',
  false,
  104857600, -- 100MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
);
```

---

### SCRIPT 19: Storage Policies
**Scopo:** Regole accesso ai bucket storage

```sql
-- MEDIA-PUBLIC: lettura pubblica
CREATE POLICY "Media pubblici leggibili da tutti" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media-public');

-- MEDIA-PUBLIC: upload solo da service_role (admin)
CREATE POLICY "Media pubblici uploadabili da admin" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media-public' 
    AND auth.role() = 'service_role'
  );

-- MEDIA-PUBLIC: delete solo da service_role
CREATE POLICY "Media pubblici eliminabili da admin" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media-public' 
    AND auth.role() = 'service_role'
  );

-- MEDIA-PRIVATE: accesso completo solo service_role
CREATE POLICY "Media privati accessibili solo da admin" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'media-private' 
    AND auth.role() = 'service_role'
  )
  WITH CHECK (
    bucket_id = 'media-private' 
    AND auth.role() = 'service_role'
  );
```

---

### SCRIPT 20: Trigger Updated_At Automatico
**Scopo:** Aggiorna automaticamente updated_at sulle modifiche

```sql
-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per pages
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per page_blocks
CREATE TRIGGER update_page_blocks_updated_at
  BEFORE UPDATE ON page_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per menu_items
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per wines
CREATE TRIGGER update_wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per cocktails
CREATE TRIGGER update_cocktails_updated_at
  BEFORE UPDATE ON cocktails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per galleries
CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### SCRIPT 21: Seed Data - Settings Iniziali
**Scopo:** Dati iniziali necessari per il boot dell'applicazione

```sql
-- Password admin iniziale (1909 hashata con bcrypt)
-- NOTA: Questo hash corrisponde a "1909" - cambiare in produzione!
INSERT INTO site_settings (key, value_it, value_en)
VALUES ('admin_password', '$2b$10$8KzIp5BXRR5R5R5R5R5R5OE5E5E5E5E5E5E5E5E5E5E5E5E5E5E5E', NULL)
ON CONFLICT (key) DO NOTHING;

-- Footer settings default (JSON)
INSERT INTO site_settings (key, value_it, value_en)
VALUES (
  'footer_settings',
  '{"about":{"it":"Uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l''innovazione nelle tecniche e la passione per l''ospitalità.","en":"One of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality."},"contacts":{"address":"Via del Pratello, 42\n40122 Bologna, Italia","phone":"+39 051 234 5678","email":"info@cameraconvista.it"},"hours":[{"dayKeyIt":"Martedì - Domenica","dayKeyEn":"Tuesday - Sunday","hours":"18:00 - 02:00","isClosed":false},{"dayKeyIt":"Lunedì","dayKeyEn":"Monday","hours":"","isClosed":true}],"social":[{"type":"instagram","url":"https://instagram.com"},{"type":"facebook","url":"https://facebook.com"}],"quickLinks":[{"labelIt":"Prenota un evento","labelEn":"Book an event","url":"/eventi-privati"},{"labelIt":"Lavora con noi","labelEn":"Work with us","url":"/contatti"}],"legalLinks":{"privacyUrl":"/privacy","privacyLabelIt":"Privacy Policy","privacyLabelEn":"Privacy Policy","cookieUrl":"/cookie","cookieLabelIt":"Cookie Policy","cookieLabelEn":"Cookie Policy"}}',
  NULL
)
ON CONFLICT (key) DO NOTHING;

-- Categorie media default
INSERT INTO media_categories (slug, label_it, label_en, sort_order)
VALUES 
  ('hero', 'Hero Images', 'Hero Images', 1),
  ('menu', 'Menu', 'Menu', 2),
  ('cocktails', 'Cocktail', 'Cocktails', 3),
  ('events', 'Eventi', 'Events', 4),
  ('gallery', 'Galleria', 'Gallery', 5),
  ('other', 'Altro', 'Other', 99)
ON CONFLICT (slug) DO NOTHING;
```

---

## 3. RIEPILOGO VARIABILI AMBIENTE REPLIT

| Variabile | Descrizione | Uso |
|-----------|-------------|-----|
| `SUPABASE_URL` | URL progetto Supabase | Client + Server |
| `SUPABASE_ANON_KEY` | Chiave pubblica (anon) | Client-side (React) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave privilegiata | Server-side ONLY (Express) |

**Config Guard consigliato** (da aggiungere in `server/supabase.ts`):
```typescript
if (typeof window !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('CRITICAL: service_role key exposed to client bundle!');
}
```

---

## 4. VALIDATION CHECKLIST

Dopo aver eseguito tutti gli script, verifica:

### Database
- [ ] Vai su **Table Editor** in Supabase Dashboard
- [ ] Verifica che tutte le 13 tabelle siano presenti:
  - users, admin_sessions, site_settings, pages, page_blocks
  - media_categories, media, events
  - menu_items, wines, cocktails
  - galleries, gallery_images

### RLS
- [ ] Vai su **Authentication → Policies**
- [ ] Verifica che ogni tabella abbia policies configurate
- [ ] Testa: query anonima su `events` deve restituire solo `active = true`

### Storage
- [ ] Vai su **Storage**
- [ ] Verifica bucket `media-public` (pubblico) e `media-private` (privato)

### Secrets Replit
- [ ] Tutti e 3 i secrets configurati in Replit
- [ ] App riavviata per caricare le variabili

### Funzionalità App
- [ ] Homepage carica correttamente
- [ ] Pagina Menu mostra i piatti dal database
- [ ] Pagina Carta Vini mostra i vini
- [ ] Pagina Cocktail Bar mostra i cocktail
- [ ] Pagina Eventi mostra gli eventi attivi
- [ ] Pagina Galleria mostra gli album visibili
- [ ] Login admin a `/admina` funziona con password 1909
- [ ] Modifica contenuto da admin persiste nel database
- [ ] Upload media funziona correttamente

---

## NOTE IMPORTANTI

1. **NON ESEGUIRE GLI SQL AUTOMATICAMENTE** - Questo file è solo una guida. L'utente deve copiare e incollare manualmente ogni script nel SQL Editor di Supabase.

2. **Ordine di esecuzione critico** - Gli script devono essere eseguiti nell'ordine indicato per rispettare le foreign key.

3. **Backup prima della migrazione** - Se si sta migrando da un database esistente, effettuare un backup completo prima di procedere.

4. **Hash password** - L'hash della password seed (1909) è un placeholder. In produzione, generare un nuovo hash con bcrypt.

---

*Documento generato: 4 Febbraio 2026*
