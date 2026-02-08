# 11 - Sistema SEO Enterprise-Grade

## Panoramica

Il sistema SEO è stato progettato per massimizzare la visibilità sui motori di ricerca in un contesto SPA (Single Page Application) dove il rendering avviene lato client. La sfida principale è che i crawler (Googlebot, Bingbot) ricevono l'HTML iniziale dal server — senza i meta tag dinamici che normalmente una SPA genera solo dopo il rendering JavaScript. La soluzione adottata inietta tutti i meta tag necessari **a livello Express**, prima che l'HTML raggiunga il browser.

## Architettura

```
                    RICHIESTA HTTP
                         │
                         ▼
┌────────────────────────────────────────────┐
│              EXPRESS SERVER                 │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  1. SEO Middleware (res.send wrap)   │  │
│  │     - Intercetta res.send / res.end  │  │
│  │     - Analizza req.originalUrl       │  │
│  │     - Legge metadati da DB (pages)   │  │
│  │     - Costruisce meta tags           │  │
│  │     - Inietta nell'<head> HTML       │  │
│  └──────────────┬───────────────────────┘  │
│                 │                          │
│  ┌──────────────▼───────────────────────┐  │
│  │  2. robots.txt (file statico)        │  │
│  │     client/public/robots.txt         │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  3. /sitemap.xml (endpoint dinamico) │  │
│  │     Genera XML da DB (pages, events) │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  4. Vite serve l'HTML con SEO tags   │  │
│  │     già iniettati nel <head>         │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────┐
│              BROWSER (SPA)                 │
│                                            │
│  5. PublicPageRoute aggiorna               │
│     document.title su navigazione          │
│     client-side (useEffect)                │
└────────────────────────────────────────────┘
```

### Flusso Dettagliato

1. **Richiesta diretta** (es. crawler, primo accesso): Express intercetta `res.send()`, legge `req.originalUrl` per identificare la pagina, recupera i metadati dal database, costruisce i tag SEO e li inietta nell'`<head>` HTML prima di inviare la risposta.

2. **Navigazione client-side** (SPA): `PublicPageRoute` in `App.tsx` aggiorna `document.title` via `useEffect` ad ogni cambio di route, garantendo che il titolo nella tab del browser sia sempre coerente.

## File Coinvolti

| File | Ruolo |
|------|-------|
| `server/seo.ts` | Cuore del sistema: middleware, sitemap, meta tags, JSON-LD |
| `server/index.ts` | Monta il middleware SEO e le route `/sitemap.xml` |
| `client/public/robots.txt` | Direttive per i crawler |
| `client/src/App.tsx` | `PublicPageRoute` aggiorna `document.title` lato client |
| `client/src/pages/admin/seo.tsx` | Pannello admin per gestione meta tag per pagina |
| `server/routes/pages.ts` | PATCH `/api/admin/pages/:id` salva i metadati SEO |

## Dettaglio Componenti

### 1. robots.txt

File statico in `client/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admina
Disallow: /admina/
Disallow: /api/admin/

Sitemap: /sitemap.xml
```

**Logica**:
- Permette l'indicizzazione di tutto il sito pubblico
- Blocca il pannello admin (`/admina` e sotto-percorsi)
- Blocca le API admin (`/api/admin/`)
- Le API pubbliche (`/api/pages`, `/api/events`, etc.) restano accessibili ai crawler
- Dichiara il percorso della sitemap

### 2. Sitemap XML Dinamica

Endpoint: `GET /sitemap.xml`

**Generazione**:
```
1. Fetch tutte le pagine dal database → filtra solo isVisible=true
2. Fetch tutti gli eventi → filtra per visibilità (active + modalità)
3. Per ogni pagina: genera <url> con loc, lastmod, changefreq, priority, hreflang
4. Per ogni evento attivo: genera <url> con priority 0.6
5. Header: Content-Type application/xml, Cache-Control 1h
```

**Struttura output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://dominio.com/menu</loc>
    <lastmod>2026-02-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="it" href="https://dominio.com/menu" />
    <xhtml:link rel="alternate" hreflang="en" href="https://dominio.com/menu?lang=en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://dominio.com/menu" />
  </url>
</urlset>
```

**Priorità pagine**:
- Home: `1.0`, changefreq `daily`
- Altre pagine: `0.8`, changefreq `weekly`
- Eventi: `0.6`, changefreq `weekly`

**Filtro eventi**: Rispetta la stessa logica di visibilità della pagina pubblica:
- `ACTIVE_ONLY`: solo se `active=true`
- `UNTIL_DAYS_AFTER`: solo se la data attuale è entro N giorni dopo `startAt`

### 3. SEO Middleware

File: `server/seo.ts`

#### Meccanismo di Iniezione

Il middleware **wrappa** `res.send()` e `res.end()` a livello Express. Quando Vite (in dev) o il server statico (in prod) chiama `res.send(html)` per servire `index.html`, il wrapper:

1. Verifica che il contenuto sia HTML (contiene `<!DOCTYPE` o `<html`)
2. Esclude percorsi admin (`/admina`) e asset statici (`.js`, `.css`, `.png`, etc.)
3. Chiama `generateSeoHtml(req)` per costruire i meta tag
4. Chiama `injectSeoIntoHtml(html, metaTags)` per inserirli prima di `</head>`
5. Restituisce l'HTML modificato

#### Decisione Critica: `req.originalUrl` vs `req.path`

In Express con Vite, il middleware per la SPA cattura tutte le route con un pattern catch-all (`/{*path}`). Al momento dell'esecuzione di `res.send()`, `req.path` potrebbe essere stato riscritto dal router. Usando `req.originalUrl` si garantisce il percorso originale della richiesta.

```typescript
const rawPath = (req.originalUrl || req.url || req.path).split("?")[0];
const pathname = rawPath.replace(/\/$/, "") || "/";
```

#### Mapping Slug ↔ Path

```typescript
const SLUG_TO_PATH = {
  home: "/",
  menu: "/menu",
  "carta-vini": "/lista-vini",
  "cocktail-bar": "/cocktail-bar",
  eventi: "/eventi",
  "eventi-privati": "/eventi-privati",
  galleria: "/galleria",
  contatti: "/contatti",
};
```

Il mapping inverso `PATH_TO_SLUG` viene generato automaticamente.

#### Priorità Titoli e Descrizioni

```
1. Meta title/description personalizzati (salvati dall'admin in DB → pages.metaTitleIt/En)
2. Titoli/descrizioni default per slug (hardcoded per pagina in server/seo.ts)
3. Titolo/descrizione generici del sito (fallback finale)
```

### 4. Tag SEO Iniettati

Per ogni pagina, il middleware inietta:

#### Meta Tags Standard
```html
<title>Menu - Camera con Vista | Ristorante Bologna</title>
<meta name="description" content="Scopri il menu del ristorante..." />
<link rel="canonical" href="https://dominio.com/menu" />
```

#### Hreflang (Bilinguismo)
```html
<link rel="alternate" hreflang="it" href="https://dominio.com/menu" />
<link rel="alternate" hreflang="en" href="https://dominio.com/menu?lang=en" />
<link rel="alternate" hreflang="x-default" href="https://dominio.com/menu" />
```

**Strategia linguistica**: Il sito è primariamente in italiano. La versione inglese è accessibile aggiungendo `?lang=en` all'URL. Il tag `x-default` punta alla versione italiana.

#### Open Graph (Facebook, LinkedIn, WhatsApp)
```html
<meta property="og:title" content="Menu - Camera con Vista | Ristorante Bologna" />
<meta property="og:description" content="Scopri il menu del ristorante..." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://dominio.com/menu" />
<meta property="og:site_name" content="Camera con Vista" />
<meta property="og:locale" content="it_IT" />
<meta property="og:locale:alternate" content="en_US" />
<meta property="og:image" content="..." />  <!-- solo se disponibile -->
```

**Casi speciali**:
- Pagine evento: `og:type = "article"`, `og:image` = poster evento
- Altre pagine: `og:type = "website"`

#### Twitter Card
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />  <!-- solo se disponibile -->
```

### 5. JSON-LD Strutturato

Dati strutturati iniettati come `<script type="application/ld+json">` per Google Rich Results.

#### Restaurant (solo Home)
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Camera con Vista",
  "alternateName": "Camera con Vista Bistrot",
  "description": "...",
  "url": "https://dominio.com",
  "telephone": "+39 051 267889",
  "email": "info@cameraconvistabologna.it",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via San Felice 21/A",
    "addressLocality": "Bologna",
    "addressRegion": "BO",
    "postalCode": "40122",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 44.4949,
    "longitude": 11.3366
  },
  "servesCuisine": ["Italian", "Cocktails"],
  "priceRange": "€€-€€€",
  "hasMenu": { "@type": "Menu", "url": "/menu" },
  "sameAs": ["instagram_url", "facebook_url"]
}
```

I dati di contatto (telefono, email, social) vengono letti dal `footer_settings` nel database per rimanere sincronizzati con il footer pubblico.

#### Menu (pagina Menu)
```json
{
  "@context": "https://schema.org",
  "@type": "Menu",
  "name": "Menu Camera con Vista",
  "url": "/menu"
}
```

#### Event (pagine evento singolo `/eventi/:id`)
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Nome Evento",
  "startDate": "2026-02-14T20:00:00Z",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Camera con Vista",
    "address": { "..." }
  },
  "image": "url_poster",
  "organizer": { "@type": "Restaurant", "name": "Camera con Vista" }
}
```

#### BreadcrumbList (tutte le pagine)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" },
    { "@type": "ListItem", "position": 2, "name": "Menu", "item": "/menu" }
  ]
}
```

### 6. Client-Side Title Update

File: `client/src/App.tsx` → `PublicPageRoute`

```typescript
const PAGE_TITLES: Record<string, { it: string; en: string }> = {
  home: { it: "Camera con Vista - Ristorante & Cocktail Bar Bologna", en: "..." },
  menu: { it: "Menu - Camera con Vista | Ristorante Bologna", en: "..." },
  // ... tutte le pagine
};

function PublicPageRoute({ component, slug }) {
  const { language } = useLanguage();
  const { data: visiblePages } = useQuery(["/api/pages"]);
  const page = visiblePages.find(p => p.slug === slug);

  useEffect(() => {
    const customTitle = language === "it" ? page?.metaTitleIt : page?.metaTitleEn;
    document.title = customTitle || PAGE_TITLES[slug][language];
  }, [slug, language, page]);
}
```

**Perché è necessario**: In una SPA, la navigazione tra pagine avviene lato client (senza nuove richieste al server). Senza questo `useEffect`, il titolo nella tab del browser resterebbe quello della prima pagina caricata. Il middleware SEO server-side funziona solo per le richieste dirette (crawler, primo accesso, refresh).

### 7. Pannello Admin SEO

Path: `/admina/seo`  
File: `client/src/pages/admin/seo.tsx`

**Funzionalità**:
- Mostra una card per ogni pagina del sito
- Per ogni pagina: 4 campi editabili
  - Meta Title IT / EN (input, con contatore caratteri /60)
  - Meta Description IT / EN (textarea, con contatore caratteri /160)
- Pulsante "Salva" per pagina (attivo solo se ci sono modifiche)
- Indicatore visivo: "Salvato" (check verde) quando non ci sono modifiche pendenti

**Salvataggio**: `PATCH /api/admin/pages/:id` con payload:
```json
{
  "metaTitleIt": "...",
  "metaTitleEn": "...",
  "metaDescriptionIt": "...",
  "metaDescriptionEn": "..."
}
```

**Note**: I metadati SEO sono salvati nella tabella `pages` (colonne `meta_title_it`, `meta_title_en`, `meta_description_it`, `meta_description_en`). Il middleware SEO legge questi valori ad ogni richiesta e li usa come priorità rispetto ai default.

## Sicurezza e Sanitizzazione

- **Escape HTML**: I valori dei meta tag vengono sanitizzati con `escapeHtml()` e `escapeAttr()` per prevenire XSS injection
- **Escape XML**: I valori nella sitemap vengono sanitizzati con `escapeXml()`
- **Esclusione admin**: Il middleware esclude tutte le route che iniziano con `/admina` o che terminano con estensioni di asset (`.js`, `.css`, `.png`, etc.)
- **Nessun dato sensibile**: I meta tag non espongono informazioni admin, sessioni o dati interni

## Scalabilità

### Performance
- **Per-request DB fetch**: Ogni richiesta HTML legge le pagine dal database per costruire i meta tag. A scala corrente (8 pagine + pochi eventi) è trascurabile.
- **Miglioramento futuro**: Implementare cache in-memory con TTL breve (es. 60 secondi) per `storage.getPages()` e `storage.getEvents()` nel middleware SEO.
- **Sitemap caching**: Header `Cache-Control: public, max-age=3600` (1 ora) sul sitemap.

### Estensibilità
- **Nuove pagine**: Aggiungere entry in `SLUG_TO_PATH`, `DEFAULT_PAGE_TITLES_IT/EN`, `DEFAULT_PAGE_DESCS_IT/EN` in `server/seo.ts`, e in `PAGE_TITLES` in `App.tsx`.
- **Nuovi tipi JSON-LD**: Aggiungere condizioni in `buildSeoData()` basate su slug/pathname.
- **OG Image per pagina**: Attualmente solo gli eventi hanno `og:image` (poster). Possibile estendere con campo `ogImageUrl` nella tabella `pages`.
- **Schema.org aggiuntivi**: Possibile aggiungere `FoodEstablishment`, `AggregateRating`, `OpeningHoursSpecification` al Restaurant schema.

### Multi-dominio
- Il `baseUrl` viene costruito dinamicamente da `req.headers` (`x-forwarded-proto`, `x-forwarded-host`), quindi funziona correttamente con:
  - Dominio Replit (`.replit.app`)
  - Dominio custom
  - Localhost in sviluppo

## Interazione con Altri Sistemi

### Draft/Publish
I meta tag SEO **non** sono soggetti al sistema draft/publish. Quando l'admin salva un meta title/description, questo viene immediatamente utilizzato dal middleware SEO per le richieste successive. Non è necessario "pubblicare" per rendere effettive le modifiche SEO.

### Google Sheets Sync
Il sync Google Sheets **non** interagisce con il sistema SEO. Il sync aggiorna `menu_items`, `wines`, `cocktails` — tabelle che non hanno campi SEO. I meta tag delle pagine menu/vini/cocktail sono gestiti separatamente tramite il pannello SEO admin.

### Footer Settings
Il schema JSON-LD `Restaurant` (iniettato solo nella Home) legge telefono, email e social links dal `footer_settings` nel database. Se il footer viene aggiornato, i dati strutturati si aggiornano automaticamente alla prossima richiesta.

### Bilinguismo
Il sistema SEO rispetta il parametro `?lang=en` per servire meta tag nella lingua corretta:
- URL senza `?lang=en` → meta tag in italiano
- URL con `?lang=en` → meta tag in inglese
- Canonical URL include il parametro lingua quando presente
- hreflang tags sempre presenti in entrambe le direzioni

## Debugging SEO

### Verificare meta tag iniettati
```bash
curl -s https://dominio.com/menu | grep -E '<title>|<meta|<link rel="canonical"|application/ld\+json'
```

### Verificare sitemap
```bash
curl -s https://dominio.com/sitemap.xml
```

### Verificare robots.txt
```bash
curl -s https://dominio.com/robots.txt
```

### Problemi comuni

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| Titolo uguale su tutte le pagine | `req.path` usato al posto di `req.originalUrl` | Verificare che `buildSeoData()` usi `req.originalUrl` |
| Meta tag non iniettati | HTML non contiene `</head>` o è un asset statico | Verificare che il middleware escluda correttamente gli asset |
| Sitemap vuota | Nessuna pagina con `isVisible=true` | Verificare `SELECT slug, is_visible FROM pages` |
| JSON-LD mancante | Pagina non mappata in `SLUG_TO_PATH` | Aggiungere il mapping |
| Titolo non aggiornato in SPA | `PAGE_TITLES` in App.tsx non include lo slug | Aggiungere entry in `PAGE_TITLES` |

## Checklist SEO

- [x] robots.txt blocca `/admina` e `/api/admin/`
- [x] Sitemap dinamica con tutte le pagine visibili + eventi attivi
- [x] Hreflang bidirezionale IT/EN/x-default
- [x] Title unico per ogni pagina
- [x] Meta description unica per ogni pagina
- [x] Canonical URL corretto per ogni pagina
- [x] Open Graph completo (title, description, type, url, site_name, locale)
- [x] Twitter Card (summary_large_image)
- [x] JSON-LD Restaurant con indirizzo, geo, menu
- [x] JSON-LD BreadcrumbList per ogni pagina
- [x] JSON-LD Event per pagine evento singolo
- [x] JSON-LD Menu per pagina menu
- [x] Admin panel per personalizzazione meta tag per pagina
- [x] Client-side title update per navigazione SPA
- [x] Escape/sanitizzazione di tutti i valori iniettati
