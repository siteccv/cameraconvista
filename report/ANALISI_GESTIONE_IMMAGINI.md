# Analisi Gestione Immagini nei Container - Camera con Vista

**Data**: 12 Febbraio 2026  
**Tipo**: Analisi architetturale e funzionale  
**Stato**: Solo analisi, nessuna modifica eseguita

---

## 1. Comprensione della Logica Corretta (dal documento allegato)

### Metafora Fondamentale
L'immagine va trattata come se fosse vista **attraverso un foro (container)**:
- Il **container** = finestra fissa, non si muove e non cambia dimensione
- L'**immagine** = sta dietro la finestra, l'admin sceglie quale porzione mostrare

### Stato Zero (Zoom = 1) — DEFINIZIONE UFFICIALE

Questo è lo stato fondamentale da cui tutto parte:

- L'immagine viene renderizzata in **fit-to-width puro**: `larghezza immagine = larghezza container`
- Le proporzioni originali sono **sempre** mantenute
- L'immagine è centrata (orizzontalmente e verticalmente)
- Se l'altezza risultante eccede il container → deborda sopra e sotto (questo è corretto e desiderato)
- Le parti che debordano restano disponibili per il pan (non "perse")
- **Questo stato rappresenta lo zoom minimo assoluto consentito**

### Pan (Riposizionamento) — PRECISAZIONE UFFICIALE SULLE UNITÀ DI OFFSET

L'admin trascina l'immagine in tutte le direzioni per scegliere quale porzione mostrare.

**Definizione corretta delle unità di offset:**

L'offset NON deve essere espresso in:
- ❌ Pixel assoluti (il comportamento cambia al variare delle dimensioni del container)
- ❌ Percentuale rispetto al container (non tiene conto dell'immagine scalata)
- ❌ Percentuale generica indipendente dalla scala (risultato imprevedibile)

L'offset deve essere **relativo allo spazio eccedente reale**:
- La porzione di immagine che eccede il container dopo l'applicazione dello zoom
- Se l'immagine deborda verticalmente di 300px totali → offset Y si muove solo dentro quei 300px
- Se deborda orizzontalmente di 120px totali → offset X si muove solo dentro quei 120px
- L'utente non muove l'immagine in un sistema astratto: sta scegliendo quale parte dello spazio eccedente mostrare

**Clamp dinamico obbligatorio** — calcolato in base a:
- Dimensione reale del container
- Dimensione reale dell'immagine scalata (dopo zoom)
- Livello di zoom attuale

Il clamp NON può essere:
- ❌ Un range fisso (es. ±50)
- ❌ Una formula simmetrica arbitraria (es. `(zoom-100)/2`)
- ❌ Un valore hardcoded

**Risultato atteso**: comportamento identico su qualsiasi device, risultato admin = risultato pubblico, zero zone morte, zero bande vuote, esperienza matematicamente coerente.

**Vincoli di integrità**:
- Non si devono mai vedere bande vuote nel container
- Tutta la superficie reale dell'immagine deve essere raggiungibile
- Nessuna zona morta o irraggiungibile

### Zoom — PRECISAZIONE UFFICIALE

**Principio guida**: lo zoom minimo è lo stato iniziale reale del container (fit-to-width), NON un valore dinamico calcolato per "coprire tutto a tutti i costi".

Regole precise:
- **Zoom minimo = stato zero** (fit-to-width puro)
- **Monodirezionale**: solo ingrandimento rispetto allo stato zero
- **Centro zoom = centro del container** (non punto mouse, non coordinate arbitrarie)
- L'immagine cresce in tutte le direzioni → tutta la nuova area è esplorabile tramite pan
- Il clamp continua a funzionare sempre, anche durante lo zoom
- Deve essere **continuo e matematicamente coerente**

Cosa lo zoom NON deve fare:
- ❌ Permettere di rimpicciolire sotto lo stato zero
- ❌ Creare bande vuote
- ❌ Far diventare l'immagine più stretta del container
- ❌ Dipendere da logiche `object-cover` implicite

**Caso limite — immagini molto panoramiche** (larghezza >> altezza):
Se con fit-to-width l'altezza risultante è *inferiore* al container (caso raro), allora la soglia minima di zoom deve essere alzata per impedire bande vuote verticali. Ma questo è l'unico caso di eccezione. Il principio resta: la base è fit-to-width, non cover.

### Vincolo Universale
Il sistema deve funzionare identicamente per:
- Immagini verticali, orizzontali, quadrate, panoramiche estreme
- Immagini molto piccole o molto grandi
- **Zero**: zone morte, zone irraggiungibili, distorsioni, crop logici nascosti
- Solo overflow naturale controllato

### Considerazione Architetturale Chiave
**Il modale di editing DEVE replicare esattamente il container reale** (dimensioni, aspect ratio, CSS, comportamento), altrimenti ciò che l'admin vede nell'anteprima non corrisponderà al risultato finale sul sito. L'opzione raccomandata è: gestione diretta nel container reale con toolbar overlay (WYSIWYG vero).

---

## 2. Stato Attuale del Codice - Problemi Identificati

### 2.1 Componenti Coinvolti

| Componente | Container | Uso |
|---|---|---|
| `EditableImage.tsx` | Hero page blocks | Tutte le pagine pubbliche (home, eventi, galleria, cocktail bar, dove siamo, etc.) |
| `EventModal.tsx` | Poster evento (9:16) | Admin editing poster evento |
| `ImageZoomModal.tsx` | Gallery images (9:16) | Admin editing immagini album galleria |
| `GallerySlideViewer.tsx` | Viewer slide (9:16) | Visualizzazione pubblica galleria |
| `GalleryModal.tsx` | Cover album | Admin editing cover album |
| `galleria.tsx` | Cover album (3:4) | Pagina pubblica galleria |
| `eventi.tsx` | Poster card (9:16) | Pagina pubblica eventi |
| `event-detail.tsx` | Poster dettaglio (9:16) | Pagina dettaglio evento |
| `AlbumImagesModal.tsx` | Thumbnail album (9:16) | Admin lista immagini album |

---

### 2.2 EditableImage.tsx - Problemi Specifici

**Problema 1: Unità di misura inconsistenti tra modale e sito**
- **Nel modale**: offset X/Y vengono calcolati e applicati in **pixel** (`translate(${offsetX}px, ${offsetY}px)`)
- **Sul sito pubblico**: stessa cosa, pixel (`translate(${displayOffsetX}px, ${displayOffsetY}px)`)
- **Ma**: il modale ha dimensioni completamente diverse dal container reale sul sito. Il modale usa un aspect ratio catturato al click (`previewAspect`), ma il frame nel modale ha una dimensione fisica diversa dal container reale. Quindi lo stesso valore in pixel produce un posizionamento diverso.

**Problema 2: Due modalità di rendering per zoom ≥100 e zoom <100**
```
zoom >= 100 → object-cover + scale + translate(px)
zoom < 100  → dimensioni esplicite calcolate + posizione left/top
```
Questa doppia logica crea discontinuità nel comportamento. Lo switch avviene a zoom=100, dove i due sistemi dovrebbero dare lo stesso risultato ma non è garantito.

**Problema 3: Assenza di clamp nel pan**
- `handleMouseMove` e `handleTouchMove` applicano offset senza alcun vincolo:
  ```js
  setOffsetX(dragStartOffset.current.x + dx / s);
  setOffsetY(dragStartOffset.current.y + dy / s);
  ```
- Nessun clamp ai bordi → l'admin può trascinare l'immagine fuori dal container, creando **bande vuote**
- Viola il principio fondamentale del documento: "Non si devono mai vedere bande vuote"

**Problema 4: Zoom minimo basato su logica sbagliata**
- `fitZoom` è calcolato come `containScale / coverScale * 100`, che è il valore dove l'intera immagine è visibile ("contain")
- Lo slider parte da `fitZoom` (o 10), quindi permette valori dove l'immagine è più piccola del container → bande vuote ai lati
- **Logica corretta**: lo zoom minimo deve essere lo **stato zero** = fit-to-width puro (larghezza immagine = larghezza container). La base non è "cover" né "contain", è fit-to-width. L'unica eccezione: se un'immagine panoramica estrema produce un'altezza inferiore al container con fit-to-width, allora il minimo va alzato per evitare bande verticali.

**Problema 5: Mismatch modale ↔ container reale**
- Il modale cattura l'aspect ratio del container reale al momento del click (`previewAspect`)
- Ma le dimensioni fisiche del frame nel modale sono diverse (il modale è largo ~max-w-2xl = 672px, il container reale può essere full-width)
- Gli offset sono in pixel, quindi lo stesso valore pixel su un modale di 400px e un container di 1200px dà risultati completamente diversi
- **Questo è il problema architetturale principale segnalato nel documento**

**Problema 6: `object-cover` sovrappone la logica**
- Quando zoom ≥ 100, l'immagine usa `object-cover` + `scale(s)`. Questo significa che `object-cover` fa già un crop/scale iniziale (per coprire il container), e poi scale viene applicato sopra
- L'effetto di zoom parte da object-cover (che già zooma per coprire), non dalla dimensione reale dell'immagine
- Questo rende impossibile il fit-to-width puro descritto nel documento

---

### 2.3 EventModal.tsx (Poster) - Problemi Specifici

**Problema 1: Container modale diverso dal container reale**
- Modale: `aspect-[9/16] w-48` (192px × 341px circa)
- Pagina pubblica `eventi.tsx`: nessun zoom/offset applicato! La card pubblica usa solo `object-cover` senza transform
- Pagina `event-detail.tsx`: `aspect-[9/16]` con transform applicato ma dimensioni diverse dal modale

**Problema 2: Offset in percentuale (diverso da EditableImage)**
- Poster usa `translate(${offsetX}%, ${offsetY}%)` (percentuale)
- EditableImage usa `translate(${offsetX}px, ${offsetY}px)` (pixel)
- Due sistemi diversi per la stessa operazione logica

**Problema 3: Zoom min = 50 (dovrebbe essere 100)**
- Slider zoom: `min={50} max={200}`
- Permette di rimpicciolire il poster dentro il container → bande vuote
- Secondo il documento: zoom minimo = 1 (100%), mai più stretto del container

**Problema 4: Offset range fisso ±50 senza clamp dinamico**
- Slider offset: `min={-50} max={50}` (percentuale)
- Il range è fisso indipendentemente dal livello di zoom
- A zoom 100% con offset -50%, metà del container è vuoto
- Non c'è clamp dinamico che limiti l'offset in base allo zoom attuale

**Problema 5: Poster non applica zoom/offset nella card pubblica**
- In `eventi.tsx` riga 235: `style={{ transformOrigin: "center center" }}` - nessun zoom/offset applicato
- Il poster salvato con zoom/offset nel modale admin NON viene visualizzato con quegli stessi valori nella lista pubblica

---

### 2.4 ImageZoomModal.tsx (Gallery) - Problemi Specifici

**Problema 1: Container fisso max-w-[200px] aspect-[9/16]**
- Sempre 200px di larghezza indipendentemente dall'immagine o dalla destinazione
- Il container reale nel GallerySlideViewer ha dimensioni molto diverse (`maxHeight: min(70vh, calc(100vh - 280px))`)

**Problema 2: Clamp simmetrico semplicistico**
- `maxOffset = (zoom - 100) / 2` → range ±maxOffset
- Questo assume che l'immagine deborda simmetricamente in tutte le direzioni
- Non tiene conto delle proporzioni reali dell'immagine rispetto al container
- Un'immagine molto alta ha più spazio di pan verticale che orizzontale, ma il clamp è lo stesso per entrambi gli assi

**Problema 3: Pan disabilitato a zoom ≤ 100**
- `if (zoom <= 100) return;` nel mouseDown
- Ma un'immagine verticale in un container 9:16 potrebbe avere la parte inferiore nascosta anche a zoom 100%
- Secondo il documento, il pan deve essere sempre disponibile se l'immagine deborda dal container in qualsiasi direzione

---

### 2.5 GallerySlideViewer.tsx / galleria.tsx / AlbumImagesModal.tsx - Rendering Pubblico

Tutti usano la stessa formula di transform:
```js
transform: `scale(${zoom / 100}) translate(${offsetX}%, ${offsetY}%)`
```
Con `object-cover` sulla img. Questo è coerente tra di loro, ma il problema è che i valori vengono editati in modali con dimensioni diverse → il risultato visivo non corrisponde.

---

## 3. Mappa delle Inconsistenze

### 3.1 Unità di Offset

| Componente | Unità Offset | Calcolo |
|---|---|---|
| EditableImage (modale + sito) | **pixel** | `translate(Xpx, Ypx)` |
| EventModal poster | **percentuale** | `translate(X%, Y%)` |
| ImageZoomModal gallery | **percentuale** | `translate(X%, Y%)` |
| GallerySlideViewer | **percentuale** | `translate(X%, Y%)` |
| Gallery covers | **percentuale** | `translate(X%, Y%)` |

**Problema**: Nessuna di queste unità è corretta. L'offset deve essere **relativo allo spazio eccedente reale** dell'immagine scalata rispetto al container. Il pixel assoluto dipende dalle dimensioni fisiche del container (cambia su device diversi). La percentuale generica non tiene conto del rapporto reale immagine/container dopo lo zoom. L'unica unità corretta è lo spostamento dentro lo spazio di overflow reale, calcolato dinamicamente in base a: dimensioni container, dimensioni immagine scalata, livello di zoom.

### 3.2 Zoom Minimo

Il valore corretto è: **fit-to-width** (larghezza immagine = larghezza container). Eccezione: se fit-to-width produce altezza < container, il minimo va alzato.

| Componente | Zoom Min Attuale | Corretto? |
|---|---|---|
| EditableImage | `fitZoom` (contain-based, può essere <100) | NO - logica sbagliata, base "contain" non "fit-to-width" |
| EventModal poster | 50 (valore fisso) | NO - permette rimpicciolimento sotto lo stato zero |
| ImageZoomModal gallery | 100 (valore fisso) | NO - non calcolato su fit-to-width reale, valore arbitrario |

### 3.3 Clamp Pan

| Componente | Clamp | Corretto? |
|---|---|---|
| EditableImage | Nessuno | NO - offset libero, bande vuote possibili |
| EventModal poster | Range fisso ±50 | NO - non dinamico rispetto a zoom |
| ImageZoomModal gallery | `(zoom-100)/2` simmetrico | PARZIALMENTE - non considera proporzioni immagine |

---

## 4. Riepilogo dei Problemi Fondamentali

### P1 - Mismatch Modale ↔ Container Reale (CRITICO)
I modali di editing hanno dimensioni e proporzioni diverse dai container reali sul sito. Ciò che l'admin vede nell'anteprima non corrisponde al risultato finale. Questo è il problema architetturale principale.

### P2 - Assenza di Clamp Corretto (CRITICO)
Il pan non è limitato correttamente ai bordi dell'immagine. L'admin può trascinare l'immagine fuori dal container, creando aree vuote.

### P3 - Unità di Misura Tutte Sbagliate (GRAVE)
EditableImage usa pixel, gli altri componenti usano percentuali generiche. Ma **nessuna delle due è corretta**. L'offset deve essere relativo allo spazio eccedente reale dell'immagine scalata rispetto al container, calcolato dinamicamente in base a dimensioni container, dimensioni immagine, e livello di zoom. I pixel dipendono dal device, le percentuali generiche non tengono conto del rapporto reale immagine/container.

### P4 - Zoom Minimo Basato su Logica Sbagliata (GRAVE)
Il valore minimo di zoom è calcolato con logiche errate ("contain", valori fissi arbitrari). La base corretta è **fit-to-width puro** (larghezza immagine = larghezza container). Lo zoom deve essere monodirezionale (solo ingrandimento) a partire da questo stato zero. Unica eccezione: immagini panoramiche estreme dove fit-to-width produce altezza < container.

### P5 - Doppia Logica di Rendering (MEDIO)
EditableImage ha due branch di rendering (zoom ≥100 con object-cover vs zoom <100 con dimensioni calcolate) che possono produrre discontinuità.

### P6 - Poster Pubblico Non Applica Zoom/Offset (BUG)
Nella lista eventi pubblica (`eventi.tsx`), il poster non applica i valori zoom/offset salvati dall'admin.

---

## 5. Approccio Raccomandato dal Documento

Il documento indica chiaramente che la soluzione ottimale è:

**Opzione 2 - Gestione diretta nel container reale con toolbar overlay**
- L'admin lavora direttamente sul container reale con le sue proporzioni e responsività
- Toolbar flottante attiva solo in modalità admin
- WYSIWYG reale, zero discrepanze, nessuna doppia logica

Il modale è accettabile SOLO se replica esattamente il container (dimensioni, ratio, CSS, comportamento).

---

## 6. Proposta per Test su Singolo Container

Per il prossimo step (implementazione test su un singolo container), si suggerisce di scegliere **EditableImage** (hero delle pagine) perché:
1. È il componente più complesso e con più problemi
2. È usato su tutte le pagine pubbliche
3. Ha già la struttura WYSIWYG (l'admin clicca sull'immagine nel container reale)
4. Risolverlo crea il pattern base per tutti gli altri container

La logica corretta da implementare:
1. **Stato zero**: fit-to-width puro (larghezza img = larghezza container), centrata, proporzioni mantenute
2. **Zoom min = stato zero**: monodirezionale (solo ingrandimento), centrato sul centro del container, continuo e matematicamente coerente. Eccezione: se fit-to-width produce altezza < container (immagine panoramica estrema), alzare il minimo per evitare bande verticali
3. **Zoom NON deve**: dipendere da `object-cover`, usare logiche "contain" o "cover", permettere rimpicciolimento sotto lo stato zero
4. **Pan con clamp**: offset limitato ai bordi reali dell'immagine scalata, calcolato in base a zoom e dimensioni immagine/container. Le bande vuote non devono mai apparire
5. **Unità normalizzate**: usare percentuali relative alle dimensioni del container per garantire coerenza tra editing e visualizzazione, indipendentemente dal device o dimensione modale
6. **Editing nel container reale**: l'admin interagisce direttamente con l'immagine nel container della pagina, non in un modale separato
7. **Coerenza totale**: il sistema deve essere identico tra admin e sito pubblico, indipendente dal device, indipendente dalle dimensioni del modale

---

## 7. Test Container Implementato — TestImageContainer.tsx

**Data implementazione**: 12 Febbraio 2026  
**Stato**: Implementato e testato, operativo sulla pagina Eventi Privati

### Posizione
Pagina Eventi Privati → sezione tra hero/intro e pacchetti  
Visibile sia in admin preview che in modalità pubblica

### Componente
`client/src/components/admin/TestImageContainer.tsx`

### Matematica Implementata (hook `useImageMath`)

```
Inputs: containerW, containerH, naturalW, naturalH, zoom, panX, panY

1. fit-to-width SEMPRE: baseW = containerW, baseH = containerW × (naturalH / naturalW)
2. Caso panoramiche: se baseH < containerH → minZoom = ceil(containerH / baseH × 100)
   altrimenti minZoom = 100
3. effectiveZoom = max(minZoom, zoom), zoomFactor = effectiveZoom / 100
4. imgW = baseW × zoomFactor, imgH = baseH × zoomFactor
5. overflowX = max(0, imgW - containerW), overflowY = max(0, imgH - containerH)
6. clamp panX/panY a [-100, +100], azzerato se overflow = 0
7. translateX = (panX/100) × (overflowX/2), translateY = (panY/100) × (overflowY/2)
8. imgLeft = (containerW - imgW)/2 + translateX
9. imgTop = (containerH - imgH)/2 + translateY
```

### Drag → Pan (conversione pixel → unità normalizzate)
```
dx pixel mouse → dpanX = dx × 200 / overflowX
dy pixel mouse → dpanY = dy × 200 / overflowY
```
Se overflow è 0 su un asse, il pan è bloccato (niente bande vuote).

### Caratteristiche
- ✅ Stato zero = fit-to-width puro (con eccezione panoramiche)
- ✅ Zoom monodirezionale (min = 100, max = 300)
- ✅ Clamp dinamico reale (basato su overflow effettivo)
- ✅ Nessuna dipendenza da object-cover
- ✅ Nessuna doppia logica di rendering
- ✅ Posizionamento esplicito (left/top/width/height)
- ✅ Offset normalizzato [-100, +100] (device-indipendente)
- ✅ WYSIWYG: editing diretto nel container reale (no modale separato)
- ✅ Toolbar overlay con zoom slider + media picker
- ✅ Debug info panel (dimensioni container, immagine, overflow, zoom, pan)
- ✅ Media Library integrata (no immagini hardcoded)
- ✅ Rendering identico admin/pubblico (stessa funzione `useImageMath`)

### Storage (campi DB riutilizzati)
- `imageUrl` → URL immagine
- `imageScaleDesktop` → zoom (100 = stato zero)
- `imageOffsetX` → panX normalizzato (-100 a +100)
- `imageOffsetY` → panY normalizzato (-100 a +100)

### Prossimi passi
1. Validare con immagini reali di diversi aspect ratio (verticali, orizzontali, panoramiche, quadrate)
2. Verificare coerenza admin ↔ pubblico con dati salvati
3. Se validato, procedere con refactoring completo di tutti i componenti immagine

---

## 8. Controllo Oscurazione (Overlay) — Implementato

**Data implementazione**: 12 Febbraio 2026  
**Stato**: Implementato nel TestImageContainer

### Funzionalità
Slider per controllare l'intensità dell'oscurazione (overlay nero) sopra l'immagine.

### Specifiche tecniche
- **Range**: 0–70 (percentuale opacità del nero)
- **Etichette dinamiche**: Nessuna (0), Leggera (1-20), Media (21-45), Forte (46-70)
- **Max 70%**: limite pratico — oltre il 70% l'immagine diventa invisibile
- **Rendering**: `<div>` con `backgroundColor: rgba(0,0,0, overlay/100)` sopra l'immagine, sotto i children/testo
- **Z-order**: immagine → overlay → children (testo) → toolbar admin
- **Persistenza**: salvato in `metadata.overlay` del page_block (campo JSONB)
- **Reset**: il bottone Reset azzera anche l'overlay a 0
- **Admin/Pubblico**: identico rendering (stesso valore letto da metadata)

### Icona toolbar
Sun (lucide-react) — rappresenta la luminosità/oscurità dell'immagine

### Children slot
Aggiunto `children` prop al componente per permettere overlay di testi/contenuti sopra l'immagine. I children vengono renderizzati sopra l'overlay (z-10), così il testo beneficia dell'oscurazione sottostante.

---

## 9. Valutazione Strategica: Estensione a Tutto il Sito

### Stato attuale dei componenti immagine nel progetto

| Componente | Dove usato | Logica zoom/pan | Overlay |
|---|---|---|---|
| **EditableImage** | Hero tutte le pagine, spazi eventi privati | object-cover + scale/translate CSS | No (hardcoded in pagine) |
| **EventModal** | Poster eventi (admin) | Modale separato con zoom/offset | No |
| **ImageZoomModal** | Galleria album (admin) | Modale separato con zoom/offset | No |
| **TestImageContainer** ✅ | Eventi Privati (test) | fit-to-width + overflow clamp | Sì (0-70, slider) |

### Opzione A — Applicazione incrementale "a richiesta"

**Approccio**: Mantenere TestImageContainer come componente separato e applicarlo progressivamente, container per container, dove serve.

**Pro**:
- Zero rischio di regressioni sulle pagine esistenti
- Ogni pagina può essere migrata e testata individualmente
- Se un container ha problemi, gli altri non sono influenzati
- Controllo totale su tempi e priorità

**Contro**:
- Due logiche di rendering diverse coesistono nel codice (vecchia object-cover + nuova fit-to-width)
- Manutenzione doppia: bug fix da applicare in due posti
- Possibili inconsistenze visive tra pagine migrate e non migrate
- Il codice legacy rimane nel progetto a tempo indefinito
- Ogni migrazione richiede lavoro manuale (copia/adatta parametri)

**Rischi**:
- Rischio basso a breve termine, rischio alto a lungo termine (debito tecnico crescente)
- Rischio medio di dimenticare quali container usano quale logica

### Opzione B — Consolidamento come componente unico riusabile

**Approccio**: Trasformare la logica di TestImageContainer in un componente `ImageContainer` generico, con API pulita, e sostituire progressivamente tutti gli usi di EditableImage/modali zoom.

**Pro**:
- Una sola logica di rendering per tutto il sito
- Bug fix e miglioramenti applicati ovunque automaticamente
- Coerenza visiva garantita tra tutte le pagine
- Overlay, zoom, pan tutti gestiti dallo stesso componente
- Il codice diventa più pulito e manutenibile
- Eliminazione dei modali separati per zoom/pan

**Contro**:
- Richiede refactoring di tutte le pagine (8 pagine + eventi + galleria)
- Rischio di regressioni durante il refactoring
- Richiede test approfonditi su ogni pagina dopo la migrazione
- Necessità di gestire la retrocompatibilità dei dati salvati (vecchi offset → nuovi offset normalizzati)
- Il formato dei dati cambia: i vecchi imageOffsetX/Y (non normalizzati) devono essere convertiti o ignorati

**Rischi**:
- Rischio medio durante il refactoring (mitigabile con migrazione una pagina alla volta)
- Rischio basso di incompatibilità dati (i valori precedenti possono essere resettati a 0 se non convertibili)

### Raccomandazione tecnica

**Opzione B è la scelta migliore**, ma va implementata con una strategia di migrazione progressiva (non big-bang):

1. **Fase 1**: Consolidare TestImageContainer → `ImageContainer` (componente finale con API stabile)
2. **Fase 2**: Migrare gli hero delle pagine uno alla volta (partendo da quella con meno traffico)
3. **Fase 3**: Migrare EventModal e ImageZoomModal
4. **Fase 4**: Rimuovere il vecchio EditableImage e le logiche legacy

Ogni fase è testabile e reversibile. La conversione dei dati può essere gestita con un fallback: se `imageScaleDesktop` è inferiore a 100 (vecchio formato scale), trattarlo come 100 (stato zero) nel nuovo sistema.

### ⚠️ Nota importante
Questa è un'analisi tecnica. La decisione finale su quale opzione seguire spetta all'utente.
