# STEP 4 — Fixed Crop Ratio su Hero Menu

## Data: 12 Febbraio 2026
## Stato: COMPLETATO ✅

---

## Problema Risolto

Riducendo la finestra del browser, l'immagine hero mostrava un crop diverso (più contenuto verticale visibile). L'inquadratura non era stabile, causando perdita di identità visiva.

## Soluzione Implementata

Aggiunta una prop opzionale `fixedCropRatio` a `ImageContainer` e `useImageMath`.

### Meccanismo

Senza `fixedCropRatio` (comportamento originale):
```
overflowY = imgH - containerH     ← containerH cambia col viewport → crop variabile
```

Con `fixedCropRatio` (es. 16/9 = 1.778):
```
cropH = containerW / fixedCropRatio   ← frame virtuale proporzionale alla larghezza
overflowY = imgH - cropH              ← crop stabile: se larghezza dimezza, anche cropH dimezza
coverH = max(cropH, containerH)       ← garantisce copertura completa del container reale
```

Risultato: l'immagine viene sempre croppata come se il container avesse proporzioni 16:9, indipendentemente dall'altezza reale (che resta `h-[60vh]`). Il container reale è sempre coperto (nessun gap).

### Backward Compatibility

- `fixedCropRatio` è **opzionale** — se non passato, `useImageMath` usa `containerH` come prima.
- Nessun breaking change. Tutte le pagine senza `fixedCropRatio` funzionano esattamente come prima.

## File Modificati

| File | Modifica |
|---|---|
| `client/src/components/admin/ImageContainer.tsx` | Aggiunta prop `fixedCropRatio` a interface + destructuring. Passata a `useImageMath`. |
| `client/src/components/admin/ImageContainer.tsx` | `useImageMath`: nuovo parametro opzionale `fixedCropRatio`. Calcolo `cropH` e `coverH` per crop stabile + copertura garantita. |
| `client/src/pages/menu.tsx` | Aggiunto `fixedCropRatio={16/9}` all'ImageContainer della hero. Nessun cambio strutturale. |

## Cosa NON È Cambiato

- Layout della pagina Menu: resta `h-[60vh]` + wrapper `absolute` + intro sotto.
- Nessun max-width globale.
- Nessun max-height.
- Nessuna modifica ad altre pagine.
- Admin editing (pan/zoom/overlay) funziona come prima.

## Test Eseguiti

| Viewport | Hero visibile | Titolo | Intro above-fold | Crop stabile |
|---|---|---|---|---|
| 1920×1080 | ✅ | ✅ "Menù" | ✅ | ✅ (riferimento) |
| 1440×900 | ✅ | ✅ "Menù" | ✅ | ✅ (stesso crop) |
| 1280×720 | ✅ | ✅ "Menù" | ✅ | ✅ (stesso crop) |
| 1024×768 | ✅ | ✅ "Menù" | ✅ | ✅ (stesso crop) |

| Test Admin | Risultato |
|---|---|
| Zoom slider | ✅ funzionante |
| Overlay slider | ✅ funzionante |
| Mode switch (Desktop/Mobile) | ✅ funzionante |
| Save / Cancel | ✅ funzionante |

Confronto con Carta dei Vini (senza fixedCropRatio): hero height simile (~60vh), layout coerente.

## Logica Tecnica Dettagliata

```
useImageMath(containerW, containerH, naturalW, naturalH, zoom, panX, panY, fixedCropRatio?)

1. cropH = fixedCropRatio ? containerW / fixedCropRatio : containerH
   → Frame virtuale: se container è 1920px largo, cropH = 1920/1.778 = 1080px

2. coverH = max(cropH, containerH)
   → Se il container reale è più alto del frame virtuale (es. tablet portrait),
     minZoom alza lo zoom per coprire comunque tutto il container.

3. overflowY = imgH - cropH
   → Il crop è calcolato sul frame virtuale, non sul container reale.
   → Quando la finestra si restringe: containerW scende, cropH scende proporzionalmente,
     overflowY scende proporzionalmente → stessa frazione di immagine visibile → crop stabile.

4. Posizionamento (imgLeft, imgTop) usa containerH reale per centrare nel container fisico.
```

## Rischi e Rollback

| Rischio | Probabilità | Mitigazione |
|---|---|---|
| Crop "troppo panoramico" su tablet portrait dove containerH >> cropH | Bassa | `coverH = max(cropH, containerH)` garantisce copertura; minZoom compensa |
| Differenza percepita tra Menu (crop fisso) e altre pagine (crop variabile) | Media | Temporanea — le altre pagine saranno migrate con lo stesso parametro |
| Admin editing: pan range diverso con fixedCropRatio | Nessuna | Il pan si basa su overflowX/Y che ora usa cropH — l'admin vede esattamente il crop che verrà pubblicato |

**Rollback**: Rimuovere `fixedCropRatio={16/9}` da menu.tsx → torna al comportamento originale. Zero effetti collaterali.
