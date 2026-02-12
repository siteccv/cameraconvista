# DIAGNOSI KEEP-ALIVE: Render + Supabase (Piano Free)

**Data:** 12 Febbraio 2026  
**Progetto:** Camera con Vista Bistrot  
**Deployment:** Render (Web Service free) + Supabase (database free)  
**Stato:** Solo analisi diagnostica — nessuna modifica implementata

---

## 1. STATO ATTUALE DELLO STACK

| Componente | Dettaglio |
|---|---|
| **Backend** | Express (Node.js), server HTTP singolo su porta `PORT` (default 5000) |
| **Avvio** | `server/index.ts` → `createServer(app)` → `httpServer.listen()` |
| **Database produzione** | Supabase (client JS `@supabase/supabase-js`) via `supabaseAdmin` con service role key |
| **Connessione DB** | Due client: `supabaseAdmin` (service role, bypass RLS) e `supabasePublic` (anon key) |
| **Storage logic** | Se `SUPABASE_URL` presente → `SupabaseStorage` class, altrimenti Drizzle/PostgreSQL locale |
| **Timer/Cron interni** | Nessuno presente nel progetto |
| **Middleware** | cookie-parser, JSON body parser, SEO injection, canonical redirect |
| **UptimeRobot** | Configurato esternamente per ping HTTP |

### Dettaglio connessione Supabase

```
server/supabase.ts:
├── supabaseAdmin  = createClient(url, serviceRoleKey)   → bypass RLS
└── supabasePublic = createClient(url, anonKey)          → rispetta RLS

server/storage.ts:
├── HAS_SUPABASE = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
├── Se true  → SupabaseStorage (REST API via supabase-js)
└── Se false → DatabaseStorage (Drizzle ORM / pg Pool diretto)
```

**Punto chiave:** In produzione (Render), il progetto comunica con Supabase esclusivamente via **REST API** (PostgREST), NON via connessione PostgreSQL diretta.

---

## 2. COMPORTAMENTO SLEEP/STANDBY

### Render (Piano Free)
- Il container va in **sleep dopo ~15 minuti** di inattività (nessuna richiesta HTTP in ingresso)
- Al risveglio: **cold start 30-60 secondi** (avvio Node.js, connessione DB, build cache)
- Durante lo sleep: nessun processo attivo, `setInterval` non viene eseguito
- Il risveglio avviene SOLO su richiesta HTTP in ingresso

### Supabase (Piano Free)
- Il database PostgreSQL va in **standby dopo 7 giorni** senza connessioni attive
- "Connessioni attive" = connessioni PostgreSQL dirette (pooler/connection string)
- Le query via REST API (`supabase.from().select()`) **NON contano** come connessioni dirette
- Al risveglio: 30-60 secondi per riattivare il database
- Supabase mostra un avviso nella dashboard prima della pausa

---

## 3. ANALISI DELLE IPOTESI

### A) Timer interno (`setInterval`) nel server Express

| Aspetto | Valutazione |
|---|---|
| **Fattibilità tecnica** | Semplice: `setInterval(() => query(), 10*60*1000)` in `server/index.ts` |
| **Affidabilità** | **NON AFFIDABILE** — Render free mette in sleep il container dopo ~15 min. Quando il processo dorme, `setInterval` non viene eseguito. Il timer riparte solo dopo un cold start (richiesta HTTP esterna) |
| **Cold start** | Dopo sleep, Render impiega 30-60s per riavviare. Nessun timer attivo durante questo periodo |
| **Verdetto** | **Sconsigliato come soluzione unica**. Utile solo come complemento se il server è già sveglio |

### B) Endpoint `/api/health` (o `/db-ping`)

| Aspetto | Valutazione |
|---|---|
| **Fattibilità** | Molto semplice: un GET che esegue `SELECT 1` su Supabase e risponde 200 |
| **Sicurezza** | Nessun rischio se l'endpoint non espone dati. Un `SELECT 1` o `SELECT NOW()` non rivela niente. Non serve autenticazione |
| **Efficacia per Render** | Funziona SE chiamato da un servizio esterno (UptimeRobot, cron). Ogni richiesta HTTP tiene sveglio Render |
| **Efficacia per Supabase** | Una query via REST API (`supabase.from().select()`) **potrebbe non bastare** per prevenire lo standby — Supabase conta le connessioni PostgreSQL dirette |
| **Verdetto** | **Parzialmente fattibile** — Buono per Render, potenzialmente insufficiente per Supabase |

### C) Query periodica con modifica DB (UPDATE/INSERT)

| Aspetto | Valutazione |
|---|---|
| **Fattibilità** | Es. `UPDATE site_settings SET value = NOW() WHERE key = 'last_keep_alive'` |
| **Consumo risorse** | Trascurabile: una singola UPDATE ogni 10-14 min, pochi byte |
| **RLS/Permessi** | Il progetto usa `supabaseAdmin` (service role key) → bypass RLS. Nessun problema di permessi |
| **Write amplification** | Minima. Piano free ha limiti generosi per singole query |
| **Log bloat** | Potenziale accumulo nei log Supabase, ma gestibile |
| **Problema principale** | Come punto A: se il timer è interno a Express e Render dorme, non gira |
| **Verdetto** | **Tecnicamente corretto ma dipende da chi triggera l'esecuzione** |

### D) Servizi esterni (cron/scheduler)

| Opzione | Costo | Pro | Contro |
|---|---|---|---|
| **UptimeRobot** (attuale) | Gratis | Già configurato, ping HTTP ogni 5 min | Non esegue query DB, solo HTTP. Tiene sveglio Render ma non Supabase |
| **cron-job.org** | Gratis | Affidabile, configurabile ogni 5-14 min | Servizio terzo, va monitorato |
| **GitHub Actions** (scheduled) | Gratis (2000 min/mese) | Cron YAML, può fare `curl` all'endpoint | Ritardo fino a 15 min sulla schedule, non preciso al minuto |
| **Render Cron Job** | A pagamento | Nativo Render, affidabile | **Non disponibile su piano free** |

---

## 4. PUNTO CRITICO: SUPABASE E CONNESSIONI DIRETTE

Questo è il nodo cruciale dell'analisi.

### Il problema

Supabase free tier **pausa il database PostgreSQL** dopo 7 giorni senza attività. Ma "attività" per Supabase significa **connessioni PostgreSQL dirette** (via connection string `postgresql://...`), **NON** query via REST API del client JavaScript.

### Situazione attuale del progetto

Il progetto su Render usa `@supabase/supabase-js` che comunica via **REST API** (PostgREST). Questo significa che anche chiamando `supabase.from('site_settings').select('*')` ogni 5 minuti, **Supabase potrebbe comunque andare in standby** perché non ci sono connessioni dirette al database.

### Soluzione tecnica

Aggiungere una connessione PostgreSQL diretta usando il modulo `pg` (già presente come dipendenza del progetto — usato per Drizzle locale) con la **connection string di Supabase** (disponibile nella dashboard: Settings → Database → Connection string).

```
Esempio concettuale (NON implementato):

const keepAlivePool = new pg.Pool({
  connectionString: process.env.SUPABASE_DIRECT_URL,
  max: 1,
  idleTimeoutMillis: 30000
});

// Nell'endpoint /api/health:
await keepAlivePool.query('SELECT 1');
```

Questo genererebbe una connessione PostgreSQL diretta che Supabase riconosce come attività reale.

---

## 5. ANALISI DEI RISCHI

| Rischio | Livello | Dettaglio |
|---|---|---|
| **Sicurezza endpoint** | Basso | Un `/api/health` con `SELECT 1` non espone dati. Opzionalmente protetto con token segreto nell'header |
| **Consumo risorse Render** | Trascurabile | Una request HTTP ogni 10-14 min |
| **Consumo risorse Supabase** | Trascurabile | Una query ogni 10-14 min su piano free |
| **Race condition** | Nessuno | Un ping è idempotente, nessuna concorrenza |
| **Impatto performance** | Nessuno | Query sub-millisecondo, non impatta le richieste utente |
| **Log pollution** | Basso | Il middleware di logging attuale logga tutte le API calls. Raccomandato escludere `/api/health` dal logger |
| **Connessione pool `pg`** | Basso | Un pool con `max: 1` consuma 1 connessione delle ~50 disponibili su Supabase free |
| **Cold start** | Medio | Dopo sleep Render, la prima richiesta ha latenza 30-60s (inevitabile su piano free) |

---

## 6. ARCHITETTURA RACCOMANDATA

### Soluzione: Ibrida (endpoint + cron esterno + pool pg diretto)

```
[cron-job.org o UptimeRobot]
        │
        │ GET /api/health  ogni 10-14 min
        ▼
[Render Web Service]
        │
        ├─ Risponde 200 + timestamp
        │   → Tiene sveglio Render ✓
        │
        ├─ Query via supabase-js REST API
        │   → supabase.from('site_settings').select().limit(1)
        │   → Tiene attiva la REST API ✓
        │
        └─ SELECT 1 via pg Pool diretto (SUPABASE_DIRECT_URL)
            → Connessione PostgreSQL diretta
            → Previene standby 7 giorni Supabase ✓
```

### Componenti necessari per implementazione

1. **Endpoint `/api/health`** — GET pubblico che esegue:
   - Query Supabase via REST API (client JS)
   - `SELECT 1` via `pg` Pool con connection string diretta Supabase
   - Risponde `{ status: "ok", timestamp: "..." }`

2. **Variabile ambiente** — `SUPABASE_DIRECT_URL` con la connection string PostgreSQL diretta (disponibile in dashboard Supabase → Settings → Database)

3. **Cron esterno** — UptimeRobot (già attivo) o cron-job.org che chiama `GET https://www.cameraconvista.it/api/health` ogni 10-14 minuti

4. **Esclusione dal logger** — Filtrare `/api/health` dal middleware di logging per evitare rumore nei log

### Timer interno complementare (opzionale)

Un `setInterval` interno al server (ogni 10 min) che esegue la stessa query DB. Non è affidabile da solo (muore con lo sleep), ma è utile come **complemento**: se il server è già sveglio per una richiesta utente, il timer mantiene la connessione DB attiva tra un ping esterno e l'altro.

---

## 7. ALTERNATIVE ARCHITETTURALI

| Alternativa | Costo mensile | Affidabilità | Note |
|---|---|---|---|
| **Render Starter** | $7/mese | Alta | Niente sleep, niente cron necessario. Soluzione più pulita |
| **Railway.app** | ~$5/mese (usage-based) | Alta | Always-on, PostgreSQL incluso, no sleep |
| **Fly.io** | Free tier | Media | Machine sempre attive, richiede config Docker |
| **Supabase Pro** | $25/mese | Alta | Niente standby DB. Overkill se l'unico obiettivo è evitare la pausa |
| **Piano free + soluzione ibrida** | $0 | Media-Alta | La soluzione raccomandata sopra |

### Nota sul piano Render Starter ($7/mese)

Per un sito di produzione con dominio proprio (`www.cameraconvista.it`), questa è la soluzione **più professionale**:
- Niente sleep del container
- Niente cold start per i visitatori
- Niente necessità di cron esterni o endpoint di keep-alive
- Migliore esperienza utente (nessun ritardo 30-60s alla prima visita)

---

## 8. VERDETTO FINALE

| Scenario | Verdetto |
|---|---|
| Timer `setInterval` interno (solo) | **Non affidabile** — Render free mette in sleep il processo |
| Endpoint HTTP + UptimeRobot (solo REST API) | **Parzialmente fattibile** — Tiene sveglio Render ma potrebbe non bastare per Supabase |
| Endpoint HTTP + cron esterno + pool `pg` diretto | **FATTIBILE E RACCOMANDATO** — Soluzione completa a costo zero |
| Upgrade Render Starter ($7/mese) | **ALTERNATIVA PREFERIBILE** — Elimina il problema alla radice |

### Raccomandazione

**Per produzione professionale:** Upgrade a Render Starter ($7/mese). Elimina completamente il problema sleep e offre migliore esperienza ai visitatori del sito.

**Per restare su piano free:** Implementare la soluzione ibrida (endpoint `/api/health` + pool `pg` diretto + cron esterno). È fattibile, sicura, e implementabile nel progetto attuale senza rischi architetturali.

---

*Report generato il 12 Febbraio 2026 — Solo analisi diagnostica, nessuna modifica al codice.*
