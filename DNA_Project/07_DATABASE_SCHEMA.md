# 07 - Database Schema

## Diagramma Relazioni

```
┌─────────────┐         ┌──────────────┐
│   pages     │ 1───M   │ page_blocks  │
│             │         │              │
│ id (PK)     │◄────────│ page_id (FK) │
│ slug        │         │ block_type   │
│ titleIt/En  │         │ titleIt/En   │
│ isDraft     │         │ bodyIt/En    │
│ isVisible   │         │ imageUrl     │
│ publishedAt │         │ publishedSn. │
│ sortOrder   │         │ isDraft      │
└─────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐
│ galleries   │ 1───M   │gallery_images│
│             │         │              │
│ id (PK)     │◄────────│ gallery_id   │
│ titleIt/En  │         │ imageUrl     │
│ coverUrl    │         │ imageZoom    │
│ isVisible   │         │ sortOrder    │
│ sortOrder   │         └──────────────┘
└─────────────┘

┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ menu_items  │    │    wines      │    │  cocktails   │
│ category    │    │ category     │    │ category     │
│ nameIt/En   │    │ nameIt/En    │    │ nameIt/En    │
│ price       │    │ region/year  │    │ price        │
│ sortOrder   │    │ price        │    │ sortOrder    │
└─────────────┘    │ sortOrder    │    └──────────────┘
                   └──────────────┘

┌─────────────┐    ┌───────────────┐    ┌──────────────┐
│   events    │    │site_settings  │    │admin_sessions│
│ titleIt/En  │    │ key (unique)  │    │ id (PK/token)│
│ posterUrl   │    │ valueIt/En    │    │ expiresAt    │
│ startAt     │    └───────────────┘    └──────────────┘
│ active      │
│ visibMode   │    ┌───────────────┐    ┌──────────────┐
└─────────────┘    │    media      │    │media_categ.  │
                   │ filename/url  │    │ slug         │
                   │ mimeType/size │    │ labelIt/En   │
                   │ category      │    │ sortOrder    │
                   └───────────────┘    └──────────────┘
```

## Tabelle Dettagliate

### `users`
| Colonna | Tipo | Note |
|---------|------|------|
| id | varchar (PK) | UUID auto-generato |
| username | text (unique) | Username |
| password | text | Hash bcrypt |
| role | text | Default "admin" |
| created_at | timestamp | Auto |

### `admin_sessions`
| Colonna | Tipo | Note |
|---------|------|------|
| id | varchar (PK) | Token sessione (32 bytes hex) |
| expires_at | timestamp | Scadenza (24h) |
| created_at | timestamp | Auto |

### `site_settings`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| key | text (unique) | Chiave impostazione |
| value_it | text | Valore IT (o JSON) |
| value_en | text | Valore EN (o JSON) |
| updated_at | timestamp | Auto |

**Keys usate**:
- `admin_password_hash` → hash bcrypt della password admin
- `footer_settings` → JSON con struttura footer completa
- Altre impostazioni generiche del sito

### `pages`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| slug | text (unique) | URL slug |
| title_it / title_en | text | Titolo bilingue |
| meta_title_it / meta_title_en | text | Meta title SEO |
| meta_description_it / meta_description_en | text | Meta description SEO |
| is_visible | boolean | Default true |
| is_draft | boolean | Default true |
| published_at | timestamp | Ultima pubblicazione |
| sort_order | integer | Ordine |
| created_at / updated_at | timestamp | Auto |

**Pagine seed**: home, menu, carta-vini, cocktail-bar, eventi, eventi-privati, galleria, contatti

### `page_blocks`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| page_id | integer (FK → pages) | CASCADE on delete |
| block_type | text | hero, intro, section, cta, etc. |
| sort_order | integer | Ordine nel layout |
| title_it / title_en | text | Titolo bilingue |
| body_it / body_en | text | Corpo testo bilingue |
| cta_text_it / cta_text_en | text | Testo CTA |
| cta_url | text | URL CTA |
| image_url | text | URL immagine |
| image_alt_it / image_alt_en | text | Alt text |
| image_offset_x / image_offset_y | integer | Offset desktop (default 0) |
| image_scale_desktop | integer | Zoom desktop (default 100) |
| image_offset_x_mobile / image_offset_y_mobile | integer | Offset mobile |
| image_scale_mobile | integer | Zoom mobile (default 100) |
| title_font_size | integer | Font size titolo desktop (default 48) |
| body_font_size | integer | Font size body desktop (default 16) |
| title_font_size_mobile | integer | Font size titolo mobile (default 32) |
| body_font_size_mobile | integer | Font size body mobile (default 14) |
| is_draft | boolean | Default true |
| published_snapshot | jsonb | Snapshot campi pubblicati |
| metadata | jsonb | Dati flessibili per custom block types |
| created_at / updated_at | timestamp | Auto |

### `events`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| title_it / title_en | text | Titolo bilingue (NOT NULL) |
| description_it / description_en | text | Descrizione breve |
| details_it / details_en | text | Dettagli completi |
| poster_url | text | URL poster |
| poster_zoom / poster_offset_x / poster_offset_y | integer | Posizionamento poster |
| start_at | timestamp | Data/ora inizio |
| active | boolean | Default false |
| booking_enabled | boolean | Default false |
| booking_url | text | Default "https://cameraconvista.resos.com/booking" |
| visibility_mode | text | "ACTIVE_ONLY" o "UNTIL_DAYS_AFTER" |
| visibility_days_after | integer | Giorni dopo l'evento |
| sort_order | integer | Ordine |
| created_at / updated_at | timestamp | Auto |

### `menu_items`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| category | text | Categoria (Antipasti, Primi, etc.) |
| name_it / name_en | text | Nome bilingue (NOT NULL) |
| description_it / description_en | text | Descrizione |
| price | text | Prezzo come stringa |
| is_available | boolean | Default true |
| sort_order | integer | Ordine |
| sheet_row_index | integer | Riga Google Sheets |
| created_at / updated_at | timestamp | Auto |

### `wines`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| category | text | Bollicine, Bianchi, Rossi, etc. |
| name_it / name_en | text | Nome bilingue (NOT NULL) |
| region | text | Regione provenienza |
| year | text | Anno/annata |
| price | text | Prezzo bottiglia |
| price_glass | text | Prezzo al calice |
| description_it / description_en | text | Descrizione |
| is_available | boolean | Default true |
| sort_order | integer | Ordine |
| sheet_row_index | integer | Riga Google Sheets |
| created_at / updated_at | timestamp | Auto |

### `cocktails`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| category | text | Signature, Classici, Analcolici |
| name_it / name_en | text | Nome bilingue (NOT NULL) |
| description_it / description_en | text | Ingredienti |
| price | text | Prezzo |
| is_available | boolean | Default true |
| sort_order | integer | Ordine |
| sheet_row_index | integer | Riga Google Sheets |
| created_at / updated_at | timestamp | Auto |

### `galleries`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| title_it / title_en | text | Titolo album (NOT NULL) |
| cover_url | text | URL copertina |
| cover_zoom / cover_offset_x / cover_offset_y | integer | Posizionamento copertina |
| is_visible | boolean | Default true |
| sort_order | integer | Ordine |
| created_at / updated_at | timestamp | Auto |

### `gallery_images`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| gallery_id | integer (FK → galleries) | CASCADE on delete |
| image_url | text | URL immagine (NOT NULL) |
| image_zoom / image_offset_x / image_offset_y | integer | Posizionamento |
| alt_it / alt_en | text | Alt text bilingue |
| sort_order | integer | Ordine |
| created_at | timestamp | Auto |

### `media`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| filename | text | Nome file (NOT NULL) |
| url | text | URL completo (NOT NULL) |
| mime_type | text | Tipo MIME (NOT NULL) |
| size | integer | Dimensione in bytes (NOT NULL) |
| width / height | integer | Dimensioni immagine |
| alt_it / alt_en | text | Alt text bilingue |
| category | text | Categoria/cartella |
| tags | text[] | Array tag |
| created_at | timestamp | Auto |

### `media_categories`
| Colonna | Tipo | Note |
|---------|------|------|
| id | serial (PK) | Auto-increment |
| slug | text (unique) | Slug categoria |
| label_it / label_en | text | Label bilingue (NOT NULL) |
| sort_order | integer | Ordine |
| created_at | timestamp | Auto |

## Supabase: Published Snapshot

Quando si usa Supabase, lo snapshot pubblicato viene salvato dentro il campo `metadata` JSONB come `metadata.__publishedSnapshot` anziché in una colonna separata `published_snapshot`. Il metodo `SupabaseStorage.enrichBlockWithSnapshot()` estrae questo valore in `block.publishedSnapshot` per compatibilità con il layer API.

## Row Level Security (RLS) — Supabase

Il database Supabase è protetto da **RLS attivo su tutte le tabelle critiche**. Questo garantisce che anche se un utente malintenzionato ottenesse la `anon key` (che è pubblica by design nel client browser), non potrebbe accedere a dati protetti o effettuare scritture.

### Tabelle con RLS attivo

| Tabella | SELECT anon | INSERT/UPDATE/DELETE anon | Scrittura |
|---------|-------------|--------------------------|-----------|
| `menu_items` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `menu_items_published` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `wines` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `cocktails` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `events` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `pages` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `page_blocks` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `media` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `media_categories` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `galleries` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `gallery_images` | Consentito (dati pubblici) | Bloccato | Solo `service_role` via backend |
| `users` | Bloccato | Bloccato | Solo `service_role` via backend |
| `admin_sessions` | Bloccato | Bloccato | Solo `service_role` via backend |
| `site_settings` | Bloccato | Bloccato | Solo `service_role` via backend |

### Policy applicate

- **SELECT pubblico**: Consentito solo per dati realmente destinati alla visualizzazione pubblica (menu, eventi, pagine, galleria, media)
- **Scrittura**: Consentita esclusivamente tramite `service_role` (backend Express)
- **Tabelle sensibili** (`users`, `admin_sessions`, `site_settings`): Nessun accesso `anon` (nemmeno SELECT)
- **Test effettuato**: Verifica manuale con `anon key` — nessun accesso non autorizzato

### Flusso di accesso

```
Browser (anon key) → SELECT solo tabelle pubbliche → dati read-only
Backend (service_role) → CRUD completo su tutte le tabelle → byassa RLS
```

Il frontend usa la `anon key` di Supabase solo per operazioni SELECT consentite. Tutte le operazioni di scrittura passano attraverso il backend Express che usa la `service_role key`.

## Naming Convention: camelCase ↔ snake_case

- **Schema Drizzle** (`shared/schema.ts`): colonne definite in camelCase nel codice, mappate a snake_case nel DB via stringa del primo argomento
- **SupabaseStorage**: Conversione automatica tramite `toSnakeCase()` / `toCamelCase()`
- **DatabaseStorage**: Drizzle gestisce la conversione internamente
