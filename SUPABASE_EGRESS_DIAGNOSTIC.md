# Report Diagnostico Supabase Egress — Camera con Vista

**Analisi completata: Solo lettura. Zero modifiche al codice.**

Data analisi: 21 Marzo 2026

---

## Sintesi Causa Principale

Ci sono **due problemi distinti e sovrapposti**: 
1. Il preloader globale che scarica silenziosamente 29 immagini da Supabase all'inizio di ogni sessione utente
2. La presenza di file PNG non ottimizzati enormi — il peggiore da solo fa **7.4 MB** ad ogni visita

Insieme questi due fattori portano a 20–25 MB trasferiti per sessione, rendendo il Free Plan (5 GB/mese) raggiungibile con sole 6-7 visite al giorno.

---

## Mappa di cosa scarica la homepage (per sessione)

### A) Risorse visibili (necessarie, già nella viewport)

| Blocco | File | Formato | Peso stimato |
|--------|------|---------|--------------|
| Hero | `1770167054575-...ffb4ad.jpeg` | JPEG | ~300 KB |
| Teaser Menu | `1770393081848-senza_titolo-29.jpg` | JPG | ~200 KB |
| Teaser Vini | `1770415881002-ChatGPT_Image_6_feb_2026.png` | **PNG** | **~3.8 MB** |
| Teaser Cocktail | `1770392760295-Piper.jpg` | JPG | ~150 KB |
| Teaser Eventi | `1770392967328-e.jpg` | JPG | ~150 KB |
| Teaser Privati | `1770410008676-tavolo_imperiale.PNG` | **PNG** | **~3.7 MB** |
| **Subtotale visible** | | | **~8.3 MB** |

### B) Risorse precaricate in background (non visibili, non richieste dall'utente)

Il hook `useImagePreloader` si attiva in `App.tsx` riga 168 — non solo sulla homepage, ma su **qualsiasi pagina** il browser carichi per prima. Chiama 10 endpoint API, ottiene i blocchi di tutte le pagine del sito, poi scarica silenziosamente ogni `imageUrl` trovata.

| Pagina | Immagini precaricate | File significativi |
|--------|---------------------|-------------------|
| Menu | 1 img | Hero JPG |
| Carta Vini | 1 img | Hero JPG |
| Cocktail Bar | 4 img | 3 JPG + 1 JPG |
| Eventi | 1 img | Hero JPG |
| Galleria | 1 img | Hero JPG |
| Dove Siamo | 1 img | **PNG (ChatGPT gen)** |
| Aperitivo (sotto-pagina) | 3 img | WebP × 3 |
| Cena (sotto-pagina) | 2 img | WebP × 2 |
| Esclusivo (sotto-pagina) | 3 img | WebP + JPG + WebP |
| Gallery covers (4 album) | 4 img | **⚠️ Killer: 7.4 MB PNG** |
| Event posters | 2 img | WebP × 2 |
| **Subtotale background** | **23 img** | **~15–18 MB** |

**Totale per sessione (worst case, no cache browser):**

| Categoria | Immagini | Peso |
|-----------|---------|------|
| Visibili | 6 | ~8.3 MB |
| Background (preloader) | 23 | ~15–18 MB |
| **TOTALE SESSIONE** | **29** | **~23–26 MB** |

---

## Top 10 File Pesanti (richiesti dalla home ogni sessione)

| # | File | Peso | Formato | Dove | Causa download |
|---|------|------|---------|------|---------------|
| 1 | `1770731933994-Screenshot_2026-02-10_alle_14.58.36.png` | **7.4 MB** | PNG non ottimizzato | Cover album "Il Locale" (Galleria) + blocco `test-image` in eventi-privati | Preloader gallery covers |
| 2 | `1770415881002-ChatGPT_Image_6_feb_2026__23_11_03.png` | **~3.8 MB** | PNG generato da AI | Home: teaser-vini | Visibile + preloader |
| 3 | `1770410008676-tavolo_imperiale.PNG` | **~3.7 MB** | PNG fotografico | Home: teaser-privati + eventi-privati hero | Visibile + preloader (deduplicata) |
| 4 | `1770298642148-ChatGPT_Image_30_dic_2025__00_06_13.png` | **~2–4 MB** | PNG generato da AI | Dove Siamo: hero | Preloader |
| 5 | `1770167054575-...ffb4ad.jpeg` | ~300 KB | JPEG | Home: hero | Visibile |
| 6 | `1770393081848-senza_titolo-29.jpg` | ~250 KB | JPG | Home: teaser-menu + Menu: hero | Visibile + preloader (deduplicata) |
| 7 | `1770822964640-8.jpg` | ~200 KB | JPG | Carta Vini: hero | Preloader |
| 8 | `1770392727044-PZZ__110.jpg` | ~200 KB | JPG | Cocktail Bar: hero | Preloader |
| 9 | `1771795822283-...webp` | ~150 KB | WebP ✅ | Cocktail/Aperitivo | Preloader |
| 10 | `1770392997759-Ilariamestieriph-115.jpg` | ~150 KB | JPG | Eventi: hero | Preloader |

**⚠️ Nota su #1**: questo file appare **due volte** nel database — come cover dell'album "Il Locale" E come blocco `test-image` nella pagina `eventi-privati`. Il blocco `test-image` sembra un artefatto di test mai rimosso.

---

## Tutte le logiche di prefetch/preload trovate

### 1. `useImagePreloader` — `client/src/hooks/use-image-preloader.ts`
**Gravità: 🔴 Alta**
- Montato in **`App.tsx` riga 168** → si attiva su **qualsiasi pagina** di atterraggio
- All'avvio: chiama `/api/pages` + 10 endpoint `/api/pages/slug/X/blocks` + `/api/galleries` + `/api/events`
- Per ogni `imageUrl` trovata: crea `new Image()` e scarica il file da Supabase
- Il Set `preloadedUrls` deduplicato per URL **ma si resetta ad ogni refresh/nuova tab**
- Scarica immagini di pagine mai visitate dall'utente (es. cocktail, eventi-privati-esclusivo)

### 2. `prefetchPageData` — `client/src/components/layout/Header.tsx` riga 155
**Gravità: 🟡 Media**
- Trigger: `onMouseEnter` sui link di navigazione desktop (solo schermi > 1280px)
- Chiama l'API blocks della pagina + scarica tutte le immagini di quella pagina
- Deduplicato con `prefetchedSlugs` a livello di modulo (persiste nella sessione)
- Si aggiunge al preloader: su mobile non scatta, su desktop scarica pagine aggiuntive al hover

### 3. `refetchInterval: 5000` — `client/src/components/layout/AdminLayout.tsx` riga 69
**Gravità: 🟢 Bassa (solo admin)**
- Polling ogni 5 secondi nell'area admin — non impatta utenti pubblici

### 4. `preloadImageUrl` — `client/src/components/admin/ImageContainer.tsx` riga 172
**Gravità: 🟢 Trascurabile**
- Usato solo nell'editor admin per preview immagini — non impatta utenti pubblici

---

## Stime numeriche

| Scenario | MB per sessione | Sessioni/giorno per 1.5 GB | Sessioni/mese per 5 GB |
|----------|----------------|--------------------------|----------------------|
| **Attuale** (PNG pesanti + preloader) | ~23 MB | **67** | **217** |
| Solo PNG ottimizzate (no preloader fix) | ~5 MB | 300 | 1.000 |
| Solo preloader disabilitato (PNG ancora pesanti) | ~14 MB | 107 | 357 |
| **Entrambi i fix** (PNG ottimizzate + preloader limitato) | ~1.5 MB | **1.000** | **3.333** |

**Sintesi**: con lo scenario attuale, bastano **67 aperture del sito al giorno** per generare 1.5 GB/giorno. Con entrambi i fix, servirebbero 1.000 aperture/giorno — impensabile per un ristorante.

---

## Conclusione: Tornare al Free Plan?

### ❌ NO — Non è sicuro disdire il Pro Plan

Con il traffico misurato (~1.5 GB/giorno), il Free Plan (5 GB/mese) si esaurirebbe in **3–4 giorni**. Anche con zero visite "reali", i bot, i crawler di Google e i test di sviluppo basterebbero a saturarlo in una settimana.

---

## Piano minimo proposto (solo proposte, zero implementazione)

### A) Conversione PNG → WebP/JPEG (impatto massimo, senza toccare il codice)
Tre file da soli valgono ~15 MB per sessione. Sostituirli con WebP compressi ridurrebbe a ~100–150 KB ciascuno:

| File da sostituire | Dove | Risparmio |
|-------------------|------|-----------|
| `1770731933994-Screenshot...png` (7.4 MB) | Cover galleria "Il Locale" | **–7.3 MB** |
| `1770415881002-ChatGPT_Image...png` (3.8 MB) | Home teaser-vini | **–3.65 MB** |
| `1770410008676-tavolo_imperiale.PNG` (3.7 MB) | Home teaser-privati + eventi-privati | **–3.55 MB** |
| `1770298642148-ChatGPT_Image...png` (~3 MB) | Dove Siamo hero | **–2.85 MB** |
| **Risparmio totale stimato** | | **–17 MB/sessione** |

Dopo questa sola azione: ~6 MB per sessione invece di ~23 MB. Il traffico mensile scenderebbe da ~45 GB a ~12 GB — ancora fuori dal Free, ma significativamente ridotto.

### B) Limitare il preloader (modifica codice minima)
Nel file `use-image-preloader.ts`, eliminare il ciclo che scarica i blocchi di tutte le pagine. Mantenere solo il preload delle cover delle gallerie e dei poster eventi (i più utili per la navigazione rapida). Risparmio: ~50% del traffico di background.

### C) Rimuovere il blocco `test-image` in `eventi-privati`
Il blocco `test-image` nella pagina `eventi-privati` contiene il file da 7.4 MB e non ha nessun utilizzo visibile — sembra un residuo di test. La sua rimozione eliminerebbe un download doppio di quel file.

### D) Hover-prefetch → "soft prefetch" (solo dati, no immagini)
In `Header.tsx`, il `prefetchPageData` potrebbe limitarsi a scaricare i metadati dei blocchi (per velocizzare la navigazione) senza creare `new Image()` — eliminando il download delle immagini prima che l'utente navighi effettivamente.

**Con A + B + C**: il traffico scenderebbe a ~2–3 GB/mese, compatibile con il Free per un ristorante con traffico medio-basso.

---

**Fine diagnosi. Report generato senza modifiche al codice o al database.**
