# Report Analisi SEO — Search Console + Sitemap su Render
**Data**: 9 Febbraio 2026  
**Dominio analizzato**: `https://cameraconvista.onrender.com`  
**Dominio ufficiale**: non toccato (punta ancora al vecchio sito)

---

## 1. Stato attuale (Render vs dominio ufficiale)

| Aspetto | Render | Dominio ufficiale |
|---|---|---|
| URL | `https://cameraconvista.onrender.com` | Non coinvolto |
| Deploy | Attivo, HTTP 200 su tutte le pagine | Vecchio sito, non toccare |
| Database | PostgreSQL (Neon) collegato | — |
| SEO middleware | Codice presente ma **non funzionante** (vedi sotto) | — |

**Tutte le pagine pubbliche rispondono HTTP 200**: home, menu, lista-vini, cocktail-bar, eventi, eventi-privati, galleria, contatti.

---

## 2. Verifica endpoints

### 2.1 robots.txt — HTTP 200

**Contenuto servito**:
```
User-agent: *
Allow: /
Disallow: /admina
Disallow: /admina/
Disallow: /api/admin/

Sitemap: /sitemap.xml
```

**Valutazione**:
- Admin e API admin correttamente bloccati
- Nessuna pagina pubblica bloccata
- **Problema**: la direttiva `Sitemap:` usa un **percorso relativo** (`/sitemap.xml`). Secondo le specifiche ufficiali di Google, deve essere un **URL assoluto completo** (es. `Sitemap: https://cameraconvista.onrender.com/sitemap.xml`). In pratica Google lo accetta comunque, ma è formalmente non conforme.

### 2.2 sitemap.xml — HTTP 200

**Contenuto servito**: XML valido, generato dinamicamente dal server.

**Pagine incluse** (8 pagine + 1 evento):

| URL | priority | changefreq | hreflang IT | hreflang EN | hreflang x-default |
|---|---|---|---|---|---|
| `/` | 1.0 | daily | presente | `/?lang=en` | presente |
| `/menu` | 0.8 | weekly | presente | `/menu?lang=en` | presente |
| `/lista-vini` | 0.8 | weekly | presente | `/lista-vini?lang=en` | presente |
| `/cocktail-bar` | 0.8 | weekly | presente | `/cocktail-bar?lang=en` | presente |
| `/eventi` | 0.8 | weekly | presente | `/eventi?lang=en` | presente |
| `/eventi-privati` | 0.8 | weekly | presente | `/eventi-privati?lang=en` | presente |
| `/galleria` | 0.8 | weekly | presente | `/galleria?lang=en` | presente |
| `/contatti` | 0.8 | weekly | presente | `/contatti?lang=en` | presente |
| `/eventi/3` | 0.6 | weekly | presente | `/eventi/3?lang=en` | **MANCANTE** |

**Valutazione**:
- Base URL corretto: `https://cameraconvista.onrender.com`
- `lastmod` presente (data odierna)
- Hreflang IT/EN/x-default presenti e bidirezionali per tutte le pagine statiche
- **Problema minore**: l'evento `/eventi/3` **manca** di `hreflang x-default`. Le pagine statiche lo hanno; l'evento no. Incoerenza nel codice (riga 405 di `server/seo.ts` non aggiunge x-default per gli eventi).
- Solo le pagine con `isVisible = true` nel DB sono incluse (corretto).
- Gli eventi rispettano la logica di visibilità (active + visibilityMode).

---

## 3. Verifica head tags (campioni URL)

### RISULTATO CRITICO: il middleware SEO NON sta iniettando i meta tag

Tutte le pagine testate restituiscono **gli stessi identici tag statici** presenti nell'`index.html` di build:

```html
<title>Camera con Vista Bistrot</title>
<meta name="description" content="Camera con Vista è riconosciuto come uno dei cocktail bar più rinomati di Bologna..." />
<meta property="og:title" content="Camera con Vista - Ristorante & Cocktail Bar" />
<meta property="og:description" content="Uno dei cocktail bar più rinomati di Bologna" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="it_IT" />
<meta property="og:locale:alternate" content="en_US" />
```

**Cosa MANCA su TUTTE le pagine** (verificato su `/`, `/menu`, `/lista-vini`, `/contatti`, `/menu?lang=en`):

| Tag | Stato |
|---|---|
| `<title>` specifico per pagina | ASSENTE — sempre "Camera con Vista Bistrot" |
| `<meta name="description">` specifico | ASSENTE — sempre lo stesso generico |
| `<link rel="canonical">` | ASSENTE |
| `<link rel="alternate" hreflang="it">` | ASSENTE |
| `<link rel="alternate" hreflang="en">` | ASSENTE |
| `<link rel="alternate" hreflang="x-default">` | ASSENTE |
| `<meta property="og:url">` | ASSENTE |
| `<meta property="og:site_name">` | ASSENTE |
| `<meta property="og:image">` | ASSENTE |
| `<meta name="twitter:card">` | ASSENTE |
| `<meta name="twitter:title">` | ASSENTE |
| `<meta name="twitter:description">` | ASSENTE |
| JSON-LD (Restaurant, BreadcrumbList, Menu) | ASSENTE |

### Diagnosi probabile

Il middleware in `server/index.ts` (righe 96-141) intercetta `res.send()` e `res.end()` cercando stringhe HTML con `</head>` e `<div id="root">`. **In ambiente di produzione** (build Vite compilata), il server Express probabilmente serve l'HTML tramite un meccanismo diverso (stream, `sendFile`, o middleware statico di Vite) che **bypassa** le funzioni `res.send` e `res.end` sovrascritte, impedendo l'iniezione dei meta tag.

Il sitemap.xml funziona correttamente perché è un endpoint Express dedicato (`app.get("/sitemap.xml")`), non dipende dall'intercettazione dell'HTML.

**Gravità**: ALTA — senza meta tag server-side, Google indicizzerà tutte le pagine con lo stesso title/description generico, nessun canonical, nessun hreflang.

---

## 4. Considerazioni su `?lang=en`

### Approccio attuale
- Italiano: URL base (es. `/menu`)
- Inglese: URL + query string (es. `/menu?lang=en`)
- Il parametro `?lang=en` è gestito lato client (React Context) e lato server (middleware SEO — quando funzionante)

### Pro
- Implementazione semplice, nessun routing separato
- Un solo set di URL da gestire
- Compatibile con la struttura SPA esistente
- Hreflang bidirezionale se il middleware SEO funziona

### Contro / Rischi
- **Google tratta i query parameter come URL separati** — potenziale duplicazione se il canonical non è configurato correttamente
- **Rischio di duplicate content**: senza canonical funzionante (attualmente è il caso), Google vede `/menu` e `/menu?lang=en` come due pagine con contenuto potenzialmente simile (dato che il rendering è client-side, il crawler potrebbe vedere lo stesso HTML per entrambe)
- **Indicizzazione EN debole**: se il crawler non esegue JavaScript (o lo esegue parzialmente), il contenuto inglese potrebbe non essere rilevato
- **Approccio alternativo** (non raccomandato ora): sottocartelle (`/en/menu`) sarebbero più robuste per SEO multilingua, ma richiederebbero refactor significativo

### Mitigazioni teoriche (da valutare in futuro, NO fix ora)
1. Assicurarsi che il middleware SEO inietti canonical + hreflang correttamente (richiede fix del middleware — vedi sezione 3)
2. Valutare se aggiungere `<meta name="robots" content="noindex">` alle versioni `?lang=en` se l'inglese non è prioritario per il posizionamento
3. In alternativa, prerendering/SSR delle pagine EN per garantire che il crawler veda il contenuto tradotto

---

## 5. Raccomandazioni non invasive — Cosa fare ORA in Search Console

### 5.1 Perché attivare Search Console su `cameraconvista.onrender.com` ORA

- Permette di **monitorare come Google vede il sito** prima del lancio ufficiale
- Consente di **sottomettere la sitemap** e verificare la copertura dell'indice
- Identifica eventuali errori di crawling, canonical, hreflang in anticipo
- Il dominio `.onrender.com` è un dominio reale e indicizzabile (non bloccato da Render)
- Zero impatto sul sito ufficiale attuale

### 5.2 Come procedere (azioni esterne, NO codice)

1. **Registrare la proprietà** `https://cameraconvista.onrender.com` in Google Search Console
   - Metodo consigliato: verifica tramite **URL prefix** (più semplice)
   - Alternativa: verifica tramite meta tag HTML (ma richiede modifica codice — evitare ora)
   - Il metodo DNS non è praticabile su dominio Render
2. **Sottomettere la sitemap**: `https://cameraconvista.onrender.com/sitemap.xml`
3. **Usare "URL Inspection"** su 3-4 URL campione per verificare cosa Google effettivamente vede (rendering JavaScript)
4. **Monitorare** per 7-14 giorni:
   - **Coverage / Copertura**: pagine indicizzate vs escluse
   - **Sitemaps**: stato di elaborazione
   - **Page Indexing**: motivi di esclusione (duplicate without canonical, crawled not indexed, ecc.)
   - **Canonical**: quale URL Google sceglie come canonical
   - **Core Web Vitals**: performance su Render (cold start potenziale)

### 5.3 Cosa NON fare ora

- **NON** registrare il dominio ufficiale in Search Console (punta al vecchio sito)
- **NON** impostare redirect dal vecchio sito al nuovo
- **NON** richiedere indicizzazione massiva
- **NON** modificare il DNS del dominio ufficiale
- **NON** aggiungere `<meta name="google-site-verification">` (richiederebbe modifica al codice)

---

## 6. Rischi residui e priorità

### Priorità ALTA (bloccanti per indicizzazione corretta)

| # | Rischio | Impatto | Note |
|---|---|---|---|
| 1 | **Middleware SEO non inietta meta tag in produzione** | Tutte le pagine hanno stesso title/description generico; nessun canonical, nessun hreflang, nessun JSON-LD | Probabilmente causato dal modo in cui Express/Vite serve l'HTML in build di produzione. Richiede debug del meccanismo di intercettazione `res.send/res.end` |
| 2 | **Nessun canonical su nessuna pagina** | Google potrebbe creare duplicati, specialmente con `?lang=en` | Conseguenza diretta del punto 1 |
| 3 | **Nessun hreflang su nessuna pagina** | Google non associa correttamente le versioni IT/EN | Conseguenza diretta del punto 1 |

### Priorità MEDIA (miglioramenti consigliati)

| # | Rischio | Impatto | Note |
|---|---|---|---|
| 4 | `robots.txt` usa percorso relativo per Sitemap | Formalmente non conforme, ma Google lo accetta | Fix banale: aggiungere URL completo |
| 5 | Evento in sitemap manca `hreflang x-default` | Incoerenza minore, potrebbe confondere il crawler | Fix: aggiungere riga x-default nel ciclo eventi in `seo.ts` |
| 6 | `lastmod` sempre uguale alla data odierna | Google potrebbe ignorarlo (non fornisce info reale) | Ideale: usare data effettiva di ultima modifica dal DB |
| 7 | Cold start Render (piano free) | Primo accesso dopo inattività può richiedere 30-60s | Impatto su Core Web Vitals e crawling |

### Priorità BASSA (ottimizzazioni future)

| # | Rischio | Impatto | Note |
|---|---|---|---|
| 8 | Approccio `?lang=en` meno robusto di `/en/` per SEO multilingua | Indicizzazione EN potenzialmente debole | Valutare solo se l'inglese diventa priorità strategica |
| 9 | Nessuna og:image sulla homepage | Condivisioni social senza immagine di anteprima | Aggiungere URL immagine rappresentativa |
| 10 | JSON-LD Menu con `hasMenuSection: []` vuoto | Schema.org non informativo | Popolare con dati reali dal menu |

---

## Conclusione

Il sistema SEO è **ben progettato nel codice** (middleware, sitemap dinamica, hreflang, JSON-LD), ma **il middleware di iniezione non funziona in produzione su Render**. Questo è il problema numero uno da risolvere prima di attivare Search Console in modo produttivo.

La sitemap è corretta e pronta. Il robots.txt è funzionale. Ma senza meta tag nelle pagine HTML, l'indicizzazione sarà subottimale.

**Azione consigliata**: Prima di investire tempo in Search Console, risolvere il problema di iniezione del middleware SEO in ambiente di produzione (priorità 1).
