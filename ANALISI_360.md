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

1. ~~SPF della posta incompleto~~ **RISOLTO 15/09/2026:** il record è ora
   `v=spf1 include:_spf.google.com ip4:86.107.36.176 ~all` — include Google (la posta vera),
   mantiene il server Serverplan, toglie le autorizzazioni inutili (`+a`/`+mx`). Resend resta
   coperto dal suo SPF dedicato su `send.cameraconvista.it`. Verificato su ns1 e ns2.
2. ~~Pagine inesistenti rispondono 200 invece di 404~~ **RISOLTO NEL CODICE 15/09/2026** (in
   attesa di push): i percorsi sconosciuti ora rispondono 404 (mostrando comunque la pagina
   "non trovato" del sito). Elenco pagine valide in `isKnownPath()` (`server/seo.ts`), applicato in
   produzione (`server/static.ts`) e sviluppo (`server/vite.ts`). Verificato in locale su build di
   produzione: pagine vere 200, inventate 404, redirect legacy e sitemap/robots intatti.
3. ~~Mittente email ancora `onboarding@resend.dev`~~ **RISOLTO 15/09/2026:** aggiunta
   `RESEND_SENDER_DOMAIN=cameraconvista.it` alle env di Render, deploy completato e sito
   verificato. Le prossime email di richiesta evento partono da `noreply@cameraconvista.it`.

### BASSO

4. ~~DMARC con report verso Brevo~~ **RISOLTO 15/09/2026:** DMARC ora è `v=DMARC1; p=none;` senza
   riferimenti a Brevo. Politica invariata, solo tolto l'indirizzo di report abbandonato.
5. ~~Casella email legacy su cPanel~~ **RISOLTO 15/09/2026** (conferma owner): casella
   `reservations@` eliminata (pesava solo 79 KB — il vecchio dato "81k" era un'altra metrica) e
   rimossi 22 record DNS legati alla posta cPanel (`mail`, `webmail`, `webdisk`, `autodiscover`,
   `autoconfig`, `cpcalendars`, `cpcontacts`, `_caldav*`, `_carddav*`, `_autodiscover._tcp`).
   Zona DNS ora minimale; MX Google, sito e Resend verificati intatti.
6. ~~Branch `replit-agent`~~ **RISOLTO 15/09/2026** (conferma owner): eliminato; la sua storia
   resta recuperabile dal bundle `BACKUP/pre-push-404fix-20260916.bundle`.
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

### Residui Replit — analisi del 15/09/2026 (PROPOSTA, nulla eliminato)

Il progetto è quasi pulito: niente file `.replit`/`replit.nix`, niente dipendenze `@replit/*`,
niente riferimenti nel codice. Restano:

| Residuo | Cosa è | Proposta |
|---|---|---|
| ref git `refs/replit/agent-ledger` | segnaposto interno di Replit che tiene in vita la storia del vecchio branch (già nel bundle di BACKUP) | eliminabile in sicurezza |
| `coverage/` (444K) + `test-results/` (4K) | output di test rigenerabili con un comando, già in `.gitignore` | eliminabili in sicurezza |
| `LOGOS/` (848K) | file grafici dei loghi, non usati dal codice | ⚠ decisione owner: potrebbero essere gli originali — tenere o spostare in BACKUP |
| `dist/` (4,9M) | output di build normale, rigenerato a ogni build | NON eliminare (non è un residuo) |

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
- ✅ Soft-404 risolto e in produzione dal 15/09/2026 (problema n. 2)
- 📊 Dati (12 mesi, da DNA/07): ~5.700 clic, ~110k impressioni, posizione media 5,6. Brand
  dominante (pos. ~1, CTR 23-36%). Mobile domina (75% dei clic).
- 🆕 Creata la **proprietà Dominio** su Search Console (copre tutto): al 15/09 il backfill non è
  ancora arrivato (query vuote) — ricontrollare tra 1-2 giorni via service account.

**Query con margine (la base dello step 4, da monitorare in GSC tra 2-4 settimane):**

| Query | Impressioni | Posizione | CTR oggi | Pagina che deve intercettarla |
|---|---|---|---|---|
| aperitivo bologna | 2.843 | 4,3 | 0,49% | home ("Aperitivo a Bologna in Centro con Vista") |
| cocktail bar bologna | 1.232 | 7,6 | 0,97% | /cocktail-bar ("Cocktail Bar in Centro a Bologna") |
| aperitivo bologna centro | 1.084 | 4,6 | 0,65% | home (parola "Centro" ora nel title) |
| rooftop bologna | 511 | 5,5 | 0,20% | home/EN "with a View" (owner 15/09: NON siamo un rooftop — parola esclusa) |
| best restaurants with view | 584 | 12,3 | 0% | home EN ("Aperitivo & Tapas with a View") |
| ricerche locali "santo stefano" | — | — | — | /dove-siamo (title con "Piazza Santo Stefano") |
| ristorante con terrazza bologna | 55 (3,5 mesi) | 1,3 | 0% | home/cocktail-bar — dal 15/09 description con "tavoli all'aperto/dehors" (IT) e "terrace" (EN) |
| aperitivo (in) terrazza bologna | 66 (3,5 mesi) | 1,7-1,9 | ~1% | idem — pos. già top ma la parola non compariva nei testi |

**🆕 Backfill proprietà Dominio ARRIVATO il 15/09 pomeriggio**: le query sopra su "terrazza" vengono dai dati
freschi (giu-set 2026). "dehors" non viene cercato (0 risultati): usato solo come parola descrittiva.

### Camera Colli (/colli e /colli/menu)
**Stato: BUONO, con potenziale.**
- ✅ `/colli` e `/colli/menu` indicizzabili, title/canonical propri, manifest PWA dedicato
- ✅ `/colli/menu` è la **pagina più vista del sito** (2.979 viste/28gg, più della home) e ha il
  miglior CTR da Google (14,8%)
- ⚠ Il menu QR vive sotto il dominio CCV: giusto così finché Colli non ha un dominio proprio
- ✅ JSON-LD LocalBusiness (BarOrPub/Restaurant, Via Cavaioni 1, link al menu) aggiunto a `/colli`
  il 15/09/2026; title/description Colli ora orientati ad "aperitivo sui colli di Bologna"
- ✅ 15/09/2026: `/colli` non più orfana — link nel footer di tutto il sito (era "sconosciuta a
  Google": mai scansionata); description con stagionalità aprile–inizio ottobre. Conversioni GA4
  attive: `richiesta_evento` (server-side, verificato in tempo reale) e `prenota_whatsapp`

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
| 1 | ~~Attivare mittente `noreply@cameraconvista.it`~~ ✅ **FATTO 15/09/2026** (env Render + deploy verificato) | — | Render env |
| 2 | ~~Correggere SPF~~ ✅ **FATTO 15/09/2026** (Google incluso; Resend già coperto su `send.`) | — | DNS via cPanel |
| 3 | ~~Fix soft-404~~ ✅ **FATTO NEL CODICE 15/09/2026** — online al prossimo push | — | `server/static.ts`, `server/seo.ts`, `server/vite.ts` |
| 4 | ~~Titoli/description orientati alle query generiche~~ ✅ **FATTO 15/09/2026**: 8 pagine ottimizzate nel DB (IT+EN), attive subito e verificate sull'HTML live; valori precedenti salvati in `BACKUP/pages-meta-backup-20260916.json` | — | DB via admin SEO |
| 5 | ~~JSON-LD LocalBusiness+Menu per Colli~~ ✅ **FATTO 15/09/2026** + collegata la pagina `/eventi-privati/cena` a meta e sitemap | — | `server/seo.ts` |
| 6 | ~~Pulizia email legacy~~ ✅ **COMPLETATA 15/09/2026**: record Brevo, DMARC, casella `reservations@` e 22 record DNS posta cPanel | — | DNS + cPanel |
| 7 | **Consolidamento DNA**: creare `DNA/00` indice | Nullo | `DNA/` |
| 8 | **Migrare le immagini Unsplash di default su Supabase** con lo script esistente | Basso | `scripts/migrate-all-images-to-supabase.ts` |
| 9 | ~~Branch `replit-agent`~~ ✅ **ELIMINATO 15/09/2026** (storia nel bundle in `BACKUP/`) | — | git |
| 10 | **Salvare le richieste evento su Supabase** (proposta owner 15/09): oggi esistono SOLO come email — se un'email va persa, la richiesta è persa. Nuova tabella + elenco in area admin | Basso (additivo) | `server/routes/event-request.ts`, nuova migrazione, admin |

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
