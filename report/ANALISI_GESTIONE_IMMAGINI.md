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

### Stato Iniziale (Zoom = 1 / 100%)
- L'immagine mantiene le proporzioni originali
- Viene adattata in modalità **fit-to-width**: larghezza immagine = larghezza container
- L'altezza risultante dipende dal formato dell'immagine (può debordare sopra/sotto)
- Centrata orizzontalmente e verticalmente
- Le parti che debordano restano disponibili per il pan (non "perse")

### Pan (Riposizionamento)
- L'admin trascina l'immagine in tutte le direzioni
- **Vincolo clamp**: non si devono mai vedere bande vuote nel container
- Tutta la superficie reale dell'immagine deve essere raggiungibile
- Nessuna zona morta o irraggiungibile

### Zoom
- Zoom minimo = 1 (mai più stretta del container, mai bande laterali)
- Solo ingrandimento rispetto allo stato iniziale
- Centro zoom = centro del container
- L'immagine cresce in tutte le direzioni → tutta la nuova area è esplorabile tramite pan
- Il clamp funziona sempre, anche durante lo zoom

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

**Problema 4: Zoom minimo permette valori sotto il cover**
- `fitZoom` è calcolato come `containScale / coverScale * 100`, che è il valore dove l'intera immagine è visibile
- Lo slider parte da `fitZoom` (o 10), quindi permette valori dove l'immagine è più piccola del container → bande vuote ai lati
- Secondo il documento, zoom minimo = 1 (cioè fit-to-width, dove larghezza immagine = larghezza container). Non dovrebbero mai esserci bande laterali.

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

**Problema**: L'offset in pixel dipende dalle dimensioni del container → cambia effetto su schermi diversi. L'offset in percentuale è relativo alla dimensione dell'elemento scalato → più prevedibile ma comunque non tiene conto del rapporto immagine/container.

### 3.2 Zoom Minimo

| Componente | Zoom Min | Corretto? |
|---|---|---|
| EditableImage | `fitZoom` (può essere <100) | NO - permette bande vuote |
| EventModal poster | 50 | NO - permette rimpicciolimento |
| ImageZoomModal gallery | 100 | PARZIALMENTE - corretto se l'immagine copre il container a 100% |

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

### P3 - Unità di Misura Inconsistenti (GRAVE)
EditableImage usa pixel per gli offset, gli altri componenti usano percentuali. Due sistemi diversi per la stessa operazione.

### P4 - Zoom Minimo Scorretto (GRAVE)
Il valore minimo di zoom permette di rendere l'immagine più piccola del container, violando il principio "niente bande vuote".

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
1. **Stato iniziale**: fit-to-width (larghezza img = larghezza container), centrata
2. **Zoom min**: il valore che garantisce nessuna banda vuota (fit-to-cover o fit-to-width, il maggiore dei due)
3. **Pan con clamp**: offset limitato ai bordi reali dell'immagine scalata, calcolato in base a zoom e dimensioni immagine/container
4. **Unità normalizzate**: usare percentuali relative alle dimensioni del container per garantire coerenza tra editing e visualizzazione
5. **Editing nel container reale**: l'admin interagisce direttamente con l'immagine nel container della pagina, non in un modale separato
