# Diagnosi Post-Rollback: Hero Menu

## Data: 12 Febbraio 2026
## Stato: ROLLBACK COMPLETATO + VERIFICA OK

---

## 1. ROLLBACK ESEGUITO

La hero della pagina Menu è stata riportata alla struttura identica alle altre pagine:

```jsx
<div className="min-h-[calc(100vh-80px)] flex flex-col">
  <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
    <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
      <ImageContainer containerClassName="w-full h-full" aspectRatio="auto" ... />
    </div>
  </section>
  <section className="flex-1 flex items-center justify-center">
    <!-- intro text -->
  </section>
</div>
```

Identica a Carta dei Vini, Cocktail Bar, Eventi.

## 2. VERIFICA DI CONTROLLO

Test Playwright su 4 pagine (1280×720):

| Pagina | Hero visibile | Titolo centrato | Intro above-the-fold | Altezza hero ~60vh |
|---|---|---|---|---|
| Menu | ✅ | ✅ "Menù" | ✅ | ✅ (~60%) |
| Carta dei Vini | ✅ | ✅ | ✅ | ✅ (~60%) |
| Cocktail Bar | ✅ | ✅ | ✅ | ✅ (~60%) |
| Eventi | ✅ | ✅ | ✅ | ✅ (~60%) |

Resize su Menu (1920×1080 → 1024×768 → 768×1024): hero e intro sempre visibili.

**Conclusione**: Le 4 pagine sono ora visivamente coerenti.

---

## 3. DIAGNOSI: COSA HA CAUSATO I PROBLEMI

### 3.1 Perché la hero era troppo piccola (intervento 5/2 + max-height)

L'intervento precedente ha introdotto due vincoli sovrapposti:
- **`aspectRatio="5/2"`**: A 1440px di larghezza, produce un'altezza di 576px — circa il 53% della viewport su un monitor Full HD. Molto meno dell'originale 60vh (= 648px a 1080p).
- **`max-height: 600px`**: Un ulteriore vincolo che impediva alla hero di superare i 600px.
- **Rimozione di `h-[60vh]`**: Eliminando il vincolo di altezza basato sul viewport, l'altezza dipendeva solo dall'aspect ratio, che su finestre più strette produceva hero troppo basse.
- **Rimozione del wrapper `absolute inset-y-0`**: Il container non si estendeva più per l'intera altezza della section, perdendo la struttura "incorniciata".

**Risultato**: Hero drasticamente più bassa delle altre pagine, con troppo spazio vuoto sotto.

### 3.2 Perché l'effetto "vedo più immagine al resize" è rimasto

L'effetto **non è legato all'aspect ratio** ma alla logica interna di `useImageMath` in ImageContainer. Ecco il meccanismo:

```
Base di calcolo: fit-to-width
  baseW = containerW (larghezza container)
  baseH = containerW × (naturalH / naturalW) (altezza proporzionale)

Se baseH < containerH → minZoom sale per coprire l'altezza
Se baseH > containerH → zoom 100%, l'immagine è più alta del container → crop verticale
```

Con `h-[60vh]`:
- **Finestra larga** (1920×1080): containerW=1920, containerH=648. Per un'immagine 4:3, baseH=1440 >> 648 → forte crop verticale → si vede una "striscia" stretta dell'immagine.
- **Finestra stretta** (1024×768): containerW=1024, containerH=461. baseH=768 → meno crop → si vede più immagine.

Il rapporto `containerH / baseH` cambia perché **l'altezza è in vh (proporzionale all'altezza del viewport)** ma la **larghezza segue il viewport in modo indipendente**. Quando si restringe la finestra mantenendo un'altezza simile, il container diventa "meno panoramico" e il crop si riduce.

**Questo effetto è intrinseco a qualsiasi sistema `h-[Xvh]` con fit-to-width.** È lo stesso identico comportamento di Carta dei Vini, Cocktail Bar, Eventi. Non è una regressione — è il comportamento "storico" del progetto.

---

## 4. PROPOSTA CORRETTA

### 4.1 Obiettivo

1. Menu **identico** alle altre pagine come dimensione/layout percepito ✅ (già raggiunto col rollback)
2. Inquadratura stabile al variare della finestra (eliminare l'effetto "vedo più immagine")
3. **Nessun** max-width globale o cambio strutturale al layout in questa fase
4. Margini laterali "premium" come step separato futuro

### 4.2 Soluzione: Aspect Ratio Fisso CON Altezza di Riferimento

Il problema è che `h-[60vh]` produce un container le cui **proporzioni cambiano** al resize. La soluzione corretta è:

**Mantenere `h-[60vh]` come altezza** (per coerenza con le altre pagine) **MA forzare l'aspect ratio dell'immagine renderizzata** dentro ImageContainer.

Concretamente, il container rimane `h-[60vh]` (come tutte le altre pagine), ma ImageContainer deve renderizzare l'immagine come se il container avesse sempre le stesse proporzioni — indipendentemente dalla larghezza reale.

### 4.3 Come implementarlo

Modificare `useImageMath` per accettare un parametro opzionale `fixedAspectRatio` (es. "16/9" o "2.5/1"). Quando presente:

```
Invece di:
  baseH = containerW × (naturalH / naturalW)

Calcolare:
  virtualContainerH = containerW / fixedAspectRatio
  usare virtualContainerH al posto di containerH per il calcolo del crop
```

In questo modo:
- **Il container rimane `h-[60vh]`** → identico alle altre pagine
- **L'immagine viene croppata come se il container fosse sempre 16:9** (o il ratio scelto) → crop stabile al resize
- **Nessun cambio di layout**, nessun max-width, nessun refactor
- **Applicabile pagina per pagina** senza toccare le altre

### 4.4 Parametro proposto

```
fixedCropRatio: numero (es. 16/9 = 1.778, o 2.5 per 5:2)
```

- Opzionale — se non fornito, ImageContainer usa il comportamento attuale (basato su containerH reale)
- Se fornito, il crop dell'immagine viene calcolato usando `containerW / fixedCropRatio` come altezza virtuale
- Il container mantiene le sue dimensioni CSS reali (h-[60vh])

### 4.5 Rischi

| Rischio | Probabilità | Mitigazione |
|---|---|---|
| L'immagine potrebbe non coprire il container se containerH reale > virtualH | Bassa | minZoom compensa automaticamente |
| Differenza visiva tra Menu (crop fisso) e altre pagine (crop variabile) | Media | Accettabile temporaneamente, le altre pagine saranno migrate dopo |
| Complicazione di useImageMath | Bassa | Singolo parametro opzionale, nessun breaking change |

### 4.6 Piano

1. **Fase A**: Aggiungere prop `fixedCropRatio` a ImageContainer + useImageMath (modifica backward-compatible)
2. **Fase B**: Applicare su Menu hero con ratio scelto (es. 16/9)
3. **Fase C**: Test (resize desktop, admin editing, pubblico)
4. **Fase D**: Validazione con utente
5. **Fasi future**: Estendere alle altre pagine + valutare margini laterali premium

---

## 5. RIEPILOGO

| Domanda | Risposta |
|---|---|
| Cosa ha causato la hero troppo piccola? | `aspectRatio="5/2"` + `max-height: 600px` + rimozione di `h-[60vh]` |
| Cosa ha causato "vedo più immagine"? | Comportamento intrinseco di `h-[Xvh]` con fit-to-width — presente su TUTTE le pagine, non è una regressione |
| La soluzione corretta? | Mantenere `h-[60vh]` (coerenza) + aggiungere crop ratio fisso dentro ImageContainer (stabilità inquadratura) |
| Serve max-width globale? | Non in questa fase |
| Serve toccare altre pagine? | No, solo Menu come test |
