# Security Audit Report — Camera con Vista

**Data**: 13 Febbraio 2026  
**Ultimo aggiornamento**: 13 Febbraio 2026  
**Stack**: Express 4 + React SPA + Supabase (PostgreSQL) + Replit Object Storage  
**Tipo**: Analisi statica + verifica runtime (no penetration test)

---

## 1. Superficie d'Attacco

| Superficie | Endpoint/Area | Esposizione |
|---|---|---|
| API pubblica | `/api/pages`, `/api/events`, `/api/galleries`, `/api/media`, `/api/menu-items`, `/api/wines`, `/api/cocktails`, `/api/footer-settings` | Read-only, nessuna autenticazione richiesta |
| API admin | `/api/admin/*` (pages, events, galleries, media, uploads, settings, sync) | Protetta da `requireAuth` (cookie session) |
| Auth endpoint | `/api/admin/login`, `/api/admin/logout`, `/api/admin/check-session` | Aperto (login con rate limit), protetto (change-password) |
| Upload file | `/api/uploads/request-url` (Object Storage presigned URL) | Protetto con `requireAuth` (route non montata in produzione) |
| Upload file | `/api/admin/uploads/direct` (Multer → Supabase) | Protetto da `requireAuth` |
| File serving | `/objects/*` (Object Storage) | Aperto, serve file dallo storage |
| SPA | Tutte le route non-API | Servite come index.html con SEO injection |
| Client Supabase | Inizializzato con `anon key` nel browser | Accesso diretto a Supabase da browser |

---

## 2. Analisi Dettagliata

### 2.1 Secrets & Environment Variables

**Stato .env**: Non versionato (non presente in `git ls-files`). OK.

**Variabili server-side** (file `server/`):

| Variabile | File | Rischio |
|---|---|---|
| `SUPABASE_URL` | `supabase-storage.ts:3`, `storage.ts:523` | Basso (URL pubblico) |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase-storage.ts:4`, `storage.ts:523` | **CRITICO se esposto** — bypassa RLS |
| `SUPABASE_ANON_KEY` | `supabase-storage.ts:5` | Basso (chiave pubblica by design) |
| `DATABASE_URL` | `storage.ts:524`, `db.ts:7,13` | Alto se esposto |
| `SESSION_SECRET` | Secret configurato | Medio (usato per cookie) |
| `OPENAI_API_KEY` / `AI_INTEGRATIONS_*` | `openai.ts:6,7,10,11` | Alto se esposto (costi) |
| `PUBLIC_OBJECT_SEARCH_PATHS` | `objectStorage.ts:47` | Basso |
| `PRIVATE_OBJECT_DIR` | `objectStorage.ts:67` | Basso |

**Variabili client-side** (file `client/`):

| Variabile | File | Rischio |
|---|---|---|
| `VITE_SUPABASE_URL` | `client/src/lib/supabase.ts:3` | Basso (URL pubblico) |
| `VITE_SUPABASE_ANON_KEY` | `client/src/lib/supabase.ts:4` | Basso (anon key, by design pubblica) |
| `VITE_GA_MEASUREMENT_ID` | analytics | Nessuno |
| `VITE_FB_PIXEL_ID` | analytics | Nessuno |

**Risultato**: Nessuna chiave sensibile (service_role, DATABASE_URL, OPENAI_API_KEY) esposta nel codice client.

### 2.2 Supabase Security

**RLS (Row Level Security)**: Non verificabile direttamente. Il server usa `SUPABASE_SERVICE_ROLE_KEY` che bypassa RLS. Il client browser ha `SUPABASE_ANON_KEY`.

**Raccomandazione**: Verificare nel dashboard Supabase che RLS sia abilitato su tutte le tabelle.

### 2.3 Express/API Hardening

#### Rate Limiting
**Stato**: **IMPLEMENTATO** su `/api/admin/login`  
Libreria: `express-rate-limit` — 5 tentativi ogni 15 minuti.  
**File**: `server/routes/auth.ts:16-22`

#### Security Headers
**Stato**: **IMPLEMENTATO** con `helmet` + middleware custom  
**File**: `server/index.ts:18-34`

Header attivi su TUTTE le risposte (API e HTML):

| Header | Valore | Scopo |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Blocca MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita invio del referer a terze parti |
| `X-Frame-Options` | `SAMEORIGIN` | Previene clickjacking (iframe da altri domini) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disabilita accesso a camera, microfono, GPS |
| `X-Powered-By` | (rimosso da helmet) | Nasconde tecnologia server |

Header **disabilitati intenzionalmente** (scelta conservativa):

| Header | Motivo |
|---|---|
| `Content-Security-Policy` | Disabilitata per compatibilità con Google Fonts, Supabase CDN, inline scripts di Vite, analytics (GA/FB pixel). Rischio di bloccare risorse legittime. Valutare attivazione in modalità Report-Only come passo successivo. |
| `Strict-Transport-Security` (HSTS) | Disabilitata per precauzione. HSTS è irreversibile: se attivato e qualcosa va storto con HTTPS, il sito diventa inaccessibile. Attivare solo dopo conferma che www.cameraconvista.it gira stabilmente su HTTPS da almeno 1 mese. |
| `Cross-Origin-Embedder-Policy` | Disabilitata per compatibilità con risorse cross-origin (Supabase storage, Google Fonts) |
| `Cross-Origin-Opener-Policy` | Disabilitata per compatibilità con popup OAuth se necessari in futuro |
| `Cross-Origin-Resource-Policy` | Disabilitata per permettere caricamento immagini da Supabase CDN |

#### Auth Protection
**Stato**: **BUONO** — tutti gli endpoint admin usano `requireAuth` middleware.

Autenticazione: cookie `httpOnly`, `secure` in produzione, `sameSite: lax`, session token 32 bytes, bcrypt hash, scadenza 24h.

#### Input Validation
**Stato**: **BUONO con eccezioni** — la maggior parte delle rotte usa `zod` con `.safeParse()`.

### 2.4 Object Storage / Upload

L'endpoint `/api/uploads/request-url` ha `requireAuth` ma la route non è montata (la funzione `registerObjectStorageRoutes()` non è mai chiamata). L'endpoint effettivo è `/api/admin/uploads/direct`, correttamente protetto.

### 2.5 Dependency Audit

```
npm audit: 1 vulnerabilità low (qs - DoS via comma parsing)
```

---

## 3. Top 10 Rischi (impatto × probabilità)

| # | Rischio | Impatto | Probabilità | Priorità | File/Riga |
|---|---|---|---|---|---|
| 1 | **Brute force login** — protetto con rate limiting (5 tentativi / 15 min) | CRITICO | BASSA (mitigato) | **P0 FIXED** | `server/routes/auth.ts:16` |
| 2 | **Upload endpoint** — requireAuth aggiunto, route non montata | ALTO | NULLA | **P0 FIXED** | `object_storage/routes.ts:42` |
| 3 | **Security headers** — helmet configurato con set conservativo | ALTO | BASSA (mitigato) | **P0 FIXED** | `server/index.ts:18-34` |
| 4 | **RLS Supabase non verificata** — il client browser ha anon key | CRITICO | MEDIA | **P0** | `client/src/lib/supabase.ts:3-4` |
| 5 | **Nessun rate limiting globale** su API — DoS possibile | MEDIO | MEDIA | **P1** | `server/index.ts` |
| 6 | **Nessun CORS esplicito** — rischio cross-origin request | MEDIO | BASSA | **P1** | `server/index.ts` |
| 7 | **Nessuna protezione CSRF** — `sameSite: lax` mitiga parzialmente | MEDIO | BASSA | **P1** | `server/routes/auth.ts` |
| 8 | **Input validation mancante** su alcuni endpoint | MEDIO | BASSA | **P2** | vari |
| 9 | **Password policy debole** — minimo 4 caratteri | BASSO | MEDIA | **P2** | `server/routes/auth.ts:66` |
| 10 | **Dipendenza `qs` con vulnerabilità low** | BASSO | BASSA | **P2** | `package.json` |

---

## 4. Checklist Hardening

### P0 — Critico (Implementato)

- [x] **Rate limiting al login**: `express-rate-limit`, 5 tentativi / 15 min
- [x] **Upload endpoint protetto**: `requireAuth` su `/api/uploads/request-url`
- [x] **Security headers**: `helmet` + Permissions-Policy custom
- [ ] **Verificare RLS Supabase**: dashboard Supabase → Policies su tutte le tabelle

### P1 — Importante (da pianificare)

- [ ] Rate limiting globale API (~100 req/min per IP)
- [ ] CORS esplicito (solo dominio produzione + localhost)
- [ ] CSP in modalità Report-Only (per monitorare senza bloccare)
- [ ] HSTS (dopo conferma HTTPS stabile per 1 mese)

### P2 — Miglioramenti (backlog)

- [ ] Rafforzare password policy (min 8 caratteri)
- [ ] Validazione schema su endpoint mancanti
- [ ] Aggiornare dipendenza `qs`
- [ ] Logging tentativi login falliti con IP

---

## 5. Verifica Hardening — Come Controllare

### A. Verificare Security Headers (senza conoscere il codice)

**Da browser (Chrome/Edge/Firefox)**:
1. Apri il sito (es. `www.cameraconvista.it` o il link di anteprima Replit)
2. Premi **F12** per aprire gli Strumenti Sviluppatore
3. Vai alla scheda **"Network"** (Rete)
4. Ricarica la pagina (F5)
5. Clicca sulla prima richiesta nella lista (il documento HTML principale)
6. Nella colonna di destra, clicca su **"Headers"** (Intestazioni)
7. Scorri fino a **"Response Headers"** (Intestazioni di Risposta)
8. Dovresti vedere:
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Frame-Options: SAMEORIGIN`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - **Non** dovresti vedere `X-Powered-By: Express`

### B. Verificare SEO (senza conoscere il codice)

**Da browser**:
1. Apri una qualsiasi pagina del sito (es. `/menu`, `/eventi`, `/galleria`)
2. Clicca col tasto destro sulla pagina → **"Visualizza sorgente pagina"** (oppure premi **Ctrl+U**)
3. Cerca nella parte `<head>` del sorgente:
   - Un solo tag `<title>` (non duplicato)
   - Un tag `<meta name="description" ...>`
   - Un tag `<link rel="canonical" ...>`
   - Tag `hreflang` per italiano e inglese
   - Almeno un blocco `<script type="application/ld+json">` (dati strutturati)
4. Se vedi **due** tag `<title>`, qualcosa non va — segnalalo.

### C. Verificare Rate Limiting Login

1. Vai alla pagina di login admin (`/admina`)
2. Inserisci una password errata e premi "Entra" per **6 volte di fila**
3. Al 6° tentativo dovresti vedere il messaggio: *"Troppi tentativi di login. Riprova tra 15 minuti."*
4. Dopo 15 minuti, il login torna a funzionare normalmente.

---

## 6. Header Effettivi — Prove di Produzione

### Risposta HTTP per `/` (homepage) — Production Build

```
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Risposta HTTP per `/menu` — Production Build

```
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### SEO Verification — Production Build (tutte le pagine, 1 title ciascuna)

```
/              → Camera con Vista – Ristorante e Cocktail Bar a Bologna
/menu          → Menu – Camera con Vista | Ristorante a Bologna
/lista-vini    → Carta dei Vini – Camera con Vista | Bologna
/cocktail-bar  → Cocktail Bar a Bologna – Camera con Vista
/eventi        → Eventi a Bologna – Camera con Vista
/galleria      → Galleria – Camera con Vista | Bologna
/dove-siamo    → Dove Siamo – Camera con Vista | Bologna
```

Nessun duplicato `<title>` su nessuna pagina.

---

*Fine report.*
