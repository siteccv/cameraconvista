# 02 - Logiche Critiche

## Scopo

Documentare solo i flussi che un agent deve capire prima di intervenire, per evitare regressioni o ricostruzioni inutili.

## Draft / Publish pagine

Sistema valido per `pages` e `page_blocks`.

- L'admin lavora sul draft
- Il pubblico legge lo snapshot pubblicato
- Pubblicare significa aggiornare `publishedSnapshot` e riportare `isDraft=false`

File chiave:

- `server/routes/pages.ts`
- `client/src/hooks/use-page-blocks.ts`

## Menu, vini e cocktail

Il pubblico non legge le tabelle draft direttamente.

- Le tabelle operative sono `menu_items`, `wines`, `cocktails`
- Il pubblico usa gli snapshot JSON pubblicati in `site_settings`
- L'admin vede e modifica i dati correnti

Questo flusso e separato dal publish delle pagine.

File chiave:

- `server/routes/menu.ts`
- `server/routes/sync.ts`

## Auth admin

- Login admin con cookie `ccv_admin_session`
- Password canonica in `site_settings.admin_password_hash`
- Nessun fallback debole in production
- Minimo password: 10 caratteri
- Cleanup automatico delle `admin_sessions` scadute a startup e ogni 15 minuti

File chiave:

- `server/routes/auth.ts`
- `server/routes/helpers.ts`
- `server/index.ts`

## Booking dialog condiviso

Il modale booking e condiviso e non va duplicato.

Uso corrente:

- Home
- Menu
- Cocktail Bar
- Dove Siamo
- Dettaglio Evento

Il testo multilinea viene renderizzato preservando i ritorni a capo.

File chiave:

- `client/src/components/home/BookingDialog.tsx`

## Eventi privati

- La sottopagina `cena` esiste ancora nel codice
- Il routing pubblico la disattiva se `PRIVATE_DINNER_ENABLED=false`
- Non rimuoverla o riattivarla senza richiesta esplicita

File chiave:

- `client/src/lib/private-events-config.ts`
- `client/src/App.tsx`

## Media e immagini

- Upload e rotazioni passano dal backend
- Il backend converte/comprime in WebP con `sharp`
- Non creare upload diretti client-side fuori dai flussi esistenti

File chiave:

- `server/routes/media.ts`

## Preload immagini

- Non esiste piu un preload globale di tutte le pagine
- Il prefetch immagini resta legato a interazioni esplicite in navigazione desktop
- La voce Colli non prefetcha asset pesanti dalla navbar
- L'obiettivo e contenere Supabase Storage / cached egress

Non reintrodurre preload massivi senza motivazione forte.

File chiave:

- `client/src/components/layout/Header.tsx`

## Embed esterno menu Colli

- L'incorporamento esterno non e aperto globalmente
- Solo `/colli/menu` puo essere mostrato in `iframe`
- Gli origin autorizzati sono solo `https://www.cashin.coop` e `https://cashin.coop`
- Il resto del sito continua a rispondere con `X-Frame-Options: SAMEORIGIN`
- Non aprire CORS o iframe globali per risolvere integrazioni esterne

File chiave:

- `server/index.ts`

## Cosa non duplicare

- Logica BookingDialog
- Flusso draft/publish
- Flusso snapshot menu/vini/cocktail
- Verifica auth admin
- Logica SEO server-side
