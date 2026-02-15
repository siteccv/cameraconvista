# Report: Allineamento SEO e Consistenza Canonica (IT/EN)

## 1. Descrizione dell'intervento
L'obiettivo è stato risolvere il problema del "duplicate/canonical mismatch" segnalato su Google Search Console, garantendo che tutti i segnali SEO (canonical, hreflang, html lang, og:locale, JSON-LD) siano perfettamente coerenti quando viene richiesta la versione inglese tramite il parametro `?lang=en`.

## 2. Modifiche effettuate

### Backend (server/seo.ts)
- **Rilevamento Lingua**: L'interfaccia `SeoData` ora include esplicitamente il campo `lang` per propagare la lingua rilevata.
- **HTML Lang**: La funzione `injectSeoIntoHtml` è stata aggiornata per sostituire dinamicamente l'attributo `<html lang="...">` nel sorgente HTML servito al browser/crawler.
- **OpenGraph Locale**: 
  - Se `lang=en`: `og:locale` = `en_US`, `og:locale:alternate` = `it_IT`.
  - Se `lang=it`: `og:locale` = `it_IT`, `og:locale:alternate` = `en_US`.
- **JSON-LD Consistente**:
  - Gli URL negli schemi `Restaurant` e `Menu` ora includono correttamente `?lang=en` se la lingua corrente è inglese.
  - Gli item della `BreadcrumbList` ora propagano coerentemente il parametro `?lang=en` in tutti gli URL della catena di navigazione se la lingua è inglese.
- **Canonical & Hreflang**: Mantenuta la logica di self-canonicalizzazione coerente (l'URL EN punta a se stesso con `?lang=en`).

### Integrazione (server/index.ts & server/static.ts)
- Aggiornate le chiamate a `generateSeoHtml` e `injectSeoIntoHtml` per passare correttamente il valore della lingua rilevata durante la fase di iniezione.

## 3. Risultati dei Test

### URL: `/menu?lang=en`
- **HTML Tag**: `<html lang="en">` (CORRETTO)
- **Canonical**: `<link rel="canonical" href=".../menu?lang=en" />` (CORRETTO)
- **OG Locale**: `og:locale` = `en_US` (CORRETTO)
- **JSON-LD URL**: `"url": ".../menu?lang=en"` (CORRETTO)
- **Breadcrumbs**: Item "Home" e "Menu" includono entrambi `?lang=en` (CORRETTO)

### URL: `/?lang=en` (Homepage EN)
- **HTML Tag**: `<html lang="en">` (CORRETTO)
- **Canonical**: `<link rel="canonical" href=".../?lang=en" />` (CORRETTO)
- **OG Locale**: `og:locale` = `en_US` (CORRETTO)
- **JSON-LD Restaurant**: `"url": ".../?lang=en"` (CORRETTO)

## 4. Validazione in Google Search Console (GSC)
Per convalidare la correzione:
1. Accedi a GSC e seleziona la proprietà.
2. Usa lo strumento "Controllo URL" su una pagina con `?lang=en` (es. `https://www.cameraconvista.it/menu?lang=en`).
3. Clicca su **"Testa URL pubblicato"**.
4. Verifica nel tab "Codice sorgente" che `<html lang="en">` e `og:locale` siano corretti.
5. Se tutto è coerente, clicca su **"Convalida correzione"** nel report delle pagine "Duplicate, Google ha scelto una pagina canonica diversa dall'utente".

---
**Stato**: Fix applicato e verificato in ambiente di sviluppo.
