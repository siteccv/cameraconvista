# 06 - SEO

> Diagnosi dai dati reali (Search Console/Analytics) e piano di miglioramento: vedi `07_SEO_ANALISI.md`.

## Scopo

Documentare solo la parte SEO che e abbastanza delicata da meritare un file separato.

## Architettura SEO reale

Il SEO non dipende dal rendering client-side.

- Express intercetta l'HTML
- `server/seo.ts` genera meta e dati strutturati
- il server inietta i tag prima di servire la pagina

Questo vale sia in dev sia in prod, con meccanismi diversi di serving.

## Comportamenti principali

- meta title e description server-side
- canonical
- hreflang IT / EN / x-default
- Open Graph
- Twitter card
- JSON-LD
- sitemap dinamica
- `robots.txt`

## File chiave

- `server/seo.ts`
- `server/index.ts`
- `server/static.ts`
- `client/src/App.tsx`
- `client/public/robots.txt`
- `client/src/pages/admin/seo.tsx`

## Fatti importanti

- Il middleware usa `req.originalUrl`
- Le route `/admina` e gli asset statici sono esclusi
- La navigazione SPA aggiorna `document.title` lato client
- Il lazy loading delle route non sostituisce il SEO server-side e non lo rompe

## Sitemap

- `GET /sitemap.xml`
- include pagine visibili
- include eventi pubblicabili secondo la logica di visibilita

## Canonical e redirect

Redirect canonici rilevanti:

- `/home` -> `/`
- `/carta-vini` -> `/lista-vini`
- `/carta-dei-vini` -> `/lista-vini` (legacy Soft 404)
- `/orari-prenotazioni` -> `/dove-siamo` (legacy Soft 404)
- `/qrmenu_home` -> `/menu` (legacy Soft 404; il QR nuovo usa gia' il link corretto, questo e' solo rete di sicurezza per menu vecchi)
- `/wine-list` -> `/lista-vini`, `/restaurant-menu` -> `/menu`, `/address-map` -> `/dove-siamo`, `/chi-siamo` -> `/dove-siamo` (vecchi permalink WordPress)
- `/category/eventi`, `/author/filiberto`, `/2020/san-valentino` -> `/` (residui blog WordPress)
- `/en/*` -> path canonico con `?lang=en`
- (`/contatti` NON è un redirect: è una pagina reale del router client)
- Redirect apex->www e www stesso: gestiti da Render (`redirectForName`) e dal middleware in `server/index.ts`. Il dominio nudo `cameraconvista.it` ha record A verso l'IP apex di Render (216.24.57.8).

## Noindex pagine nascoste

Le pagine con `is_visible=false` o `is_draft=true` ricevono `<meta name="robots" content="noindex, nofollow">` iniettato server-side (`server/seo.ts`, campo `noindex` in `SeoData`). Evita che pagine nascoste (es. `/eventi`) vengano marcate Soft 404 da Google. Le pagine visibili non sono toccate. Stessa regola per le pagine evento `/eventi/:id`: se l'evento è inattivo (`active=false`) o inesistente, la pagina è noindex; gli eventi attivi restano indicizzabili.

## Hard 404 per percorsi sconosciuti (15/09/2026)

I percorsi HTML fuori dall'elenco pagine note rispondono **HTTP 404** servendo comunque la shell SPA (il client mostra la pagina NotFound). L'elenco è `isKnownPath()` in `server/seo.ts`: SLUG_TO_PATH + EXTRA_CLIENT_PATHS + `/eventi/<id numerico>` + prefissi admin — **va tenuto allineato alle route di `client/src/App.tsx`** quando si aggiunge una pagina. Applicato in `server/static.ts` (prod) e `server/vite.ts` (dev, dove il path reale è `req.originalUrl`). Sitemap/robots e redirect legacy non passano di qui.

## Admin SEO

- I meta tag pagina sono gestiti dalla sezione admin SEO
- Le modifiche SEO non sono soggette al draft/publish delle pagine
- Il backend le usa direttamente alla richiesta successiva
- **Precedenza:** DB (`pages.meta_*`) vince sui default in `server/seo.ts`; i default sono solo fallback
- 15/09/2026: meta ottimizzati sulle query GSC scritti nel DB per 8 pagine (IT+EN, vedi `07_SEO_ANALISI.md`); `eventi-privati-cena` aggiunto a `SLUG_TO_PATH` (meta DB + sitemap attivi); JSON-LD LocalBusiness aggiunto a `/colli`
- 15/09/2026: `/colli` era pagina orfana (mai scansionata da Google) → ora linkata dal footer di tutto il sito principale (`Footer.tsx`, testo stagionale "aprile–inizio ottobre"); description colli con stagionalità nel DB
- 15/09/2026: conversioni GA4 attive — evento `richiesta_evento` inviato dal server a invio modulo (`server/routes/event-request.ts`, Measurement Protocol, richiede `GA4_API_SECRET`+`GA4_MEASUREMENT_ID` in env) e `prenota_whatsapp` derivato dai click su wa.me (regola nel data stream GA4); entrambi marcati eventi chiave nella proprietà 524837076

## Regola pratica per l'agent

Se tocchi:

- path pubblici
- slug
- redirect
- mapping pagina / meta
- visibilita pagine o eventi

devi verificare impatto su:

- `server/seo.ts`
- sitemap
- canonical
- hreflang
- titolo client-side in `App.tsx`
