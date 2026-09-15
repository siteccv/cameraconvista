# ANALISI 360° — SITE-CCV

> Sessione di allineamento e diagnosi del 15/09/2026. Sola lettura sul codice; le uniche modifiche
> fatte sono quelle di consolidamento elencate in fondo. Nessuna proposta di questo report viene
> eseguita senza approvazione esplicita, una per una.

## Panoramica del progetto

**Camera con Vista** (`www.cameraconvista.it`) — sito vetrina + menu del locale di Bologna, con
dentro anche il sito di **Camera con Vista Colli** (`/colli` e menu QR `/colli/menu`).

- **Stack:** React 18 + Vite 7 + TypeScript, Express 5 (server unico che serve anche il frontend),
  Drizzle ORM, Supabase (Postgres + Storage), deploy su Render (servizio unico `cameraconvista`).
- **SEO server-side:** `server/seo.ts` genera title/description/canonical/hreflang/JSON-LD/sitemap
  prima di servire l'HTML. Non dipende dal JavaScript del browser.
- **Admin:** `/admina` (CCV) e `/colli/admina` (Colli), protetti e esclusi dall'indicizzazione.
- **Stato:** sito **sano e in crescita** (posizione media ~5,6 su Google; 2.818 utenti negli ultimi
  28 giorni). Nessun guasto in produzione rilevato.

## Mappa piattaforme esterne

| Piattaforma | Dove è usata | Accesso | Cosa manca |
|---|---|---|---|
| GitHub (`siteccv/cameraconvista`) | repo del codice, CI | ✅ lettura+scrittura (gh CLI + token) | — |
| Render (`cameraconvista`) | hosting, deploy unico, autoDeploy su `main` | ✅ lettura+scrittura (API key) | — |
| Supabase (`pjrdnfbfpogvztfjuxya`) | DB (23 tabelle) + Storage (2 bucket) | ✅ anon, service role, Postgres diretto | — |
| Serverplan / cPanel (`cms042.cmshigh.com`) | dominio, DNS, 1 casella email legacy | ✅ lettura+scrittura (API token `claude-audit`) | — |
| Google Search Console | indicizzazione | ✅ via service account (proprietà Dominio, creata oggi) | dati in ripopolamento 1-2 giorni |
| Google Analytics (GA4 `properties/524837076`) | statistiche traffico | ✅ via service account (Lettore) | — |
| Resend (account `cameraconvista`) | email richieste eventi | ✅ chiave full-access `claude-audit` | attivare mittente proprio su Render (proposta 1) |
| Google Tag Manager `GTM-M7MXXDG3` | carica GA4 `G-C2445988JV` | solo da codice (su richiesta owner) | — |
| Google Sheets | sync menu/vini/cocktail via CSV pubblici | solo da codice (su richiesta owner) | — |
| resOS | prenotazioni (link esterni) | solo da codice (su richiesta owner) | — |
| App RSVP (`rsvp-p91d.onrender.com`) | inviti eventi (progetto separato, attivo) | solo da codice (su richiesta owner) | — |
| Bridge Colli (`ccvcolli-ghxg.onrender.com`) | fonte menu Colli (fallback, oggi 404 su `/`) | solo da codice (su richiesta owner) | — |
| OpenAI | traduzioni | solo da codice (su richiesta owner) | — |
| Unsplash | immagini di default hardcoded | solo da codice (su richiesta owner) | — |
| Google Workspace | posta del dominio (MX) | non richiesto | — |
| Brevo | **solo record DNS**, mai nel codice | non richiesto | ✅ residuo confermato dall'owner → record DNS rimossi il 15/09/2026 |

## Problemi trovati

### CRITICO
Nessuno. Il sito funziona, è indicizzato e le email arrivano.

### MEDIO

1. ~~SPF della posta incompleto~~ **RISOLTO 16/09/2026:** il record è ora
   `v=spf1 include:_spf.google.com ip4:86.107.36.176 ~all` — include Google (la posta vera),
   mantiene il server Serverplan, toglie le autorizzazioni inutili (`+a`/`+mx`). Resend resta
   coperto dal suo SPF dedicato su `send.cameraconvista.it`. Verificato su ns1 e ns2.
2. ~~Pagine inesistenti rispondono 200 invece di 404~~ **RISOLTO NEL CODICE 16/09/2026** (in
   attesa di push): i percorsi sconosciuti ora rispondono 404 (mostrando comunque la pagina
   "non trovato" del sito). Elenco pagine valide in `isKnownPath()` (`server/seo.ts`), applicato in
   produzione (`server/static.ts`) e sviluppo (`server/vite.ts`). Verificato in locale su build di
   produzione: pagine vere 200, inventate 404, redirect legacy e sitemap/robots intatti.
3. ~~Mittente email ancora `onboarding@resend.dev`~~ **RISOLTO 16/09/2026:** aggiunta
   `RESEND_SENDER_DOMAIN=cameraconvista.it` alle env di Render, deploy completato e sito
   verificato. Le prossime email di richiesta evento partono da `noreply@cameraconvista.it`.

### BASSO

4. ~~DMARC con report verso Brevo~~ **RISOLTO 15/09/2026:** DMARC ora è `v=DMARC1; p=none;` senza
   riferimenti a Brevo. Politica invariata, solo tolto l'indirizzo di report abbandonato.
5. **Casella email legacy su cPanel** `reservations@cameraconvista.it` (81k messaggi): non riceve
   più nulla dall'esterno (la posta va su Google). Da confermare che nessuno la usi, poi rimuovere
   casella + record DNS collegati (`webdisk`, `cpcalendars`, `_caldav*`, ecc.).
6. **Branch `replit-agent`** fermo ad aprile 2026, 592 commit dietro `main`: quasi certamente
   morto, ma contiene commit unici → non eliminato, da decidere.
7. **Residui legacy nel worktree** (tutti già in `.gitignore`, nessun danno): `BACKUP/`,
   `coverage/`, `dist/`, `test-results/`, `attached_assets/` (⚠ NON è un residuo: usato dal codice
   via alias `@assets`), `LOGOS/`, file untracked `PROMPT_DEROARTS_CCV_IMMAGINI.md`.
8. **Manca `DNA/00` (indice)**: la documentazione DNA è buona ma senza indice → **serve
   consolidamento DNA** (piccolo).
9. **Immagini di default da Unsplash** hardcoded in `client/src/lib/page-defaults.ts` e
   `homeDefaults.ts`: dipendenza esterna evitabile; esiste già lo script di migrazione su Supabase.

### Residui chiariti in questa sessione

- **Brevo = residuo CONFERMATO dall'owner il 15/09/2026 e rimosso.** Eliminati gli 8 record DNS
  Brevo/Sendinblue (brevo-code su apex e `inbound`, 4 CNAME DKIM, 2 MX `inbound`) e ripulito il
  DMARC. Verificato dopo la rimozione: MX Google, CNAME `www`, SPF, record Resend e verifica
  Google tutti intatti.
- **Rimossi il 15/09 (test concluso al 100%):** token cPanel `claude-dns` (irrecuperabile), remote
  git `gitsafe-backup` (host inesistente, era di Replit), variabile doppione `GITHUB_REPO_URL` nel
  `.env` (non usata dal codice).

## SEO e indicizzazione

### Camera con Vista (www.cameraconvista.it)
**Stato: BUONO.** Verificato in produzione:
- ✅ Title e description unici e sensati per pagina, generati server-side
- ✅ Canonical corretto su ogni pagina; hreflang IT/EN/x-default funzionante (EN traduce davvero)
- ✅ Redirect tutti giusti: apex→www 301, http→https 301, `onrender.com`→www 301 (nessun
  contenuto duplicato: la vecchia proprietà GSC `cameraconvista.onrender.com` mostra
  correttamente "pagina con reindirizzamento")
- ✅ Sitemap dinamica valida con hreflang; robots.txt corretto (blocca `/admina` e `/api/admin`)
- ✅ JSON-LD presente (menu, indirizzo, geo, breadcrumb); GTM + GA4 attivi con consenso cookie
- ⚠ Soft-404 (problema n. 2)
- 📊 Dati (12 mesi, da DNA/07): ~5.700 clic, ~110k impressioni, posizione media 5,6. Brand
  dominante (pos. ~1, CTR 23-36%). **Margine vero**: query generiche ("aperitivo bologna" 2.843
  impressioni/CTR 0,5%, "cocktail bar bologna", "rooftop bologna") — si appare ma non si viene
  cliccati. Mobile domina (75% dei clic).
- 🆕 Oggi creata la **proprietà Dominio** su Search Console (copre tutto): dati completi tra 1-2
  giorni, leggibili da me via service account.

### Camera Colli (/colli e /colli/menu)
**Stato: BUONO, con potenziale.**
- ✅ `/colli` e `/colli/menu` indicizzabili, title/canonical propri, manifest PWA dedicato
- ✅ `/colli/menu` è la **pagina più vista del sito** (2.979 viste/28gg, più della home) e ha il
  miglior CTR da Google (14,8%)
- ⚠ Il menu QR vive sotto il dominio CCV: giusto così finché Colli non ha un dominio proprio
- ⚠ JSON-LD dei Colli più povero (solo breadcrumb): manca un blocco LocalBusiness/Menu dedicato

## Automatismi attivi

| Automatismo | Dove | Quando |
|---|---|---|
| CI qualità (typecheck, lint, audit, build, test, e2e) | GitHub Actions `quality.yml` | ogni push su `main` e ogni PR |
| Keepalive Supabase | GitHub Actions `supabase-keepalive.yml` | ogni notte 03:20 |
| **autoDeploy Render** | push su `main` → **produzione** | sempre — push = deploy |
| Pulizia sessioni admin scadute | `server/index.ts` | all'avvio + ogni 15 min |
| Cache menu Colli (60s) + fallback bridge | `server/routes/colli.ts` | runtime |

## Divergenze doc ↔ codice ↔ DB

- Nessuna divergenza sostanziale: `DNA/` (luglio 2026) rispecchia il codice attuale.
- Manca solo `DNA/00` indice (→ consolidamento DNA, intervento piccolo).
- `.env.example` elenca `GITHUB_REPO_URL` che App Control non ha (solo `GITHUB_URL`): duplicato
  innocuo nel `.env` locale.

## Proposte di intervento (in ordine di valore)

| # | Proposta | Rischio | File/dove |
|---|---|---|---|
| 1 | ~~Attivare mittente `noreply@cameraconvista.it`~~ ✅ **FATTO 16/09/2026** (env Render + deploy verificato) | — | Render env |
| 2 | ~~Correggere SPF~~ ✅ **FATTO 16/09/2026** (Google incluso; Resend già coperto su `send.`) | — | DNS via cPanel |
| 3 | ~~Fix soft-404~~ ✅ **FATTO NEL CODICE 16/09/2026** — online al prossimo push | — | `server/static.ts`, `server/seo.ts`, `server/vite.ts` |
| 4 | **Titoli/description orientati alle query generiche** ("aperitivo bologna", "cocktail bar bologna", "rooftop") su home, `/cocktail-bar`, `/menu` — è il margine SEO più grande | Basso | `server/seo.ts` / admin SEO |
| 5 | **JSON-LD LocalBusiness+Menu per Colli** | Basso | `server/seo.ts` |
| 6 | **Pulizia email legacy** — (a) record Brevo ✅ FATTO 15/09 e (c) DMARC ✅ FATTO 15/09; resta solo (b): conferma casella `reservations@` inutile → via casella + record cPanel | Basso (dopo conferma) | DNS + cPanel |
| 7 | **Consolidamento DNA**: creare `DNA/00` indice | Nullo | `DNA/` |
| 8 | **Migrare le immagini Unsplash di default su Supabase** con lo script esistente | Basso | `scripts/migrate-all-images-to-supabase.ts` |
| 9 | **Decidere il destino del branch `replit-agent`** (tenere come archivio o eliminare) | Nullo/Basso | git |
| 10 | **Salvare le richieste evento su Supabase** (proposta owner 16/09): oggi esistono SOLO come email — se un'email va persa, la richiesta è persa. Nuova tabella + elenco in area admin | Basso (additivo) | `server/routes/event-request.ts`, nuova migrazione, admin |

## Consolidamento fatto in questa sessione (già attivo)

- `CLAUDE.md` aggiornato dalla versione canonica di App Control
- Credenziali nuove create e salvate in App Control + `.env`: cPanel (`CPANEL_*`), Resend admin
  (`RESEND_ADMIN_API_KEY`), Google service account (`GCP_SERVICE_ACCOUNT_JSON`,
  chiave in `~/.config/site-ccv/`), `RESEND_SENDER_DOMAIN` (pronta, non attiva in prod)
- **Dominio verificato su Resend** (aggiunti 2 record DNS `send.*`) — le email evento erano e
  restano consegnate (7/7 negli ultimi 25 giorni)
- **Proprietà Dominio Search Console** creata e verificata via DNS; service account collegato a
  GSC (Completa) e GA4 (Lettore)
- Pulizia certa: token cPanel orfano revocato, remote git morto rimosso
- `.gitignore` già conforme (`.env`, `.mcp.json`, `.agent/` presenti)
