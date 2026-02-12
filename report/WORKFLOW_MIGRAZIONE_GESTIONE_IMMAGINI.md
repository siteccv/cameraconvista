# WORKFLOW MIGRAZIONE GESTIONE IMMAGINI

## Progetto: Camera con Vista
## Documento operativo — Riferimento ufficiale per tutte le modifiche legate alla gestione immagini

---

# 1. STATO ATTUALE DEL PROGETTO

## 1.1 Situazione corrente

Il progetto utilizza due logiche di gestione immagini coesistenti:

- **EditableImage** (legacy): usato su tutte le hero delle pagine pubbliche e spazi eventi privati. Basato su `object-cover` + `transform scale/translate` con editing in modale separato e offset in pixel assoluti.
- **TestImageContainer** (nuovo, approvato): usato solo nella pagina Eventi Privati come container isolato di test. Basato su fit-to-width + posizionamento esplicito con editing WYSIWYG nel container reale e offset normalizzati [-100, +100].

## 1.2 Componenti coinvolti

| Componente | File | Ruolo | Logica |
|---|---|---|---|
| EditableImage | `client/src/components/admin/EditableImage.tsx` | Hero tutte le pagine, spazi | Legacy (object-cover) |
| TestImageContainer | `client/src/components/admin/TestImageContainer.tsx` | Container test eventi privati | Nuova (fit-to-width) |
| EventModal | `client/src/components/admin/EventModal.tsx` | Poster eventi | Legacy (modale zoom/offset) |
| ImageZoomModal | `client/src/components/admin/gallery/ImageZoomModal.tsx` | Galleria album | Legacy (modale zoom/offset) |
| IPhoneFrame | `client/src/components/admin/IPhoneFrame.tsx` | Preview mobile admin | Wrapper fixed-width |

## 1.3 Problemi risolti (nel TestImageContainer)

- ✅ Crop stabile indipendente dal viewport (aspect ratio fisso)
- ✅ Zoom monodirezionale (solo ingrandimento, mai sotto stato zero)
- ✅ Clamp dinamico reale (basato su overflow effettivo, niente bande vuote)
- ✅ Offset normalizzato [-100, +100] (portabile tra device)
- ✅ Editing WYSIWYG diretto nel container (no modale separato)
- ✅ Overlay controllabile (slider 0-70%, persistente)
- ✅ Una sola logica di rendering per admin e pubblico
- ✅ Media Library come unica fonte immagini

## 1.4 Problemi ancora aperti

- ❌ Tutte le hero del sito usano ancora EditableImage (legacy)
- ❌ Il crop delle hero cambia con le dimensioni della finestra (layout fluid + object-cover + 60vh)
- ❌ Overlay hardcoded `bg-black/35` su tutte le 7 pagine con hero (non configurabile)
- ❌ Offset in pixel assoluti non portabili tra viewport diversi
- ❌ Editing in modale separato con aspect ratio diverso dalla pagina reale
- ❌ TestImageContainer non ha gestione mobile indipendente
- ❌ Preview mobile admin usa unità `vh` del viewport reale, altezza frame dinamica, classi Tailwind responsive non intercettate

---

# 2. LOGICA CANONICA APPROVATA

**Questa sezione è la base teorica permanente. Non deve cambiare.**

## 2.1 Stato zero (fit-to-width)

La base di rendering è SEMPRE fit-to-width:
```
baseW = containerW
baseH = containerW × (naturalH / naturalW)
```

L'immagine viene scalata per riempire la larghezza del container, mantenendo il rapporto d'aspetto originale. Lo stato zero è definito come zoom = 100.

## 2.2 Eccezione panoramiche

Se `baseH < containerH` (l'immagine fit-to-width è più bassa del container), il minimo di zoom viene alzato automaticamente:
```
minZoom = ceil(containerH / baseH × 100)
```

In questo modo non appaiono mai bande vuote verticali. La base resta sempre fit-to-width — cambia solo il valore minimo ammesso per lo zoom.

## 2.3 Zoom monodirezionale

```
effectiveZoom = max(minZoom, zoom)
zoomFactor = effectiveZoom / 100
imgW = baseW × zoomFactor
imgH = baseH × zoomFactor
```

- Lo zoom è sempre ≥ 100 (o ≥ minZoom per panoramiche)
- L'immagine può solo ingrandirsi, mai ridursi sotto le dimensioni del container
- Range slider: minZoom → 300

## 2.4 Clamp dinamico (pan)

```
overflowX = max(0, imgW - containerW)
overflowY = max(0, imgH - containerH)

clampedPanX = overflowX > 0 ? clamp(panX, -100, +100) : 0
clampedPanY = overflowY > 0 ? clamp(panY, -100, +100) : 0
```

- Se non c'è overflow su un asse, il pan è bloccato a 0 su quell'asse
- Nessuna banda vuota può mai apparire

## 2.5 Posizionamento esplicito

```
translateX = (clampedPanX / 100) × (overflowX / 2)
translateY = (clampedPanY / 100) × (overflowY / 2)
imgLeft = (containerW - imgW) / 2 + translateX
imgTop = (containerH - imgH) / 2 + translateY
```

Rendering con `position: absolute` + `left/top/width/height`. Nessun `object-cover`, nessun `object-fit`, nessun `transform: scale/translate`.

## 2.6 Conversione drag → pan

```
dx pixel mouse → dpanX = dx × 200 / overflowX  (se overflowX > 0)
dy pixel mouse → dpanY = dy × 200 / overflowY  (se overflowY > 0)
```

Se overflow è 0 su un asse, il drag è bloccato su quell'asse.

## 2.7 Overlay regolabile

- Range: 0–70 (percentuale opacità del nero)
- Rendering: `<div style="backgroundColor: rgba(0,0,0, overlay/100)">` sopra l'immagine, sotto i children
- Z-order: immagine → overlay → children (testo) → toolbar admin
- Persistente nel database (campo `metadata.overlay`)
- Reset azzera overlay a 0

## 2.8 Separazione desktop/mobile

Ogni immagine deve avere due set di valori completamente indipendenti:
- **Desktop**: zoom, panX, panY, overlay
- **Mobile**: zoomMobile, panXMobile, panYMobile, overlayMobile

L'admin può editare ciascun set separatamente. Il sito pubblico seleziona i valori in base a `forceMobileLayout || viewportIsMobile`.

## 2.9 Persistenza dati

Campi DB riutilizzati per ogni page_block:
- `imageUrl` → URL immagine (unico, non duplicato per desktop/mobile)
- `imageScaleDesktop` → zoom desktop (100 = stato zero)
- `imageScaleMobile` → zoom mobile
- `imageOffsetX` → panX desktop normalizzato (-100 a +100)
- `imageOffsetY` → panY desktop normalizzato (-100 a +100)
- `imageOffsetXMobile` → panX mobile normalizzato
- `imageOffsetYMobile` → panY mobile normalizzato
- `metadata.overlay` → overlay desktop (0-70)
- `metadata.overlayMobile` → overlay mobile (0-70)

## 2.10 Media Library come unica fonte

Le immagini vengono sempre caricate tramite Media Library (MediaPickerModal). Nessun URL diretto, nessun input manuale, nessun upload separato.

---

# 3. STRATEGIA DI CONSOLIDAMENTO

## 3.1 Principi

1. **Componente unico riusabile**: TestImageContainer verrà rinominato/evoluto in `ImageContainer` — un componente generico che sostituisce EditableImage ovunque.

2. **Eliminazione progressiva**: Le logiche legacy (EditableImage, EventModal zoom, ImageZoomModal) verranno sostituite una alla volta, pagina per pagina, con validazione ad ogni step.

3. **Nessuna duplicazione permanente**: Durante la migrazione è accettabile avere entrambi i componenti nel codice. Al completamento della migrazione, EditableImage e le logiche modali zoom vengono eliminate.

4. **Nessuna patch temporanea permanente**: Ogni modifica deve essere definitiva. Se serve un workaround, deve avere una data di scadenza e uno step di rimozione previsto.

5. **Dati legacy**: Gli offset in pixel assoluti del vecchio sistema non sono convertibili automaticamente in offset normalizzati. Durante la migrazione di ogni pagina, gli offset vengono resettati a 0 e l'immagine viene rieditata dall'admin.

## 3.2 Governance del codice

- Mai due logiche di rendering permanenti per lo stesso tipo di container
- Mai fix sovrapposti (una correzione non deve presupporre un bug in un altro layer)
- Mai regressioni nascoste (ogni step deve essere testato prima di procedere)
- Il registro aggiornamenti (sezione 6) deve essere compilato ad ogni intervento

---

# 4. ORDINE OPERATIVO DEGLI STEP

---

## Step 1 — Consolidamento componente unico

### Obiettivo
Trasformare TestImageContainer in `ImageContainer`: componente generico, riusabile, con API pulita, pronto per qualsiasi container del sito.

### Componenti coinvolti
- `TestImageContainer.tsx` → rinominato/evoluto in `ImageContainer.tsx`
- `eventi-privati.tsx` → aggiornare import

### Attività
- Rinominare il componente
- Rendere l'API generica (props chiare, nomi standard)
- Verificare che funzioni esattamente come TestImageContainer
- Aggiungere `data-testid` configurabili
- Mantenere il componente TestImageContainer sulla pagina Eventi Privati per verifica

### Rischi
- Basso: è un rename + refine dell'API, nessuna logica cambia

### Test obbligatori
- Container si monta correttamente
- Zoom slider funziona
- Pan drag funziona
- Overlay slider funziona
- Save persiste i dati
- Cancel ripristina i dati
- Reset azzera zoom, pan, overlay
- Media Library si apre e seleziona

### Criteri di accettazione
- Il componente `ImageContainer` esiste e funziona identicamente al TestImageContainer
- L'API è documentata e generica
- Nessuna regressione sulla pagina Eventi Privati

---

## Step 2 — Aggiunta gestione mobile indipendente

### Obiettivo
Estendere ImageContainer con supporto per valori desktop/mobile separati.

### Componenti coinvolti
- `ImageContainer.tsx`
- Pagina test (Eventi Privati)

### Attività
- Aggiungere props: `zoomMobile`, `panXMobile`, `panYMobile`, `overlayMobile`
- Aggiungere switch desktop/mobile nella toolbar admin
- Logica di selezione valori basata su `forceMobileLayout || viewportIsMobile`
- Il save deve restituire entrambi i set di valori
- L'admin può editare desktop e mobile indipendentemente

### Rischi
- Medio: la logica di switch deve essere affidabile e non confondere i set di valori
- La toolbar diventa più complessa — gestire lo spazio visivo

### Test obbligatori
- Editare valori desktop, verificare che mobile non cambi
- Editare valori mobile, verificare che desktop non cambi
- Switch desktop→mobile→desktop mantiene i valori
- Save persiste entrambi i set
- Visualizzazione pubblica in desktop usa valori desktop
- Visualizzazione in forceMobileLayout usa valori mobile

### Criteri di accettazione
- Due set di valori completamente indipendenti
- Switch affidabile nell'admin
- Persistenza corretta di entrambi i set
- Rendering corretto sia desktop che mobile

---

## Step 3 — Migrazione hero test (Menu)

### Obiettivo
Sostituire EditableImage nella hero della pagina Menu con il nuovo ImageContainer. Validare l'integrazione su una pagina reale.

### Componenti coinvolti
- `menu.tsx`
- `ImageContainer.tsx`
- `page-defaults.ts` (aggiornare default)

### Attività
- Sostituire EditableImage con ImageContainer nella hero
- Definire aspect ratio hero (es. 16/9 o 21/9)
- Integrare overlay controllabile (rimuovere `bg-black/35` hardcoded)
- Adattare il save handler per i nuovi campi
- Resettare offset legacy a 0 per la pagina Menu
- Verificare che il testo del titolo sia leggibile con overlay controllabile

### Rischi
- Medio: prima sostituzione reale, possibili problemi di aspect ratio, dimensioni container, layout
- I dati offset salvati in pixel vengono persi (devono essere rieditati)
- L'altezza della hero cambia se passiamo da `h-[60vh]` a un aspect ratio fisso

### Test obbligatori
- La hero è visibile e l'immagine è correttamente visualizzata
- Il crop è stabile ridimensionando la finestra del browser
- L'overlay è controllabile e visibile
- Il testo del titolo è leggibile
- L'editing WYSIWYG funziona (click → toolbar → save)
- I valori desktop e mobile sono indipendenti
- La pagina si carica senza errori
- La pagina pubblica (non admin) visualizza correttamente

### Criteri di accettazione
- Hero della pagina Menu usa ImageContainer
- Crop stabile su qualsiasi viewport
- Overlay controllabile dall'admin
- Nessuna regressione sulle altre pagine
- EditableImage rimane attivo sulle altre pagine (non toccato)

---

## Step 4 — Validazione performance + UX

### Obiettivo
Verificare che la migrazione della hero Menu non abbia introdotto problemi di performance o UX.

### Componenti coinvolti
- `menu.tsx` (pagina migrata)
- Tutte le altre pagine (verifica non regressione)

### Attività
- Testare caricamento pagina Menu su diversi viewport (desktop, tablet, mobile)
- Testare performance (tempo di caricamento immagine, rendering)
- Verificare che l'identità visiva sia stabile
- Raccogliere feedback admin (facilità di editing)
- Confrontare con le altre hero (ancora su EditableImage) per individuare differenze visive

### Rischi
- Basso: è una fase di validazione, non di implementazione

### Test obbligatori
- Lighthouse performance score non peggiorato
- Immagine caricata con eager loading (above-the-fold)
- Nessun layout shift visibile durante il caricamento
- Editing fluido (no lag su zoom/pan)
- Overlay coerente tra admin e pubblico

### Criteri di accettazione
- Performance equivalente o migliore rispetto a EditableImage
- UX di editing migliorata (WYSIWYG vs modale)
- Identità visiva stabile e professionale
- Approvazione esplicita dell'admin/utente

---

## Step 5 — Migrazione progressiva altre hero

### Obiettivo
Sostituire EditableImage con ImageContainer su tutte le hero delle pagine pubbliche.

### Componenti coinvolti
- Tutte le pagine: `home.tsx`, `carta-vini.tsx`, `cocktail-bar.tsx`, `eventi.tsx`, `eventi-privati.tsx`, `galleria.tsx`, `dove-siamo.tsx`
- `page-defaults.ts`

### Ordine suggerito di migrazione
1. Carta dei Vini (struttura simile a Menu)
2. Cocktail Bar (struttura simile a Menu)
3. Eventi (struttura simile)
4. Galleria (struttura simile)
5. Dove Siamo (struttura simile)
6. Eventi Privati (hero + spazi — più complessa)
7. Home (la più critica — per ultima)

### Attività per ogni pagina
- Sostituire EditableImage con ImageContainer nella hero
- Rimuovere overlay hardcoded `bg-black/35`
- Aggiornare save handler
- Resettare offset legacy
- Testare rendering desktop e mobile
- Testare editing admin

### Rischi
- Medio per le pagine standard
- Alto per la Home (ha logica branding + logo + booking button + struttura diversa)
- I dati offset vengono resettati — l'admin deve rieditare ogni immagine

### Test obbligatori (per ogni pagina)
- Hero visibile con immagine corretta
- Crop stabile su resize browser
- Overlay funzionante
- Testo leggibile
- Editing WYSIWYG funzionante
- Valori desktop/mobile indipendenti
- Nessuna regressione sulle altre pagine

### Criteri di accettazione
- Tutte le hero usano ImageContainer
- Tutti gli overlay sono controllabili
- EditableImage non è più usato per le hero
- Ogni pagina testata e approvata individualmente

---

## Step 6 — Stabilizzazione preview mobile admin

### Obiettivo
Rendere la preview mobile in admin affidabile e rappresentativa del rendering reale su dispositivo mobile.

### Componenti coinvolti
- `IPhoneFrame.tsx`
- `admin/pages.tsx`
- `admin/preview.tsx`
- Eventualmente: Container Queries CSS

### Problemi da risolvere
1. L'altezza del frame varia con la finestra del browser
2. Le unità `vh` nel contenuto si riferiscono al viewport reale
3. Le classi Tailwind responsive (`md:`, `lg:`) rispondono al viewport reale
4. L'Header usa `window.innerWidth` direttamente

### Possibili soluzioni (da valutare)
- **Container Queries**: far dipendere le media query dalla larghezza del container, non del viewport
- **Iframe isolato**: renderizzare il contenuto in un iframe con viewport indipendente
- **Altezza fissa**: bloccare l'altezza dell'IPhoneFrame a un valore fisso indipendente dal parent
- **CSS custom properties**: propagare le dimensioni del frame come variabili CSS

### Rischi
- Alto: intervenire sulle media query ha impatto su tutto il layout
- Container Queries richiedono refactoring di tutte le classi responsive
- Iframe ha limitazioni di comunicazione con il contesto React parent

### Test obbligatori
- La preview non cambia ridimensionando la finestra del browser
- Il contenuto dentro il frame è proporzionato come su un iPhone reale
- Il Header si visualizza in modalità mobile nel frame
- Le hero hanno proporzioni corrette
- L'editing WYSIWYG funziona dentro il frame

### Criteri di accettazione
- La preview mobile è fissa e stabile
- Il contenuto dentro il frame è rappresentativo del rendering reale
- Ridimensionare la finestra del browser non altera il contenuto del frame

---

# 5. PUNTI DI ATTENZIONE TRASVERSALI

## 5.1 Conversione dati legacy

I dati offset attualmente salvati nel database sono in pixel assoluti. Il nuovo sistema usa offset normalizzati [-100, +100]. **Non sono convertibili automaticamente.** Ad ogni migrazione di pagina, gli offset vengono resettati a 0 e l'immagine deve essere rieditata dall'admin.

## 5.2 Aspect ratio hero

Il passaggio da `h-[60vh]` (altezza variabile) a un aspect ratio fisso (es. `16/9`, `21/9`) cambia l'altezza visiva della hero. Questa scelta ha impatto sull'identità visiva e deve essere validata con l'utente.

## 5.3 Home page

La Home ha una struttura hero diversa dalle altre pagine: include logo, tagline, pulsante prenotazione. La migrazione della Home è più complessa e va fatta per ultima.

## 5.4 EventModal e ImageZoomModal

Questi componenti usano logiche modali per zoom/offset su poster eventi e immagini galleria. La loro migrazione a ImageContainer è un'estensione naturale ma con priorità inferiore rispetto alle hero.

## 5.5 Backward compatibility

Durante la migrazione, le pagine non ancora migrate continuano a usare EditableImage. I due sistemi coesistono temporaneamente. Alla fine della migrazione completa, EditableImage viene eliminato.

---

# 6. REGISTRO AGGIORNAMENTI

## Formato entry

```
### [DATA] — Step [N]: [Titolo]

**Stato**: Completato / In corso / Bloccato
**Componenti modificati**: [elenco file]
**Problemi incontrati**: [descrizione]
**Diagnosi tecnica**: [causa e soluzione]
**Test effettuati**: [elenco test e risultati]
**Esito**: Approvato / Da rivedere / Fallito
**Decisioni prese**: [decisioni rilevanti]
```

---

### 2026-02-10 — Preparazione: Creazione TestImageContainer

**Stato**: Completato
**Componenti modificati**: `TestImageContainer.tsx`, `eventi-privati.tsx`, `page-defaults.ts`
**Problemi incontrati**: Eccezione panoramiche inizialmente implementata cambiando la base (cover-height) invece di alzare minZoom
**Diagnosi tecnica**: La base deve restare SEMPRE fit-to-width. Per panoramiche si alza minZoom = ceil(containerH/baseH × 100)
**Test effettuati**: Playwright e2e — container si monta, editing funziona, toolbar visibile, cancel ripristina
**Esito**: Approvato
**Decisioni prese**: Logica fit-to-width approvata come modello canonico

---

### 2026-02-12 — Preparazione: Aggiunta overlay controllabile

**Stato**: Completato
**Componenti modificati**: `TestImageContainer.tsx`, `eventi-privati.tsx`
**Problemi incontrati**: Nessuno
**Diagnosi tecnica**: Overlay implementato come div rgba(0,0,0,overlay/100), z-order corretto, persistenza in metadata.overlay
**Test effettuati**: Playwright e2e — slider overlay funziona, reset azzera overlay, cancel ripristina, debug panel mostra valore
**Esito**: Approvato
**Decisioni prese**: Range overlay 0-70%, etichette Nessuna/Leggera/Media/Forte, icona Sun

---

### 2026-02-12 — Analisi: Diagnosi layout e preview mobile

**Stato**: Completato (solo analisi)
**Componenti analizzati**: EditableImage, IPhoneFrame, PublicLayout, tutte le pagine hero
**Problemi incontrati**: Crop hero dinamico (layout fluid + object-cover + vh), preview mobile instabile (altezza dinamica + vh + Tailwind non intercettato), overlay hardcoded bg-black/35 su 7 pagine
**Diagnosi tecnica**: Documentata in `report/DIAGNOSI_LAYOUT_IMMAGINI_PREVIEW.md`
**Test effettuati**: Analisi codice, nessun test automatizzato (solo analisi)
**Esito**: Approvato come diagnosi
**Decisioni prese**: Approccio ibrido raccomandato — consolidare componente prima, poi migrare progressivamente, preview mobile in parallelo

---

### 2026-02-12 — Step 1: Consolidamento componente unico

**Stato**: Completato
**Componenti modificati**: `ImageContainer.tsx` (CREATO), `eventi-privati.tsx` (import aggiornato)
**Problemi incontrati**: Nessuno
**Diagnosi tecnica**: Rename + generalizzazione API da TestImageContainer. Interfaccia `ImageContainerProps`, tipo `ImageContainerSaveData`, hook `useImageMath` tutti esportati. Prop `testIdPrefix` per data-testid configurabili. Logica e comportamento identici al 100%.
**Test effettuati**: Playwright e2e completo — 21 step: mount container, aspect ratio 16/9, editing mode on/off, zoom slider, overlay slider, Media Library button + modale, Reset button, Cancel button, Save button (disabled/enabled), re-enter editing mode, MediaPickerModal open/close
**Esito**: Approvato — tutti i test superati
**Decisioni prese**: TestImageContainer.tsx rimane nel codice come file orfano (nessun import) fino a migrazione completata. Report dettagliato in `report/STEP1_CONSOLIDAMENTO_COMPONENTE.md`

---

*Fine documento — Aggiornare dopo ogni intervento*
