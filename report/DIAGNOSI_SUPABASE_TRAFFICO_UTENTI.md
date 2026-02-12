# DIAGNOSI: Supabase resta sveglio con traffico utenti?

**Data:** 12 Febbraio 2026  
**Progetto:** Camera con Vista Bistrot  
**Deployment:** Render (Web Service free) + Supabase (database free)  
**Stato:** Solo analisi diagnostica — nessuna modifica al codice

---

## 1. MAPPA FLUSSI PUBBLICI → ATTIVITÀ SUPABASE

| Pagina / Azione | Muove Supabase? | Endpoint | Tabella Supabase | Perché |
|---|---|---|---|---|
| **Home** (`/`) | **SÌ** | `GET /api/pages` + `GET /api/pages/{id}/blocks` | `pages`, `page_blocks` | Il layout carica le pagine visibili (header/nav), e la Home carica i suoi blocchi (hero, branding, teaser) |
| **Menu** (`/menu`) | **SÌ** | `GET /api/menu-items` | `site_settings` | Legge lo snapshot pubblicato da `site_settings` (chiave `published_menu_items`) |
| **Carta Vini** (`/carta-vini`) | **SÌ** | `GET /api/wines` | `site_settings` | Legge lo snapshot pubblicato da `site_settings` (chiave `published_wines`) |
| **Cocktail Bar** (`/cocktail-bar`) | **SÌ** | `GET /api/cocktails` | `site_settings` | Legge lo snapshot pubblicato da `site_settings` (chiave `published_cocktails`) |
| **Eventi** (`/eventi`) | **SÌ** | `GET /api/events` | `events` | Carica tutti gli eventi attivi e li filtra per visibilità/date |
| **Dettaglio Evento** (`/eventi/:id`) | **SÌ** | `GET /api/events/{id}` | `events` | Carica il singolo evento per ID |
| **Galleria** (`/galleria`) | **SÌ** | `GET /api/galleries` + `GET /api/galleries/{id}/images` | `galleries`, `gallery_images` | Carica album visibili, poi le immagini dell'album selezionato |
| **Dove Siamo / Contatti** (`/dove-siamo`) | **SÌ** | `GET /api/footer-settings` | `site_settings` | Carica le impostazioni footer (indirizzo, orari, contatti) |
| **Privacy Policy** (`/privacy-policy`) | **NO** | Nessuno | Nessuna | Contenuto completamente hardcoded nel componente React |
| **Cookie Policy** (`/cookie-policy`) | **NO** | Nessuno | Nessuna | Contenuto completamente hardcoded nel componente React |
| **"Prenota un tavolo"** (click) | **NO** | Nessuno | Nessuna | Apre un dialog React locale, poi `window.open("https://cameraconvista.resos.com/booking", "_blank")` — link esterno, nessuna API chiamata |

### Componenti layout presenti su OGNI pagina

| Componente | Muove Supabase? | Endpoint | Tabella |
|---|---|---|---|
| **Header** (navigazione) | **SÌ** | `GET /api/pages` + `GET /api/pages/slug/{slug}/blocks` | `pages`, `page_blocks` |
| **Footer** | **SÌ** | `GET /api/footer-settings` | `site_settings` |

> **Nota:** Anche Privacy Policy e Cookie Policy, pur non avendo query proprie, fanno partire le query di Header e Footer perché usano il layout comune `PublicLayout`. Quindi **ogni pagina visitata genera almeno 2 query Supabase**.

---

## 2. LISTA ENDPOINT `/api` CHIAMATI DAL CLIENT PUBBLICO

| Endpoint | Metodo | Chi lo chiama | Tabella Supabase interrogata |
|---|---|---|---|
| `/api/pages` | GET | Header (ogni pagina), Home | `pages` |
| `/api/pages/{id}/blocks` | GET | Home (blocchi hero/branding/teaser) | `page_blocks` |
| `/api/pages/slug/{slug}/blocks` | GET | Header (icone pagine) | `pages`, `page_blocks` |
| `/api/menu-items` | GET | Menu page | `site_settings` |
| `/api/wines` | GET | Carta Vini page | `site_settings` |
| `/api/cocktails` | GET | Cocktail Bar page | `site_settings` |
| `/api/events` | GET | Eventi page | `events` |
| `/api/events/{id}` | GET | Dettaglio evento | `events` |
| `/api/galleries` | GET | Galleria page | `galleries` |
| `/api/galleries/{id}/images` | GET | Galleria (click su album) | `gallery_images` |
| `/api/footer-settings` | GET | Footer (ogni pagina), Dove Siamo | `site_settings` |
| `/api/site-settings` | GET | Disponibile ma non usato dal client pubblico | `site_settings` |

---

## 3. TABELLE SUPABASE TOCCATE DAL TRAFFICO PUBBLICO

| Tabella | Tipo di query | Pagine che la interrogano |
|---|---|---|
| `pages` | SELECT (lista pagine visibili) | Tutte (via Header) |
| `page_blocks` | SELECT (blocchi per pagina) | Home, Header |
| `site_settings` | SELECT (chiavi specifiche) | Menu, Vini, Cocktails, Dove Siamo, Footer (tutte le pagine) |
| `events` | SELECT (eventi attivi) | Eventi, Dettaglio evento |
| `galleries` | SELECT (album visibili) | Galleria |
| `gallery_images` | SELECT (immagini album) | Galleria (al click su album) |

**Tabelle MAI toccate dal traffico pubblico:** `users`, `media`, `media_categories`, `menu_items` (draft), `wines` (draft), `cocktails` (draft)

---

## 4. COMPORTAMENTO CACHE / DATI DINAMICI

### Configurazione React Query globale

```
staleTime: Infinity         → i dati non diventano mai "stale" automaticamente
refetchOnWindowFocus: false → non ricarica al focus finestra
refetchInterval: false      → nessun polling
```

### Override per componente

| Componente | staleTime personalizzato |
|---|---|
| Header | 5 minuti (`5 * 60 * 1000`) |
| Footer | 5 minuti (`1000 * 60 * 5`) |
| Dove Siamo (footer-settings) | 5 minuti (`1000 * 60 * 5`) |
| Tutte le altre pagine | Infinity (default globale) |

### Cosa succede in pratica

| Scenario | Query Supabase? | Dettaglio |
|---|---|---|
| **Primo caricamento** (utente arriva sul sito) | **SÌ — 3-6 query** | Tutte le query partono: `pages`, `footer-settings`, blocchi pagina + dati specifici della pagina |
| **Navigazione SPA** (cambio pagina senza refresh) | **SÌ per dati nuovi** | Solo le query della nuova pagina non ancora in cache. `pages` e `footer-settings` restano in cache |
| **Refresh browser** (F5) | **SÌ — 3-6 query** | Cache React Query azzerata, tutte le query ripartono |
| **Tab già aperta, utente torna dopo 1 ora** | **NO** | Cache ancora valida (staleTime: Infinity), nessun refetch |
| **Tab aperta, utente torna dopo 5+ min** | **Parziale** | Solo Header e Footer refetchano (staleTime: 5 min), dati pagina restano in cache |
| **Nuova sessione / nuovo utente** | **SÌ — 3-6 query** | Cache vuota, tutto viene ricaricato |

**Riassunto:** Ogni nuova visita o refresh genera 3-6 query Supabase via REST API. La navigazione interna genera query solo per dati non ancora in cache.

---

## 5. TIPO DI CONNESSIONE: REST vs PostgreSQL DIRETTO

### Produzione (Render)

```
SUPABASE_URL = impostata
  → SupabaseStorage attivata
  → Tutte le query passano via REST API (PostgREST / supabase-js)
  → NESSUNA connessione PostgreSQL diretta (pg Pool)
```

### Sviluppo (Replit)

```
SUPABASE_URL = non impostata
DATABASE_URL = impostata
  → DatabaseStorage attivata
  → Tutte le query passano via pg Pool (connessione PostgreSQL diretta)
```

### Dettaglio tecnico

Il modulo `pg` (Pool/Drizzle) è presente nel codice (`server/db.ts`) ma **non viene mai utilizzato in produzione** perché la variabile `SUPABASE_URL` è configurata su Render → lo storage usa `SupabaseStorage` (REST), non `DatabaseStorage` (pg).

Tutte le query pubbliche passano per `supabaseAdmin` che comunica via **HTTP REST API** verso PostgREST di Supabase. Non esiste nessuna connessione TCP persistente al database PostgreSQL.

---

## 6. CONTRIBUTO PER PAGINA AL MANTENIMENTO SUPABASE

| Pagina | Query proprie | Query layout (Header+Footer) | Totale query | Contribuisce? |
|---|---|---|---|---|
| Home | 2 (pages, blocks) | 2 (pages, footer) | **4** | **SÌ** |
| Menu | 1 (menu-items) | 2 | **3** | **SÌ** |
| Carta Vini | 1 (wines) | 2 | **3** | **SÌ** |
| Cocktail Bar | 1 (cocktails) | 2 | **3** | **SÌ** |
| Eventi | 1 (events) | 2 | **3** | **SÌ** |
| Dettaglio Evento | 1 (event by id) | 2 | **3** | **SÌ** |
| Galleria | 1-2 (galleries + images) | 2 | **3-4** | **SÌ** |
| Dove Siamo | 1 (footer-settings) | 2 | **3** | **SÌ** |
| Privacy Policy | 0 | 2 | **2** | **SÌ** (solo via layout) |
| Cookie Policy | 0 | 2 | **2** | **SÌ** (solo via layout) |
| "Prenota un tavolo" | 0 | 0 | **0** | **NO** (link esterno) |

---

## 7. SUFFICIENZA RISPETTO ALLO STANDBY SUPABASE

### Analisi quantitativa

- **Ogni nuova visita** genera 3-6 query REST a Supabase
- **Header e Footer** generano almeno 2 query per ogni pagina, anche quelle statiche
- **Nessuna pagina pubblica** è completamente priva di query (grazie al layout comune)
- L'unica azione che NON genera query è il click "Prenota un tavolo" (link esterno)

### Il problema fondamentale

Supabase (piano free) definisce "attività" come **connessioni PostgreSQL dirette** al database. Le query via REST API (PostgREST / supabase-js) **potrebbero non essere sufficienti** per prevenire lo standby dopo 7 giorni, perché:

1. La REST API è un servizio separato dal database PostgreSQL
2. PostgREST mantiene il suo pool di connessioni internamente
3. Supabase potrebbe distinguere tra "attività REST" e "connessioni dirette al database"

### Scenari di rischio

| Scenario traffico | Visite/settimana | Query REST/settimana | Rischio standby |
|---|---|---|---|
| **Alto** (ristorante attivo) | 100+ | 300-600+ | **Molto basso** |
| **Medio** (traffico regolare) | 20-50 | 60-300 | **Basso** |
| **Basso** (bassa stagione) | 5-10 | 15-60 | **Medio** |
| **Minimo** (quasi nessuna visita) | 0-2 | 0-12 | **Alto** |
| **Zero** (nessuna visita per 7+ gg) | 0 | 0 | **Certo** |

---

## 8. CONCLUSIONE FINALE

| Domanda | Risposta |
|---|---|
| Le pagine pubbliche fanno query a Supabase? | **SÌ** — Tutte le pagine generano almeno 2 query (via layout Header+Footer) |
| Le query sono via REST o PostgreSQL diretto? | **Solo REST** (PostgREST via supabase-js) — nessuna connessione pg diretta in produzione |
| Con traffico regolare Supabase resta attivo? | **Probabilmente SÌ** per la REST API, ma **non garantito al 100%** per il database PostgreSQL sottostante |
| Ci sono pagine che NON fanno alcuna query? | **NO** — grazie al layout comune, anche Privacy e Cookie Policy generano 2 query |
| I dati sono sempre freschi? | **SÌ al primo caricamento**, poi cache in-memory (`staleTime: Infinity`) fino a refresh o nuova sessione |
| Servono modifiche per maggiore sicurezza? | **Consigliato** — aggiungere un pool `pg` diretto nell'endpoint keep-alive eliminerebbe ogni dubbio |

### Verdetto

**CON TRAFFICO REGOLARE: Supabase molto probabilmente resta attivo**, perché ogni visita genera query REST che indicano attività. Tuttavia, poiché tutte le query passano via REST API e non via connessione PostgreSQL diretta, esiste un margine di incertezza legato a come Supabase conteggia l'attività sul piano free.

**RACCOMANDAZIONE:** Per eliminare ogni rischio, implementare un endpoint `/api/health` con pool `pg` diretto alla connection string Supabase, come descritto nel report `DIAGNOSI_KEEP_ALIVE_RENDER_SUPABASE.md`.

---

*Report generato il 12 Febbraio 2026 — Solo analisi diagnostica, nessuna modifica al codice.*
