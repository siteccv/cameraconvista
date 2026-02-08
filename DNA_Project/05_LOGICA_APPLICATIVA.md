# 05 - Logica Applicativa

## Sistema Draft/Publish

### Concetto
Le modifiche admin non sono immediatamente visibili al pubblico. Ogni modifica imposta `isDraft: true`. Solo quando l'admin clicca "Pubblica Sito", le modifiche vengono copiate nello snapshot pubblico.

### Flusso Dettagliato

#### 1. Modifica Admin
```
Admin modifica blocco → PATCH /api/admin/page-blocks/:id
  → updateData = { ...parsed.data, isDraft: true }
  → Se il blocco ha pageId → updatePage(pageId, { isDraft: true })
```

#### 2. Stato nel Database
```
page_blocks:
  - campi correnti (titleIt, bodyIt, imageUrl, etc.) = DRAFT (ultimo editing)
  - publishedSnapshot (JSONB) = PUBLISHED (ultimo stato pubblicato)
  - isDraft = true se ci sono modifiche non pubblicate
```

#### 3. Pubblicazione
```
POST /api/admin/publish-all
  → Per ogni pagina:
    → updatePage(id, { isDraft: false, publishedAt: now })
    → Per ogni blocco della pagina:
      → snapshot = extractBlockSnapshot(block)  // copia campi correnti
      → updatePageBlock(id, { isDraft: false, publishedSnapshot: snapshot })
```

#### 4. Lettura Pubblica
```
GET /api/pages/:pageId/blocks
  → blocks = storage.getPageBlocks(pageId)
  → publishedBlocks = blocks.map(applyPublishedSnapshot)
    // Per ogni blocco: se publishedSnapshot esiste, sovrascrive i campi correnti
  → return publishedBlocks
```

#### 5. Lettura Admin (Preview)
```
GET /api/admin/page-blocks/:pageId/blocks
  → blocks = storage.getPageBlocks(pageId)
  → return blocks  // campi correnti (draft), NO snapshot
```

### Snapshot Fields
Campi inclusi nello snapshot:
```
titleIt, titleEn, bodyIt, bodyEn,
ctaTextIt, ctaTextEn, ctaUrl,
imageUrl, imageAltIt, imageAltEn,
imageOffsetX, imageOffsetY, imageScaleDesktop,
imageOffsetXMobile, imageOffsetYMobile, imageScaleMobile,
titleFontSize, bodyFontSize, titleFontSizeMobile, bodyFontSizeMobile
```

## Sistema Bilinguismo

### LanguageContext
```typescript
const t = (it: string | null, en: string | null): string => {
  if (language === "en") return en || it || "";
  return it || en || "";
};
```

- Fallback automatico: se manca la traduzione, usa l'altra lingua
- Persistenza: `localStorage.getItem("ccv_language")`
- HTML lang: `document.documentElement.lang = language`

### Convenzione Campi Database
Ogni contenuto testuale ha doppio campo:
- `titleIt` / `titleEn`
- `bodyIt` / `bodyEn`
- `descriptionIt` / `descriptionEn`
- `nameIt` / `nameEn`
- `altIt` / `altEn`

### Traduzione AI
Il componente `TranslateButton` chiama OpenAI per tradurre automaticamente il testo dalla lingua corrente all'altra.

## Sistema Autenticazione Admin

### Flow
1. Utente naviga a `/admina` → `ProtectedAdminRoute` verifica `isAuthenticated`
2. Se non autenticato → redirect a `/admina/login`
3. Login form → `POST /api/admin/login` con password
4. Server: `bcrypt.compare(password, storedHash)` → genera token → crea sessione in DB
5. Cookie `ccv_admin_session` (httpOnly, 24h, sameSite: lax) → risposta
6. Frontend: `setIsAuthenticated(true)` → redirect a `/admina`

### Verifica Sessione
- Al mount dell'app, `AdminProvider.useEffect` chiama `checkSession()`
- `GET /api/admin/check-session` → verifica token nel cookie → verifica in tabella `admin_sessions`
- Se sessione scaduta → cancella e ritorna `false`

### Cambio Password
- `POST /api/admin/change-password` → verifica password corrente → hash nuova password → salva in `site_settings`

## Sistema Eventi

### Visibilità
Due modalità:
1. **ACTIVE_ONLY**: L'evento è visibile solo se `active: true`
2. **UNTIL_DAYS_AFTER**: L'evento è visibile se attivo E la data attuale è entro N giorni dopo `startAt`

### Formattazione Date
```typescript
// Formato: "SABATO 14 FEBBRAIO"
date.toLocaleDateString(language === 'en' ? 'en-US' : 'it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
}).toUpperCase()
```
- Date sempre uppercase
- Titoli rispettano il case inserito dall'admin

### Limite
Max 10 eventi concorrenti. Il server rifiuta la creazione se il limite è raggiunto.

## Sistema Galleria

### Struttura
```
Gallery (album)
├── titleIt, titleEn
├── coverUrl + coverZoom + coverOffsetX/Y
├── isVisible, sortOrder
└── GalleryImage[] (immagini nell'album)
    ├── imageUrl + imageZoom + imageOffsetX/Y
    ├── altIt, altEn
    └── sortOrder
```

### Viewer
- Formato 9:16 (Instagram Story)
- Mobile: swipe gesture per navigazione
- Desktop: frecce tastiera + click
- Galleria pubblica mostra solo album con `isVisible: true`

### Bug Fix: ID Sequenze Supabase
Le sequenze PostgreSQL `galleries_id_seq` e `gallery_images_id_seq` possono andare fuori sync con i dati esistenti. Fix implementato in `SupabaseStorage`:
- Prima di inserire, fetch `MAX(id)` dalla tabella
- Inserisci con `id = maxId + 1` esplicito
- Escludi `id`, `created_at`, `updated_at` dall'output di `toSnakeCase`

## Sistema Media

### Upload Flow
1. Frontend: `ObjectUploader` o `use-upload` hook → upload a Object Storage via presigned URL
2. File salvato su GCS → URL pubblico generato
3. `POST /api/admin/media` → salva metadata in DB (filename, url, mimeType, size, width, height)
4. Opzionale: `sharp` per resize/ottimizzazione server-side

### Categorie
- Tabella `media_categories` con slug, labelIt, labelEn, sortOrder
- Admin può creare/modificare/eliminare categorie ("Gestisci cartelle")
- Upload assegna automaticamente la categoria selezionata o la prima disponibile

## Sistema SEO

> Documentazione completa: vedi `11_SEO_SISTEMA.md`

### Relazione con Draft/Publish
I meta tag SEO (title, description) **non** sono soggetti al sistema draft/publish. Quando l'admin salva un meta tag nel pannello SEO (`/admina/seo`), questo è immediatamente attivo per i crawler alla prossima richiesta.

### Relazione con Google Sheets Sync
Il sync Google Sheets aggiorna solo `menu_items`, `wines`, `cocktails` — tabelle senza campi SEO. I meta tag delle pagine menu/vini/cocktail sono gestiti separatamente nel pannello SEO admin e salvati nella tabella `pages`.

### Relazione con Footer
Il JSON-LD `Restaurant` (iniettato nella Home) legge telefono, email e social links dal `footer_settings` per mantenere i dati strutturati sincronizzati con il footer pubblico.

### Relazione con Bilinguismo
Il middleware SEO rileva la lingua dal parametro `?lang=en` e serve meta tag nella lingua corretta. I tag hreflang sono sempre presenti in entrambe le direzioni (IT→EN, EN→IT, x-default→IT).

## Footer Database-Driven

Il footer è completamente gestito dal database:
```
site_settings.key = "footer_settings"
site_settings.valueIt = JSON (footerSettingsSchema)
```

Struttura JSON:
- `about`: { it, en } — testo about
- `contacts`: { address, phone, email }
- `hours`: [{ selectedDays, hours, isClosed }] — orari
- `social`: [{ type, url }] — social links
- `legalLinks`: { privacyUrl, privacyLabelIt/En, cookieUrl, cookieLabelIt/En }

Editabile via Admin → Impostazioni → `FooterSettingsForm`.

## Responsive System

### Admin Preview Mobile
- `IPhoneFrame` simula iPhone 15 Pro (393x771px area visibile)
- 393px larghezza logica, 771px = 852 - 47 (status bar) - 34 (home indicator)
- `forceMobileLayout` forza layout mobile in tutti i componenti figli
- `deviceView` sincronizzato con `forceMobileLayout`

### Font Size Indipendenti
- `EditableText` permette font size diversi per desktop e mobile
- Modifiche in vista mobile aggiornano solo `titleFontSizeMobile` / `bodyFontSizeMobile`
- Modifiche in vista desktop aggiornano solo `titleFontSize` / `bodyFontSize`

### Breakpoints
- `md:` (768px) — tablet
- `lg:` (1024px) — desktop
- Mobile padding: `py-10` (vs `py-20` desktop)
