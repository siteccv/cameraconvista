# STEP 2 — Aggiunta Gestione Mobile Indipendente

## Data: 12 Febbraio 2026
## Stato: COMPLETATO

---

## Cosa è stato fatto

1. **Esteso `ImageContainerProps`** con 4 nuove props opzionali:
   - `zoomMobile` — zoom per mobile (fallback: zoom desktop)
   - `panXMobile` — pan X per mobile (fallback: panX desktop)
   - `panYMobile` — pan Y per mobile (fallback: panY desktop)
   - `overlayMobile` — overlay per mobile (fallback: overlay desktop)

2. **Esteso `ImageContainerSaveData`** con 4 nuovi campi:
   - `zoomMobile`, `panXMobile`, `panYMobile`, `overlayMobile`

3. **Aggiunto switch Desktop/Mobile nella toolbar admin**:
   - Due pulsanti (Monitor icon + Smartphone icon) con evidenziazione attiva
   - Lo switch è visibile solo in editing mode
   - L'editing inizia sempre in Desktop mode
   - data-testid: `image-container-mode-switch`, `image-container-mode-desktop`, `image-container-mode-mobile`

4. **Logica di isolamento completa**:
   - Zoom slider modifica solo i valori del mode attivo
   - Overlay slider modifica solo i valori del mode attivo
   - Pan (drag) modifica solo i valori del mode attivo
   - Scroll wheel modifica solo i valori del mode attivo
   - Reset azzera solo i valori del mode attivo
   - Cancel ripristina TUTTI i valori (desktop + mobile)
   - Save persiste TUTTI i valori (desktop + mobile)

5. **Logica display pubblico**:
   - `isMobileDisplay = forceMobileLayout || viewportIsMobile`
   - Se mobile: usa zoom/pan/overlay mobile
   - Se desktop: usa zoom/pan/overlay desktop

6. **Aggiornato eventi-privati.tsx**:
   - Passa le 4 nuove props mobile all'ImageContainer
   - Il save handler persiste tutti i campi nel DB (imageScaleMobile, imageOffsetXMobile, imageOffsetYMobile, metadata.overlayMobile)

7. **Debug panel aggiornato**: mostra il mode attivo (Desktop/Mobile) come primo campo

## File toccati

| File | Azione | Dettaglio |
|---|---|---|
| `client/src/components/admin/ImageContainer.tsx` | MODIFICATO | Aggiunto stato mobile, switch, logica dual-mode |
| `client/src/pages/eventi-privati.tsx` | MODIFICATO | Props mobile + save handler aggiornato |

## Esito test

Tutti i test obbligatori superati (Playwright e2e — 26 step):

| Test | Esito |
|---|---|
| Desktop mode attivo di default all'apertura | ✅ |
| Mode switch visibile con Desktop/Mobile buttons | ✅ |
| Debug panel mostra "Desktop" | ✅ |
| Reset su Desktop azzera solo valori desktop | ✅ |
| Switch a Mobile mantiene valori desktop | ✅ |
| Debug panel mostra "Mobile" dopo switch | ✅ |
| Zoom slider in Mobile modifica solo zoom mobile | ✅ |
| Switch Desktop→Mobile→Desktop preserva valori | ✅ |
| Desktop zoom rimane 100 dopo modifica mobile (z:206) | ✅ |
| Mobile zoom preservato dopo switch back (z:206) | ✅ |
| Save persiste entrambi i set | ✅ |
| Riapertura editor: Desktop=100, Mobile=206 | ✅ |
| Cancel chiude editor senza persistere | ✅ |

## Problemi trovati e come sono stati risolti

Nessun problema riscontrato. L'architettura con stato separato (editZoom/editZoomMobile) e mode switch funziona correttamente al primo tentativo.

## Rischi residui

- **Fallback mobile→desktop**: Se le props mobile non vengono passate, il componente usa i valori desktop come fallback. Questo è corretto per backward compatibility, ma significa che al primo utilizzo di un ImageContainer senza props mobile, i valori mobile saranno identici ai desktop finché non vengono editati separatamente.
- **Media select resetta entrambi i set**: Quando si seleziona una nuova immagine dalla Media Library, sia desktop che mobile vengono resettati a zoom=100, pan=0,0. Questo è il comportamento corretto (nuova immagine = ricominciare da zero su entrambi i device).

## Architettura interna

```
State:
  editZoom, editPanX, editPanY, editOverlay           → valori desktop in editing
  editZoomMobile, editPanXMobile, editPanYMobile, editOverlayMobile → valori mobile in editing
  editingMode: "desktop" | "mobile"                     → quale set è attualmente in editing

Display (non editing):
  isMobileDisplay = forceMobileLayout || viewportIsMobile
  activeZoom = isMobileDisplay ? effectiveZoomMobile : propZoom
  (analogo per panX, panY, overlay)

Display (editing):
  activeZoom = editingMode === "mobile" ? editZoomMobile : editZoom
  (analogo per panX, panY, overlay)

Handlers:
  handleZoomChange, handleOverlayChange, updatePan, handleReset
    → tutti leggono editingMode per decidere quale set modificare
  handleSave → persiste entrambi i set
  handleCancel → ripristina entrambi i set dalle props
```
