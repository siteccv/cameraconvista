# 06 - SEO

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
- `/contatti` -> `/dove-siamo`
- `/en/*` -> path canonico con `?lang=en`

## Admin SEO

- I meta tag pagina sono gestiti dalla sezione admin SEO
- Le modifiche SEO non sono soggette al draft/publish delle pagine
- Il backend le usa direttamente alla richiesta successiva

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
