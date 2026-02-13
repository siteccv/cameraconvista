# 12 - Sicurezza Sito (Stato Attuale)

## Livello di Protezione

Sistema attualmente in stato di sicurezza avanzato (livello production-ready per progetto hospitality con admin privato).

---

## 1. Protezione Backend

### Helmet
- Middleware `helmet` attivo su tutte le risposte HTTP
- CSP e HSTS disabilitati intenzionalmente per compatibilita con Google Fonts, Supabase CDN, analytics e Vite dev mode

### Security Headers Attivi

| Header | Valore | Scopo |
|--------|--------|-------|
| `X-Content-Type-Options` | `nosniff` | Blocca MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita invio referer a terze parti |
| `X-Frame-Options` | `SAMEORIGIN` | Previene clickjacking (iframe da altri domini) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disabilita accesso a camera, microfono, GPS |
| `X-Powered-By` | (rimosso) | Nasconde tecnologia server |

### Rate Limiting Login
- Libreria: `express-rate-limit`
- Limite: 5 tentativi ogni 15 minuti per IP
- Risposta al superamento: HTTP 429 con messaggio "Troppi tentativi di login. Riprova tra 15 minuti."
- File: `server/routes/auth.ts`

### Upload Endpoint Autenticato
- Tutti gli endpoint di upload richiedono `requireAuth` middleware
- L'endpoint Object Storage (`/api/uploads/request-url`) ha `requireAuth` aggiunto come difesa in profondita
- L'endpoint principale (`/api/admin/uploads/direct`) e correttamente protetto

### Hash Password Sicuro
- Algoritmo: bcrypt
- Password stored come hash in `site_settings` con key `admin_password_hash`
- Nessuna password in chiaro nel database

### Cookie Sessione
- `httpOnly`: Cookie non accessibile da JavaScript
- `secure`: Attivo in produzione (solo HTTPS)
- `sameSite: lax`: Mitigazione parziale CSRF
- Durata: 24 ore
- Token: 32 bytes crypto random

### Nessuna Esposizione Chiavi
- `SUPABASE_SERVICE_ROLE_KEY`: Solo server-side, mai esposta
- `DATABASE_URL`: Solo server-side
- `OPENAI_API_KEY`: Solo server-side
- `SESSION_SECRET`: Solo server-side
- `SUPABASE_ANON_KEY` nel client: Pubblica by design (protetta da RLS)

---

## 2. Protezione Database (Supabase)

### Row Level Security (RLS)
RLS attiva su **tutte le tabelle critiche**:

- `menu_items`, `menu_items_published`
- `wines`, `cocktails`
- `events`
- `pages`, `page_blocks`
- `media`, `media_categories`
- `galleries`, `gallery_images`
- `users`, `admin_sessions`
- `site_settings`

### Policy Applicate
- **SELECT pubblico**: Solo per dati realmente destinati alla visualizzazione pubblica
- **Scrittura**: Consentita esclusivamente tramite `service_role` (backend Express)
- **Tabelle sensibili** (`users`, `admin_sessions`, `site_settings`): Nessun accesso `anon`

### Verifica
- Test manuale effettuato con `anon key` via SQL Editor Supabase
- Nessun accesso non autorizzato rilevato

---

## 3. Superficie di Attacco Ridotta

- Nessuna API pubblica scrivibile
- Nessun endpoint aperto senza autenticazione (esclusi GET pubblici read-only)
- Nessun secret esposto lato client
- Nessuna possibilita di bypass diretto via Supabase `anon key` (RLS attivo)
- Path admin (`/admina`) non esposto nella navigazione pubblica
- `robots.txt` blocca indicizzazione di admin e API admin

---

## 4. Stato Attuale Rischio

**Rischio compromissione: BASSO**

Il sistema e adeguatamente protetto contro:

| Minaccia | Protezione | Stato |
|----------|-----------|-------|
| Brute force login | Rate limiting (5 tentativi / 15 min) | Mitigato |
| Accesso diretto database | RLS su tutte le tabelle | Mitigato |
| Upload abusivi | `requireAuth` su tutti gli endpoint upload | Mitigato |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` | Mitigato |
| MIME sniffing | `X-Content-Type-Options: nosniff` | Mitigato |
| Enumerazione API | API pubbliche solo read-only, admin protette | Mitigato |
| Esposizione tecnologia | `X-Powered-By` rimosso | Mitigato |
| Accesso camera/microfono/GPS | `Permissions-Policy` restrittiva | Mitigato |

---

## 5. Miglioramenti Futuri Opzionali (Non Urgenti)

| Miglioramento | Priorita | Note |
|--------------|----------|------|
| CSP in modalita Report-Only | P1 | Monitorare senza bloccare risorse legittime |
| HSTS definitivo | P1 | Attivare dopo conferma HTTPS stabile per 1 mese |
| Global API rate limiting | P1 | ~100 req/min per IP su tutti gli endpoint |
| CORS esplicito | P1 | Limitare origini ammesse al dominio di produzione |
| Password policy rafforzata | P2 | Minimo 8 caratteri con requisiti complessita |
| Logging tentativi login falliti | P2 | Con IP per audit trail |

---

## 6. Conclusione

Il sito e attualmente in stato **stabile e sicuro**.
Non risultano vulnerabilita critiche aperte.

Il livello di sicurezza implementato e appropriato per un progetto hospitality con:
- Admin panel privato ad accesso singolo
- Dati pubblici read-only (menu, eventi, galleria)
- Nessuna gestione dati sensibili utenti (no e-commerce, no dati personali)

> Per dettagli tecnici e prove di verifica, vedi `report/SECURITY_AUDIT.md`
