# Security Audit Report — Camera con Vista

**Data**: 13 Febbraio 2026  
**Stack**: Express 4 + React SPA + Supabase (PostgreSQL) + Replit Object Storage  
**Tipo**: Analisi statica + verifica runtime (no penetration test)

---

## 1. Superficie d'Attacco

| Superficie | Endpoint/Area | Esposizione |
|---|---|---|
| API pubblica | `/api/pages`, `/api/events`, `/api/galleries`, `/api/media`, `/api/menu-items`, `/api/wines`, `/api/cocktails`, `/api/footer-settings` | Read-only, nessuna autenticazione richiesta |
| API admin | `/api/admin/*` (pages, events, galleries, media, uploads, settings, sync) | Protetta da `requireAuth` (cookie session) |
| Auth endpoint | `/api/admin/login`, `/api/admin/logout`, `/api/admin/check-session` | Aperto (login), protetto (change-password) |
| Upload file | `/api/uploads/request-url` (Object Storage presigned URL) | **NESSUNA autenticazione** |
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

**Risultato**: Nessuna chiave sensibile (service_role, DATABASE_URL, OPENAI_API_KEY) esposta nel codice client. La `anon key` Supabase nel client è un pattern previsto.

### 2.2 Supabase Security

**RLS (Row Level Security)**: Non verificabile direttamente (Supabase non espone `pg_tables` via API client). Tuttavia, dato che:

- Il server usa `SUPABASE_SERVICE_ROLE_KEY` che bypassa RLS per tutte le operazioni
- Il client browser ha accesso a `SUPABASE_ANON_KEY` 

**Rischio**: Se le tabelle **non** hanno RLS abilitato, qualsiasi utente con l'anon key nel browser potrebbe leggere/scrivere direttamente sulle tabelle Supabase, bypassando il server Express.

**Raccomandazione**: Verificare nel dashboard Supabase → Authentication → Policies che RLS sia abilitato su TUTTE le tabelle e che le policy siano restrittive per il ruolo `anon`.

**File critici**:
- `server/supabase-storage.ts:3-5` — inizializzazione client con service_role
- `client/src/lib/supabase.ts:3-4` — client browser con anon key

### 2.3 Express/API Hardening

#### CORS
**Stato**: **NESSUNA configurazione CORS trovata**  
Non è presente `cors` middleware né header `Access-Control-Allow-Origin` personalizzati.  
Su Replit, il reverse proxy gestisce CORS di base, ma non ci sono restrizioni esplicite sulle origini ammesse.

**File**: `server/index.ts` — nessun import/uso di `cors`

#### Rate Limiting
**Stato**: **NESSUN rate limiting implementato**  
Non è presente `express-rate-limit` o equivalente su nessun endpoint.

**Rischio critico**: L'endpoint `/api/admin/login` è vulnerabile a brute force. La password di default è `"1909"` (4 cifre — `server/routes/helpers.ts:7`). Un attaccante può provare tutte le 10.000 combinazioni in pochi secondi.

**File**: `server/routes/helpers.ts:7` — `DEFAULT_PASSWORD = "1909"`

#### Security Headers
**Stato**: **NESSUN security header implementato**

Non presenti:
- `helmet` middleware
- `Content-Security-Policy`
- `X-Frame-Options` / `frame-ancestors`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

**File**: `server/index.ts` — nessun header di sicurezza configurato

#### Input Validation
**Stato**: **BUONO con eccezioni**

La maggior parte delle rotte admin usa `zod` + `drizzle-zod` con `.safeParse()`:
- Eventi: `server/routes/events.ts:75,94`
- Gallery: `server/routes/gallery.ts:82,97,153,168`
- Menu/Wines/Cocktails: `server/routes/menu.ts:74,89,133,148,192,207`
- Media: `server/routes/media.ts:81,97,319,335`
- Pages: `server/routes/pages.ts:126,141,228,245`

**Eccezioni senza validazione schema**:
- `/api/admin/login` — `req.body.password` usato direttamente (`server/routes/auth.ts:17`)
- `/api/admin/change-password` — validazione minima solo su lunghezza (`server/routes/auth.ts:58,66`)
- `/api/uploads/request-url` — validazione minima solo su `name` (`object_storage/routes.ts:41-45`)
- `/api/admin/sync/sheets-config` — `req.body` usato direttamente (`server/routes/sync.ts:123`)
- Gallery reorder — `req.body.imageIds` senza schema (`server/routes/gallery.ts:202`)
- Media rotate/bulk-delete — body tipizzato inline senza schema (`server/routes/media.ts:117,178`)

#### Auth Protection
**Stato**: **BUONO** — tutti gli endpoint admin usano `requireAuth` middleware

Autenticazione implementata con:
- Cookie `httpOnly`, `secure` in produzione, `sameSite: lax` (`server/routes/auth.ts:25-30`)
- Session token 32 bytes crypto random (`server/routes/helpers.ts:11-13`)
- Session con scadenza 24h (`server/routes/helpers.ts:9`)
- Password hash con bcrypt (`server/routes/helpers.ts:30`)

**Problemi**:
- Password di default `"1909"` — solo 4 cifre (`server/routes/helpers.ts:7`)
- Minimum password length: 4 caratteri (`server/routes/auth.ts:66`)
- Nessuna protezione CSRF (`sameSite: lax` mitiga parzialmente)
- Nessun brute force protection sul login

### 2.3 Object Storage / Upload

**Rischio ALTO**: L'endpoint `/api/uploads/request-url` (`server/replit_integrations/object_storage/routes.ts:38`) **NON ha autenticazione**. Chiunque può richiedere URL presigned per caricare file.

L'endpoint `/api/admin/uploads/direct` (`server/routes/media.ts:210`) è invece correttamente protetto da `requireAuth`.

Il file serving `/objects/*` è aperto e serve qualsiasi file dallo storage.

### 2.5 Dependency Audit

```
npm audit risultato:
  Total: 1 vulnerabilità
  - qs (low severity): arrayLimit bypass in comma parsing → DoS
```

**Nessuna vulnerabilità critica o alta** nelle dipendenze.

---

## 3. Top 10 Rischi (impatto × probabilità)

| # | Rischio | Impatto | Probabilità | Priorità | File/Riga |
|---|---|---|---|---|---|
| 1 | **Brute force login** — protetto con rate limiting (5 tentativi / 15 min) | CRITICO | BASSA (mitigato) | **P0 (FIXED)** | `server/routes/auth.ts:20` |
| 2 | **Upload endpoint non autenticato** — protetto con requireAuth | ALTO | BASSA (mitigato) | **P0 (FIXED)** | `server/replit_integrations/object_storage/routes.ts:42` |
| 3 | **Nessun security header** — vulnerabile a clickjacking, MIME sniffing, XSS | ALTO | MEDIA | **P0** | `server/index.ts` |
| 4 | **RLS Supabase non verificata** — il client browser ha anon key e potrebbe accedere direttamente alle tabelle | CRITICO | MEDIA | **P0** | `client/src/lib/supabase.ts:3-4` |
| 5 | **Nessun rate limiting** su API — DoS possibile su tutti gli endpoint | MEDIO | MEDIA | **P1** | `server/index.ts` |
| 6 | **Nessun CORS esplicito** — rischio cross-origin request da domini terzi | MEDIO | BASSA | **P1** | `server/index.ts` |
| 7 | **Nessuna protezione CSRF** — `sameSite: lax` mitiga solo parzialmente | MEDIO | BASSA | **P1** | `server/routes/auth.ts:28` |
| 8 | **Input validation mancante** su alcuni endpoint (login, sync config, gallery reorder, media rotate) | MEDIO | BASSA | **P2** | `server/routes/auth.ts:17`, `server/routes/sync.ts:123` |
| 9 | **Password policy debole** — minimo 4 caratteri, nessun requisito di complessità | BASSO | MEDIA | **P2** | `server/routes/auth.ts:66` |
| 10 | **Dipendenza `qs` con vulnerabilità low** — DoS via query string parsing | BASSO | BASSA | **P2** | `package.json` (dipendenza transitiva) |

---

## 4. Checklist Hardening Consigliata

### P0 — Critico (Implementato)

- [x] **Rate limiting al login**: Implementato `express-rate-limit` su `/api/admin/login`. Limite: 5 tentativi ogni 15 minuti.
- [x] **Protezione upload endpoint**: Aggiunto `requireAuth` a `/api/uploads/request-url`.
- [ ] **Installare `helmet`**: aggiungere `helmet()` middleware in `server/index.ts` per impostare automaticamente CSP, X-Frame-Options, HSTS, X-Content-Type-Options

---

## 5. Verifica Hardening

### Brute Force Login
Per verificare il blocco:
1. Prova a loggarti con una password errata per 6 volte consecutive.
2. Al 6° tentativo, il server risponderà con `429 Too Many Requests` e il messaggio JSON: `{"success":false,"error":"Troppi tentativi di login. Riprova tra 15 minuti."}`.

### Upload Protection
Per verificare:
1. Esegui una POST a `/api/uploads/request-url` senza cookie di sessione.
2. Il server deve rispondere con `401 Unauthorized`.

---

## 6. Dettaglio Prove / Percorsi nel Codice

### Password default hardcoded
```
server/routes/helpers.ts:7  → export const DEFAULT_PASSWORD = "1909";
server/routes/helpers.ts:20 → const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
```

---

*Fine report.*
